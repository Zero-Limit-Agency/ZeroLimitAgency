# Space navigation architecture

## Existing foundation and boundary

The feature reuses the authenticated Supabase session, `profiles`, `spaces`, `organizations`, `organization_memberships`, their RLS policies, and the existing Zero Limit ID onboarding. It deliberately does not use the historical `applications`, `client_access`, or `/espace-client` domain. `platform_roles` remains a separate platform authority and is never queried for navigation.

## Server access boundary

`getAccessibleSpacesForCurrentProfile()` resolves the session and profile server-side. It loads profile-owned Personal/Creator rows, the current profile's memberships, and Team rows for those organizations. It returns one normalized model. Requests use the caller JWT, RLS, and `cache: "no-store"`; they never accept a browser-supplied profile ID.

`requireSpaceAccess(spaceId)` rebuilds that caller-scoped set and only returns a matching space. Missing, deleted, cross-user, cross-organization, and revoked resources all produce the same private not-found outcome without disclosing existence. Organization ownership comes exclusively from `organizations.owner_profile_id`; the membership role remains `admin` or `member`.

Unexpected data errors are logged server-side with a correlation ID while the UI receives a generic message. Expected denial is handled locally.

## Routing and last active state

- `/espace`: authenticated selector or empty state.
- `/espace/[spaceId]`: one reusable kind-driven landing.
- `/espace/[spaceId]/activer`: revalidates access and writes `zla_last_space`.
- `/espace/preparation/[kind]`: non-creating preparation placeholder.

The last active ID is an HTTP-only, SameSite cookie, not an authorization source. `/espace` validates it against the freshly loaded accessible set. Invalid values are ignored, leading to the selector; selecting another space replaces the cookie. No migration is required.

## Private shell and future modules

`PrivateShell` owns the compact top bar, Zero Limit link, accessible-space switcher, identity/language display, logout, and content slot. Personal, Creator, and Team use the same route and shell. Future modules must be selected from the validated space kind and must repeat server authorization for their data; they must not create separate profession applications or reuse cross-organization caches.

Multi-Personal spaces are preserved row by row, including two different professions. Multi-Team spaces are preserved per Team membership. Navigation performs a full server request, so old organization data is not carried into the next space.
