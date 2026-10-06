// Runs the real Next frontend and API routes against an isolated Supabase HTTP
// fixture. This verifies routing/UI integration, not deployed RLS or email delivery.
import assert from 'node:assert/strict';
import { createServer, request as httpRequest } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, writeFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { chromium } from 'playwright';

const port = Number(process.env.QA_APP_PORT || 3210);
const backendPort = port + 1;
const origin = `https://127.0.0.2:${port + 2}`;
const invitation = `/invitation/team/${'a'.repeat(43)}`;
const user = { id: 'fixture-user', email: 'qa@example.test', email_confirmed_at: '2026-10-05T00:00:00Z' };
let state;
function reset({ completed = true, spaces = [], legacy = false, revoked = false } = {}) {
  state = { profile: { id: 'fixture-profile', auth_user_id: user.id, username: 'qa_user', display_name: 'QA Member', preferred_locale: 'fr', onboarding_completed_at: completed ? '2026-10-05T00:00:00Z' : null, onboarding_intent: 'creator' }, spaces, legacy, revoked, calls: [] };
}
function creator(id = 'creator-a') { return { id, kind: 'creator', name: `Creator ${id}`, status: 'active', owner_profile_id: 'fixture-profile' }; }
const auth = { access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 3600, user };
const backend = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let raw = ''; for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  state.calls.push({ redirectTo: url.searchParams.get('redirect_to'), path: url.pathname, method: req.method, body, authorization: req.headers.authorization });
  let data = [], status = 200;
  if (url.pathname === '/auth/v1/user') {
    if (req.headers.authorization !== 'Bearer fixture-access') { status = 401; data = { message: 'Invalid token' }; }
    else data = req.method === 'PUT' ? { ...user } : user;
  } else if (url.pathname === '/auth/v1/token') data = auth;
  else if (url.pathname === '/auth/v1/signup') data = { user };
  else if (url.pathname === '/auth/v1/recover') data = {};
  else if (url.pathname === '/rest/v1/profiles') {
    if (req.method === 'PATCH') Object.assign(state.profile, body);
    data = [state.profile];
  } else if (url.pathname === '/rest/v1/spaces') data = state.spaces.filter(s => url.searchParams.get('kind') === 'eq.team' ? s.kind === 'team' : s.kind !== 'team');
  else if (url.pathname === '/rest/v1/organization_memberships') data = state.spaces.some(s => s.kind === 'team') ? [{ organization_id: 'team-org', profile_id: state.profile.id, role: 'member' }] : [];
  else if (url.pathname === '/rest/v1/organizations') data = [{ id: 'team-org', name: 'QA Team', owner_profile_id: 'other' }];
  else if (url.pathname === '/rest/v1/zero_limit_entitlements') data = state.spaces.map(s => ({ key: s.kind === 'team' ? 'team_access' : 'creator_access', space_id: s.id, organization_id: s.organization_id, status: state.revoked ? 'revoked' : 'active', starts_at: '2020-01-01', expires_at: null }));
  else if (url.pathname === '/rest/v1/client_access') data = state.legacy ? [{ application_id: 'legacy-app', status: 'active', user_id: user.id }] : [];
  else if (url.pathname === '/rest/v1/applications') data = state.legacy ? [{ id: 'legacy-app', status: 'approved' }] : [];
  else if (url.pathname === '/rest/v1/rpc/provision_creator_space') {
    assert.equal(req.headers.authorization, 'Bearer fixture-service');
    state.spaces.push(creator()); data = 'creator-a';
  } else if (url.pathname === '/rest/v1/rpc/accept_team_invitation') {
    assert.equal(req.headers.authorization, 'Bearer fixture-access');
    state.spaces.push({ id: 'team-a', kind: 'team', name: 'QA Team', status: 'active', organization_id: 'team-org' }); data = 'team-a';
  }
  res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data));
});
reset(); await new Promise(resolve => backend.listen(backendPort, '127.0.0.1', resolve));
const trustedOrigin = origin;
const env = { ...process.env, NODE_ENV: 'production', NEXT_PUBLIC_APP_URL: trustedOrigin, NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${backendPort}`, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fixture-anon', SUPABASE_SERVICE_ROLE_KEY: 'fixture-service', VERCEL_ENV: 'development', ZERO_LIMIT_INTERACTIVE_PROVISIONING: 'enabled' };
if (process.env.QA_SKIP_BUILD !== '1') await new Promise((resolve, reject) => {
  const build = spawn('npm', ['run', 'build'], { env, stdio: 'inherit' });
  build.on('exit', code => { if (code === 0) resolve(); else { backend.closeAllConnections(); backend.close(); reject(new Error(`Build failed: ${code}`)); } });
});
const tlsDir = await mkdtemp('/tmp/account-space-tls-');
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', `${tlsDir}/key.pem`, '-out', `${tlsDir}/cert.pem`, '-days', '1', '-subj', '/CN=Account Space QA', '-addext', 'subjectAltName=IP:127.0.0.2'], { stdio: 'ignore' });
const frontend = createHttpsServer({ key: await readFile(`${tlsDir}/key.pem`), cert: await readFile(`${tlsDir}/cert.pem`) }, (req, res) => {
  const upstream = httpRequest({ hostname: '127.0.0.1', port, path: req.url, method: req.method, headers: { ...req.headers, 'x-forwarded-proto': 'https', 'x-forwarded-host': new URL(origin).host } }, incoming => {
    const headers = { ...incoming.headers };
    if (headers.location) {
      const target = new URL(headers.location, origin);
      if (['localhost', '127.0.0.1', '127.0.0.2'].includes(target.hostname)) headers.location = new URL(target.pathname + target.search, origin).href;
    }
    res.writeHead(incoming.statusCode, headers); incoming.pipe(res);
  });
  upstream.on('error', () => { res.writeHead(502); res.end(); }); req.pipe(upstream);
});
await new Promise(resolve => frontend.listen(port + 2, '0.0.0.0', resolve));
let app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], { env, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; app.stdout.on('data', d => log += d); app.stderr.on('data', d => log += d);
let browser;
const evidence = process.env.QA_OUTPUT_DIR || '/tmp/account-space-entry';
await mkdir(evidence, { recursive: true });
try {
  for (let n = 0; n < 120; n++) {
    if (app.exitCode !== null) throw new Error(`Next exited: ${log}`);
    try { if ((await fetch(`http://localhost:${port}/connexion`)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  // Optional first visual check using the agent-browser CLI available in the
  // managed frontend environment, before Playwright exercises the full flows.
  if (process.env.QA_AGENT_BROWSER) {
    for (const args of [['open', `http://localhost:${port}/connexion`], ['snapshot', '-i'], ['screenshot', `${evidence}/initial.png`], ['eval', 'document.querySelector("[data-nextjs-dialog]") ? "ERROR_OVERLAY" : "OK"'], ['close']]) {
      await new Promise((resolve, reject) => {
        const child = spawn(process.env.QA_AGENT_BROWSER, args, { stdio: 'inherit' });
        child.on('exit', code => code === 0 ? resolve() : reject(new Error(`agent-browser exit ${code}`)));
      });
    }
  }
  browser = await chromium.launch({ ...(process.env.QA_CHROMIUM_PATH ? { executablePath: process.env.QA_CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, ignoreHTTPSErrors: true });
    await context.route('**/_vercel/insights/script.js', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    const page = await context.newPage();
    page.on('response', async r => { if (r.status() === 403) console.error('DENIED', r.url(), await r.text()); });
    page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(20000);
    const errors = []; page.on('pageerror', e => { errors.push(e.message); console.error('BROWSER ERROR', e.message); });
    page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
    async function session() { await context.addCookies([{ name: 'zla_client_access_token', value: 'fixture-access', url: origin, httpOnly: true }]); }
    async function goto(path) { console.log(`VISIT ${viewport.width} ${path.split('#')[0]}`); await page.goto(`${origin}${path}`); await page.waitForLoadState('networkidle'); if (await page.locator('form.identity-form').count()) await page.waitForFunction(() => Array.from(document.querySelectorAll('form.identity-form')).every(form => Object.keys(form).some(key => key.startsWith('__reactProps') && typeof form[key]?.onSubmit === 'function'))); }
    async function url(path) { await page.waitForURL(`${origin}${path}`); }
    async function layout(name) {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name} overflow`);
      assert.equal(await page.locator('[data-nextjs-dialog]').count(), 0);
      await page.screenshot({ path: `${evidence}/${viewport.width}-${name}.png`, fullPage: true });
    }
    async function onboard() {
      await page.locator('input[name=username]').fill('qa_user');
      await page.locator('input[name=displayName]').fill('QA Member');
      await page.getByRole('button', { name: 'Continuer', exact: true }).click();
      await page.getByRole('button', { name: 'Continuer', exact: true }).click();
      await page.locator('input[value=creator]').check();
      await page.getByRole('button', { name: 'Terminer', exact: true }).click();
    }
    reset({ completed: false });
    await goto('/inscription');
    await page.getByLabel('Adresse email').fill(user.email);
    await page.getByLabel('Mot de passe', { exact: true }).fill('fixture-password');
    await page.getByLabel('Confirmer le mot de passe').fill('fixture-password');
    await page.locator('input[name=terms]').check();
    await page.getByRole('button', { name: 'Créer mon Zero Limit ID' }).click();
    await page.getByRole('status').filter({ hasText: 'Consultez votre boîte email' }).waitFor();
    const signup = state.calls.find(c => c.path === '/auth/v1/signup');
    assert.equal(new URL(signup.redirectTo).searchParams.get('next'), '/espace?entree=1');
    await goto('/confirmation#access_token=fixture-access&refresh_token=fixture-refresh');
    await url('/identite/onboarding'); await layout('onboarding'); await onboard();
    await url('/espace?entree=1'); await page.getByRole('heading', { name: 'Votre Zero Limit ID est prêt.' }).waitFor();
    assert.equal(state.spaces.length, 0); await layout('empty-hub');
    await page.getByRole('link', { name: 'Découvrir Creator', exact: true }).click();
    await page.getByRole('button', { name: 'Vérifier avant de créer' }).click();
    await page.getByRole('button', { name: 'Activer mon espace Creator' }).click();
    await url('/espace/creator-a'); await page.getByRole('heading', { name: 'Creator creator-a', exact: true }).waitFor(); await layout('workspace');
    if (viewport.width < 960) await page.getByRole('button', { name: 'Navigation', exact: true }).click();
    await page.getByRole('navigation', { name: 'Compte', exact: true }).getByRole('link').click();
    await url('/identite'); await page.getByRole('heading', { name: 'Mon compte' }).waitFor(); await layout('account');
    await page.getByRole('link', { name: 'Accéder au Workspace' }).click(); await url('/espace/creator-a');
    await goto('/espace'); await page.getByRole('heading', { name: 'Vos espaces actifs' }).waitFor();
    // Reconnect with multiple Spaces: preference is checked against current grants.
    reset({ spaces: [creator('a'), creator('b')] });
    await context.addCookies([{ name: 'zla_last_space', value: 'b', url: origin }]);
    await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click();
    await url('/connexion');
    assert.equal((await context.cookies()).some(c => c.name === 'zla_client_access_token'), false);
    await goto('/connexion'); await page.getByLabel('Adresse email').fill(user.email);
    await page.getByLabel('Mot de passe', { exact: true }).fill('fixture-password');
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await url('/espace/b');
    await context.addCookies([{ name: 'zla_last_space', value: 'foreign', url: origin }]);
    await goto('/espace?entree=1'); await page.getByRole('heading', { name: 'Vos espaces actifs' }).waitFor();
    state.revoked = true;
    await goto('/espace?entree=1'); await page.getByRole('heading', { name: 'Votre Zero Limit ID est prêt.' }).waitFor();
    const denied = await context.request.get(`${origin}/espace/b/activer`, { maxRedirects: 0 });
    assert.equal(new URL(denied.headers().location).pathname, '/espace');
    await goto('/espace/foreign'); await page.getByRole('heading', { name: 'Espace indisponible' }).waitFor();
    // Invitations survive signup, confirmation and onboarding, even with Spaces.
    reset({ completed: false }); await context.clearCookies();
    await goto(invitation); await page.getByRole('link', { name: 'Créer un compte', exact: true }).click();
    await url(`/inscription?next=${encodeURIComponent(invitation)}`);
    assert.equal(new URL(page.url()).searchParams.get('next'), invitation);
    await page.getByRole('link', { name: 'Déjà inscrit ? Se connecter' }).click();
    await url(`/connexion?next=${encodeURIComponent(invitation)}`);
    assert.equal(new URL(page.url()).searchParams.get('next'), invitation);
    await goto(`/confirmation?next=${encodeURIComponent(invitation)}#access_token=fixture-access&refresh_token=fixture-refresh`);
    await url(`/identite/onboarding?next=${encodeURIComponent(invitation)}`); await onboard(); await url(invitation);
    await page.getByRole('button', { name: 'Accepter l’invitation' }).waitFor(); await layout('invitation');
    await page.getByRole('button', { name: 'Accepter l’invitation' }).click(); await url('/espace/team-a');
    // Legacy reconnect continues to use server-authorized historical access.
    reset({ legacy: true });
    const legacy = await context.request.post(`${origin}/api/id/login`, { headers: { origin: trustedOrigin }, data: { email: user.email, password: 'fixture-password' } });
    assert.equal((await legacy.json()).redirectTo, '/espace-client');
    const reconnect = await context.request.get(`${origin}/connexion`, { maxRedirects: 0 });
    assert.equal(new URL(reconnect.headers().location).pathname, '/espace-client');
    // Recovery remains public; update uses the token, then normal login routing.
    reset({ spaces: [creator()] }); await context.clearCookies();
    await goto('/mot-de-passe-oublie'); await page.getByLabel('Adresse email').fill(user.email);
    await page.getByRole('button', { name: 'Envoyer le lien' }).click();
    await page.getByRole('status').filter({ hasText: 'Si un compte correspond' }).waitFor();
    assert.equal(new URL(state.calls.find(c => c.path === '/auth/v1/recover').redirectTo).pathname, '/nouveau-mot-de-passe');
    await goto('/nouveau-mot-de-passe#access_token=fixture-access');
    await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('fixture-password');
    await page.getByLabel('Confirmer le mot de passe').fill('fixture-password');
    await page.getByRole('button', { name: 'Modifier le mot de passe' }).click();
    await page.getByRole('status').filter({ hasText: 'Mot de passe modifié' }).waitFor();
    await page.getByRole('link', { name: 'Connexion', exact: true }).click();
    await page.getByLabel('Adresse email').fill(user.email); await page.getByLabel('Mot de passe', { exact: true }).fill('fixture-password');
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await url('/espace/creator-a');
    assert.deepEqual(errors, []); await context.close();
    console.log(`PASS ${viewport.width}px: signup/confirmation/onboarding/activation/account/reconnect/invitation/legacy/recovery/denied access`);
  }
  await new Promise(resolve => { app.once('exit', resolve); app.kill('SIGTERM'); });
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], { env: { ...env, VERCEL_ENV: 'production', ZERO_LIMIT_INTERACTIVE_PROVISIONING: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  app.stdout.on('data', d => log += d); app.stderr.on('data', d => log += d);
  for (let n = 0; n < 60; n++) {
    try { if ((await fetch(`http://localhost:${port}/connexion`)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  reset();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  await context.addCookies([{ name: 'zla_client_access_token', value: 'fixture-access', url: origin, httpOnly: true }]);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  await page.goto(`${origin}/espace`);
  await page.getByRole('status').filter({ hasText: 'L’activation de nouveaux Spaces' }).waitFor();
  await page.goto(`${origin}/espace/preparation/creator`);
  await page.getByRole('status').filter({ hasText: 'L’activation de nouveaux Spaces' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Vérifier avant de créer' }).count(), 0);
  const deniedActivation = await context.request.post(`${origin}/api/spaces/provision`, { headers: { origin }, data: { kind: 'creator' } });
  assert.equal(deniedActivation.status(), 503); assert.equal(state.spaces.length, 0);
  state.spaces = [creator()];
  await page.goto(`${origin}/espace?entree=1`);
  await page.waitForURL(`${origin}/espace/creator-a`);
  await context.close();
  console.log('PASS disabled activation: clear hub/preparation state, server denial, existing Space still accessible');
} finally {
  await browser?.close(); app.kill('SIGTERM'); frontend.closeAllConnections(); await new Promise(resolve => frontend.close(resolve)); await rm(tlsDir, { recursive: true, force: true }); backend.closeAllConnections(); await new Promise(resolve => backend.close(resolve));
  await writeFile(`${evidence}/next.log`, log);
}
