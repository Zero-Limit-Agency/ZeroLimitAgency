# OWNER console

`/owner` is a minimal bilingual (profile locale FR/EN) private shell showing the current environment, normalized Zero Limit ID, verified security state, return-to-spaces link, and placeholder modules. It contains no invented metrics and no analytics, billing, entitlement, search, impersonation or destructive controls.

## Legacy `/admin` migration map

| Existing area | Classification | Direction |
|---|---|---|
| Applications and client records | LEGACY ADMIN | Keep existing guard; assess migration separately |
| CMS/site content and market/support settings | SHARED SERVICE | Extract server services before any OWNER UI |
| Drive/client files | LEGACY ADMIN | Do not imply OWNER or support context |
| Training/formations | LEGACY ADMIN | Keep unchanged |
| Maintenance mode | FUTURE OWNER | High-risk control; migrate only with MFA + confirmation |
| Dropmap settings | LEGACY ADMIN | Keep unchanged pending product ownership decision |

No `/admin` route or `requireAdminApiSession()` behavior changes in this phase.
