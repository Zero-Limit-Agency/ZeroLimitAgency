// Real Next UI/API against isolated HTTP fixtures; deployed RLS and email delivery are not exercised.
// Runs the real Next frontend and API routes against an isolated Supabase HTTP
// fixture. This verifies routing/UI integration, not deployed RLS or email delivery.
import assert from 'node:assert/strict';
import { createServer, request as httpRequest } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, writeFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { chromium } from 'playwright';

const port = Number(process.env.QA_APP_PORT || 3310);
const backendPort = port + 1;
const origin = `https://127.0.0.2:${port + 2}`;
const invitation = `/invitation/team/${'a'.repeat(43)}`;
const user = { id: 'fixture-user', email: 'qa@example.test', email_confirmed_at: '2026-10-05T00:00:00Z' };
const profileId = 'fixture-profile';
let state;
function space(kind = 'creator', status = 'active') { return { id: `${kind}-a`, kind, name: `QA ${kind}`, status, owner_profile_id: kind === 'team' ? null : profileId, organization_id: kind === 'team' ? 'team-org' : null, personal_profession: kind === 'personal' ? 'coach' : null }; }
function reset({ spaces = [], completed = true, actor = 'owner', revoked = false } = {}) {
  state = { profile: { id: profileId, auth_user_id: user.id, username: 'qa_user', display_name: 'QA Member', preferred_locale: 'fr', onboarding_completed_at: completed ? '2026-10-05T00:00:00Z' : null, onboarding_intent: 'creator' }, spaces, actor, revoked, calls: [], invitations: [], recoveryFails: false };
}
function members() {
  return [
    { membership_id: 'owner-membership', profile_id: state.actor === 'owner' ? profileId : 'other-owner', display_name: 'Team Owner', username: 'owner', role: 'admin', is_owner: true, joined_at: '2026-10-05' },
    { membership_id: 'admin-membership', profile_id: state.actor === 'admin' ? profileId : 'other-admin', display_name: 'Team Admin', username: 'admin', role: 'admin', is_owner: false, joined_at: '2026-10-05' },
    { membership_id: 'member-membership', profile_id: state.actor === 'member' ? profileId : 'other-member', display_name: 'Team Member', username: 'member', role: 'member', is_owner: false, joined_at: '2026-10-05' }
  ].filter(m => !state.removed || m.membership_id !== 'member-membership');
}
const auth = { access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 3600, user };
const backend = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let raw = ''; for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  state.calls.push({ path: url.pathname, method: req.method, body, authorization: req.headers.authorization });
  let data = [], status = 200;
  if (url.pathname === '/auth/v1/user') {
    if (req.headers.authorization !== 'Bearer fixture-access') { status = 401; data = { message: 'Invalid token' }; }
    else data = user;
  } else if (url.pathname === '/auth/v1/token') data = auth;
  else if (url.pathname === '/auth/v1/signup') data = { user };
  else if (url.pathname === '/auth/v1/recover') { status = state.recoveryFails ? 500 : 200; data = state.recoveryFails ? { message: 'Fixture provider outage' } : {}; }
  else if (url.pathname === '/rest/v1/profiles') { if (req.method === 'PATCH') Object.assign(state.profile, body); data = [state.profile]; }
  else if (url.pathname === '/rest/v1/spaces') data = state.spaces.filter(s => url.searchParams.get('kind') === 'eq.team' ? s.kind === 'team' : s.kind !== 'team');
  else if (url.pathname === '/rest/v1/organization_memberships') data = state.spaces.some(s => s.kind === 'team') && !state.left ? [{ organization_id: 'team-org', profile_id: profileId, role: state.actor === 'member' ? 'member' : 'admin' }] : [];
  else if (url.pathname === '/rest/v1/organizations') data = [{ id: 'team-org', name: 'QA team', owner_profile_id: state.actor === 'owner' ? profileId : 'other-owner' }];
  else if (url.pathname === '/rest/v1/zero_limit_entitlements') data = state.spaces.map(s => ({ key: `${s.kind}_access`, space_id: s.kind === 'team' ? null : s.id, organization_id: s.organization_id, status: state.revoked ? 'revoked' : 'active', starts_at: '2020-01-01', expires_at: null }));
  else if (url.pathname === '/rest/v1/rpc/provision_creator_space') { assert.equal(req.headers.authorization, 'Bearer fixture-service'); state.spaces.push(space()); data = 'creator-a'; }
  else if (url.pathname.startsWith('/rest/v1/rpc/')) {
    assert.equal(req.headers.authorization, 'Bearer fixture-access', 'Core RPCs retain caller authority');
    const rpc = url.pathname.split('/').at(-1);
    const current = state.spaces.find(s => s.id === body.space_value);
    if (rpc === 'get_workspace_settings') data = !current ? [] : [{ ...current, organization_name: 'QA team', organization_slug: 'qa-team', owner_profile_id: state.actor === 'owner' ? profileId : 'other-owner', owner_display_name: 'QA Owner', is_owner: state.actor === 'owner', member_role: state.actor === 'member' ? 'member' : 'admin', entitlement_active: !state.revoked }];
    else if (rpc === 'update_workspace_settings') {
      if (state.actor !== 'owner') { status = 403; data = { code: '42501', message: 'settings_owner_required' }; }
      else if (body.operation_value === 'restore' && state.revoked) { status = 403; data = { code: '42501', message: 'entitlement_required' }; }
      else if (body.operation_value === 'archive') current.status = 'archived';
      else if (body.operation_value === 'restore') current.status = 'active';
      else if (body.operation_value === 'rename_space') current.name = body.value_value;
    } else if (rpc === 'get_team_members') data = members();
    else if (rpc === 'get_pending_team_invitations') data = state.invitations;
    else if (rpc === 'create_team_invitation') { state.invitations = [{ id: 'invitation-a', email: body.email_value, role: body.role_value, expires_at: body.expires_at_value, created_at: '2026-10-05', invited_by_display_name: 'QA Owner' }]; data = 'invitation-a'; }
    else if (rpc === 'resend_team_invitation') data = state.invitations[0].email;
    else if (rpc === 'revoke_team_invitation') state.invitations = [];
    else if (rpc === 'remove_team_member') state.removed = true;
    else if (rpc === 'leave_team') state.left = true;
    else if (rpc === 'accept_team_invitation') { if (!state.spaces.some(s => s.kind === 'team')) state.spaces.push(space('team')); data = 'team-a'; }
  }
  res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data));
});
reset(); await new Promise(resolve => backend.listen(backendPort, '127.0.0.1', resolve));
const env = { ...process.env, NODE_ENV: 'production', NEXT_PUBLIC_APP_URL: origin, NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${backendPort}`, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fixture-anon', SUPABASE_SERVICE_ROLE_KEY: 'fixture-service', RESEND_API_KEY: '', ZERO_LIMIT_EMAIL_FROM: '', VERCEL_ENV: 'development', ZERO_LIMIT_INTERACTIVE_PROVISIONING: 'enabled' };
if (process.env.QA_SKIP_BUILD !== '1') await new Promise((resolve, reject) => {
  const build = spawn('npm', ['run', 'build'], { env, stdio: 'inherit' });
  build.on('exit', code => { if (code === 0) resolve(); else { backend.closeAllConnections(); backend.close(); reject(new Error(`Build failed: ${code}`)); } });
});
const tlsDir = await mkdtemp('/tmp/core-reliability-tls-');
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
const evidence = process.env.QA_OUTPUT_DIR || '/tmp/core-reliability';
await mkdir(evidence, { recursive: true });
try {
  for (let n = 0; n < 120; n++) {
    if (app.exitCode !== null) throw new Error(`Next exited: ${log}`);
    try { if ((await fetch(`http://localhost:${port}/connexion`)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  browser = await chromium.launch({ ...(process.env.QA_CHROMIUM_PATH ? { executablePath: process.env.QA_CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, ignoreHTTPSErrors: true, userAgent: `Core-QA-${viewport.width}` });
    await context.route('**/_vercel/insights/script.js', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    const page = await context.newPage();
    page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(20000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.accept());
    async function session() { await context.addCookies([{ name: 'zla_client_access_token', value: 'fixture-access', url: origin, httpOnly: true }]); }
    async function goto(path) { await page.goto(`${origin}${path}`); await page.waitForLoadState('networkidle'); }
    async function layout(name) {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name} overflow at ${viewport.width}`);
      await page.screenshot({ path: `${evidence}/${viewport.width}-${name}.png`, fullPage: true });
    }
    async function failures(endpoint, click, feedback, preserved) {
      for (const failure of (endpoint === '/api/auth/logout' ? ['network', 'http-error'] : ['network', 'invalid-json', 'explicit-failure'])) {
        const before = page.url();
        await page.route(`**${endpoint}`, route => failure === 'network' ? route.abort('failed') : route.fulfill({ status: failure === 'http-error' ? 503 : 200, contentType: failure === 'invalid-json' ? 'text/html' : 'application/json', body: failure === 'invalid-json' ? '<html>Gateway failed</html>' : JSON.stringify({ success: false }) }));
        await click(); await feedback.waitFor();
        assert.equal(page.url(), before, `${endpoint}: failure must not navigate`);
        assert.equal(await page.locator('[aria-busy=true]').count(), 0, `${endpoint}: not stuck loading`);
        await preserved?.();
        await page.unroute(`**${endpoint}`);
      }
    }

    // Every Core form recovers from transport and invalid/negative responses.
    reset(); await context.clearCookies(); await goto('/connexion');
    await page.getByLabel('Adresse email').fill(user.email);
    await page.getByLabel('Mot de passe', { exact: true }).fill('fixture-password');
    await failures('/api/id/login', () => page.getByRole('button', { name: 'Se connecter', exact: true }).click(), page.locator('.identity-feedback.error'), async () => assert.equal(await page.getByLabel('Adresse email').inputValue(), user.email));
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await page.waitForURL(`${origin}/espace?entree=1`);
    await context.clearCookies(); await goto('/inscription');
    await page.getByLabel('Adresse email').fill(user.email);
    await page.getByLabel('Mot de passe', { exact: true }).fill('fixture-password');
    await page.getByLabel('Confirmer le mot de passe').fill('fixture-password');
    await page.locator('input[name=terms]').check();
    await failures('/api/id/signup', () => page.getByRole('button', { name: 'Créer mon Zero Limit ID' }).click(), page.locator('.identity-feedback.error'));
    await page.getByRole('button', { name: 'Créer mon Zero Limit ID' }).click(); await page.getByRole('status').filter({ hasText: 'Consultez votre boîte email' }).waitFor();
    await goto('/mot-de-passe-oublie'); await page.getByLabel('Adresse email').fill(user.email);
    await failures('/api/id/forgot-password', () => page.getByRole('button', { name: 'Envoyer le lien' }).click(), page.locator('.identity-feedback.error'));
    state.recoveryFails = true; await page.getByRole('button', { name: 'Envoyer le lien' }).click(); await page.locator('.identity-feedback.error').waitFor();
    state.recoveryFails = false; await page.getByRole('button', { name: 'Envoyer le lien' }).click(); await page.locator('.identity-feedback.success').waitFor();
    state.recoveryFails = true;
    const legacyFailure = await context.request.post(`${origin}/api/auth/forgot-password`, { headers: { origin }, data: { email: user.email } });
    assert.equal(legacyFailure.status(), 500); assert.equal((await legacyFailure.json()).success, false);
    state.recoveryFails = false;
    const legacySuccess = await context.request.post(`${origin}/api/auth/forgot-password`, { headers: { origin }, data: { email: user.email } });
    assert.equal((await legacySuccess.json()).success, true);
    await goto('/nouveau-mot-de-passe#access_token=fixture-access');
    await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('fixture-password'); await page.getByLabel('Confirmer le mot de passe').fill('fixture-password');
    await failures('/api/id/update-password', () => page.getByRole('button', { name: 'Modifier le mot de passe' }).click(), page.locator('.identity-feedback.error'));
    await page.getByRole('button', { name: 'Modifier le mot de passe' }).click(); await page.locator('.identity-feedback.success').waitFor();
    await page.route('**/api/id/session', route => route.abort('failed'));
    await goto('/confirmation#access_token=fixture-access&refresh_token=fixture-refresh'); await page.getByRole('button', { name: 'Réessayer' }).waitFor();
    assert.ok(page.url().includes('#access_token='), 'failed confirmation preserves tokens for explicit retry');
    await page.unroute('**/api/id/session'); await page.getByRole('button', { name: 'Réessayer' }).click(); await page.waitForURL(`${origin}/espace?entree=1`);
    reset({ completed: false }); await session(); await goto('/identite/onboarding');
    await page.locator('input[name=username]').fill('qa_user'); await page.locator('input[name=displayName]').fill('QA Member');
    await page.getByRole('button', { name: 'Continuer', exact: true }).click(); await page.getByRole('button', { name: 'Continuer', exact: true }).click(); await page.locator('input[value=creator]').check();
    await failures('/api/id/onboarding', () => page.getByRole('button', { name: 'Terminer', exact: true }).click(), page.locator('.identity-feedback.error'));
    await page.getByRole('button', { name: 'Terminer', exact: true }).click(); await page.waitForURL(`${origin}/espace?entree=1`);
    await goto('/espace/preparation/creator'); await page.getByRole('button', { name: 'Vérifier avant de créer' }).click();
    await failures('/api/spaces/provision', () => page.getByRole('button', { name: 'Activer mon espace Creator' }).click(), page.locator('.identity-feedback.error'));
    await page.getByRole('button', { name: 'Activer mon espace Creator' }).click(); await page.waitForURL(`${origin}/espace/creator-a`);

    // Personal, Creator and Team can be restored through the hub after archive.
    for (const kind of ['personal', 'creator', 'team']) {
      reset({ spaces: [space(kind)] }); await goto(`/espace/${kind}-a/settings`);
      if (kind === 'creator') {
        await page.getByLabel('Nom de l’espace').fill('Renamed Creator');
        await failures('/api/spaces/creator-a/settings', () => page.getByRole('button', { name: 'Renommer', exact: true }).click(), page.getByRole('status').filter({ hasText: 'La modification a échoué' }), async () => assert.equal(await page.getByLabel('Nom de l’espace').inputValue(), 'Renamed Creator'));
        await page.getByRole('button', { name: 'Renommer', exact: true }).click(); await page.getByRole('heading', { name: 'Renamed Creator' }).waitFor();
      }
      await page.getByRole('button', { name: 'Archiver l’espace' }).click(); await page.getByRole('button', { name: 'Restaurer l’espace' }).waitFor();
      await layout(`${kind}-archived-settings`);
      assert.equal(await page.getByRole('button', { name: 'Renommer', exact: true }).count(), 0);
      await goto(`/espace/${kind}-a`); await page.getByRole('heading', { name: 'Espace indisponible' }).waitFor();
      await goto('/espace'); await page.getByRole('heading', { name: 'Archivé', exact: true }).waitFor(); await layout(`${kind}-archived-hub`);
      const recover = page.getByRole('link').filter({ hasText: 'Restaurer l’espace' }); assert.equal(await recover.count(), 1);
      await recover.click(); await page.getByRole('button', { name: 'Restaurer l’espace' }).click(); await page.getByRole('button', { name: 'Archiver l’espace' }).waitFor();
      assert.equal(state.spaces[0].status, 'active');
      await goto('/espace'); assert.equal(await page.getByRole('heading', { name: 'Archivé', exact: true }).count(), 0);
    }
    reset({ spaces: [space('creator', 'archived')], revoked: true }); await goto('/espace');
    await page.getByRole('link').filter({ hasText: 'Restaurer l’espace' }).click(); assert.equal(await page.getByRole('button', { name: 'Restaurer l’espace' }).isDisabled(), true);
    reset({ spaces: [space('creator', 'suspended')] }); await goto('/espace/creator-a/settings'); assert.equal(await page.getByRole('button', { name: 'Restaurer l’espace' }).count(), 0);
    await goto('/espace/foreign/settings'); await page.getByRole('heading', { name: 'Espace indisponible' }).waitFor();

    // Invitation creation persists before delivery: no fabricated sent/pending.
    reset({ spaces: [space('team')] }); await goto('/espace/team-a/membres');
    await page.locator('.invite-form input[name=email]').fill('invite@example.test');
    await failures('/api/team/invitations', () => page.getByRole('button', { name: 'Envoyer l’invitation' }).click(), page.locator('.invite-form .identity-feedback.error'), async () => assert.equal(await page.locator('.invite-form input[name=email]').inputValue(), 'invite@example.test'));
    await page.getByRole('button', { name: 'Envoyer l’invitation' }).click(); await page.locator('.invite-form .identity-feedback.error').filter({ hasText: 'email n’a pas été envoyé' }).waitFor();
    await page.getByText('invite@example.test', { exact: true }).waitFor(); assert.equal(await page.locator('.invite-form input[name=email]').inputValue(), 'invite@example.test');
    await failures('/api/team/management', () => page.getByRole('button', { name: 'Renvoyer', exact: true }).click(), page.locator('.team-feedback.error'));
    await page.getByRole('button', { name: 'Renvoyer', exact: true }).click(); await page.locator('.team-feedback.error').filter({ hasText: 'L’ancien lien est invalide' }).waitFor(); await layout('team-delivery-failure');
    // Delivery success UI is mocked; no external email is sent by QA.
    await page.route('**/api/team/management', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, delivery: 'sent' }) }));
    await page.getByRole('button', { name: 'Renvoyer', exact: true }).click(); await page.locator('.team-feedback.success').waitFor(); await page.unroute('**/api/team/management');
    await page.getByRole('button', { name: 'Révoquer', exact: true }).click(); await page.getByText('Aucune invitation en attente.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Retirer', exact: true }).last().click(); await page.locator('.team-feedback.success').waitFor(); assert.equal(state.removed, true);
    // Owner/admin/member control visibility preserves the existing hierarchy.
    for (const actor of ['admin', 'member']) {
      reset({ spaces: [space('team')], actor }); await goto('/espace/team-a/membres');
      assert.equal(await page.getByRole('button', { name: 'Promouvoir admin', exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Retirer', exact: true }).count(), actor === 'admin' ? 1 : 0);
      assert.equal(await page.locator('.invite-form').count(), actor === 'admin' ? 1 : 0);
      await goto('/espace/team-a/settings'); assert.equal(await page.getByRole('button', { name: 'Archiver l’espace' }).count(), 0);
      await goto('/espace/team-a/membres'); await page.getByRole('button', { name: 'Quitter la Team', exact: true }).click(); await page.waitForURL(`${origin}/espace`); assert.equal(state.left, true);
    }
    reset(); await session(); await goto(invitation);
    await failures('/api/team/invitations/accept', () => page.getByRole('button', { name: 'Accepter l’invitation' }).click(), page.locator('.identity-feedback.error'));
    await page.getByRole('button', { name: 'Accepter l’invitation' }).click(); await page.waitForURL(`${origin}/espace/team-a`);
    if (viewport.width < 960) await page.getByRole('button', { name: 'Navigation', exact: true }).click();
    await failures('/api/auth/logout', () => page.getByRole('button', { name: 'Se déconnecter', exact: true }).click(), page.getByRole('alert').filter({ hasText: 'Déconnexion impossible' }));
    await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click(); await page.waitForURL(`${origin}/connexion`);
    assert.equal((await context.cookies()).some(c => c.name === 'zla_client_access_token'), false);
    assert.deepEqual(errors, [], 'no unhandled browser errors');
    console.log(`PASS ${viewport.width}px: Core network recovery, archive/restore, Team delivery/errors/roles/accept/revoke/remove/leave, logout`);
    await context.close();
  }
} finally {
  await browser?.close(); app.kill('SIGTERM'); frontend.closeAllConnections(); await new Promise(resolve => frontend.close(resolve)); await rm(tlsDir, { recursive: true, force: true }); backend.closeAllConnections(); await new Promise(resolve => backend.close(resolve));
  await writeFile(`${evidence}/next.log`, log);
}
