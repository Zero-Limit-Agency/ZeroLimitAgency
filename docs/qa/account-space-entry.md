# Account → Space entry

## Before

- Password login, confirmation and completed onboarding landed on `/identite`.
- The account page announced a future Workspace and provided only logout.
- The Workspace profile link returned to that dead end.
- Invitation authentication links carried `next`, but onboarding did not preserve it.
- The last-Space cookie was written by activation but not used by entry.

## After

The default authentication/confirmation/onboarding destination is
`/espace?entree=1`. This uses the existing server-authorized Space query. It resumes
a remembered Space only if it remains in that query's result, otherwise opens a
sole accessible Space or keeps the selector. `/espace` without the entry parameter
always remains the selection/creation hub. Selection goes through the existing
`/espace/[spaceId]/activer` authority check and HTTP-only preference cookie.

| State | Destination |
| --- | --- |
| Onboarding incomplete | `/identite/onboarding` |
| Invitation link + incomplete onboarding | Onboarding with allowlisted `next`, then the original invitation |
| Invitation link + completed onboarding | Original invitation, existing acceptance RPC |
| Last authorized Space or one available Space | Existing activation route, then Workspace |
| Multiple Spaces without a valid preference | Existing `/espace` selector |
| No authorized Spaces | Existing activation options; no implicit provisioning |
| Historical client with approved application and active access | Existing `/espace-client` destination on login/reconnect |

`/identite` is an explicit account page with profile details, Workspace entry,
Space selection/activation, logout, and a historical-client link when the server
confirms access. It does not provision anything. Invitation links are retained
when switching between signup and login. Recovery endpoints and historical
password-setup routes are unchanged.

No entitlement/provisioning model, migration, checkout or business module is
added. Availability of interactive provisioning retains the existing environment
flag and server-side RPC checks. Disabled activation is explained on the hub
and preparation pages; a creation form is not offered when the server disables it. Invitation discovery still requires the secure
email link: the existing model stores token hashes, not recoverable plaintext.

## Reproducing QA

Use Node 20 (`.nvmrc`), `npm ci`, and `npm test`. Run `npm run build`.
For browser integration, install Chromium with `npx playwright install chromium`
and run `npm run test:e2e:entry`. The runner builds and starts the production Next
application against an isolated local Supabase HTTP fixture and checks both
1440×1000 and 390×844 viewports. An HTTPS loopback proxy uses a temporary self-signed certificate (OpenSSL required),
so the browser exercises production CSRF/CSP and secure cookies without changing
the application policy. Only this test certificate bypasses browser trust validation. There are no real
credentials or real-account mutations in the fixture.

With the managed environment's Chromium:

```sh
QA_CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e:entry
```

Optional `QA_AGENT_BROWSER` points to the agent-browser executable for an initial
page/snapshot/screenshot/overlay check. Screenshots and Next logs are written to
`/tmp/account-space-entry` (override with `QA_OUTPUT_DIR`).

Coverage: signup and confirmation; incomplete onboarding; zero-Space activation;
Workspace Compte link → account → Workspace; logout; selection hub; reconnect with last-Space preference; invalid
preference; revoked entitlements and foreign Space denial; invitation through
authentication/onboarding/acceptance; historical-client login/reconnect; forgot
password, password update and subsequent login. Screenshots check account,
onboarding, empty hub, active Workspace and invitation layouts; browser exceptions,
error overlays and horizontal overflow fail the run. A separate production-mode
case checks disabled activation, its 503 response, and continued access to an
existing Space.

Limits: the HTTP fixture exercises real application routes, cookies and frontend
behavior, but does not establish deployed Supabase schema/RLS/RPC readiness or
actual email delivery. Those require a configured Preview integration smoke test.
The existing dev CSP blocks Next dev's eval-based hydration; the browser suite
therefore uses the production build without relaxing CSP.
