# Workspace product shell and module hosting

## Audit and retained boundaries

Before V2, `PrivateShell` presented a global topbar and a second horizontal context bar. `SpaceSwitcher` correctly grouped accessible spaces and used the existing activation route; `WorkspaceNavigation` mixed overview, business modules, Team members, and settings in one horizontally scrolling list. This worked with a few destinations but did not communicate platform/Space/module levels and would become difficult to scan beyond ten modules. `PageHeader` already provided a sound page hierarchy. Settings and Members already repeated server-side authorization and keep their routes and business actions unchanged.

The production module registry is intentionally empty. Resolution already separated availability, activation, entitlement, and capability, then emitted only accessible navigation. This phase keeps those authority rules, Auth, OWNER, lifecycle, provisioning, memberships, Billing Core, and Integration Core unchanged. It adds presentation metadata and hosting primitives only.

## Architecture decision

The final composition is a **hybrid global topbar plus compact Space sidebar**:

1. the sticky global bar contains the Zero Limit mark and real Space switcher;
2. the Space sidebar contains current Space context and categorized destinations;
3. the central work area hosts dashboard, system page, or module content;
4. the account area is stable at the bottom of the Space sidebar (and remains in the topbar when no Space is active).

A top navigation was rejected because ten or more modules force horizontal scrolling and flatten hierarchy. A sidebar without a global bar was rejected because Space switching and Zero Limit identity are cross-Space concerns. A narrow icon-only rail was rejected because unfamiliar future modules need labels and would create tooltip dependence. The hybrid remains legible for Personal, Creator, and Team while preserving the central work area.

## Navigation domains

- **Global / platform:** brand, Space switcher, Zero Limit identity link, current language, logout. Orbs, Learn, conferences, replays, global search, and notifications remain future platform resources; they are not registered as Space modules and no inert controls are rendered.
- **Space:** overview/dashboard plus the visible context (type, profession for Personal, Creator context, or Team role).
- **Work:** accessible business modules, supplied exclusively by registry resolution.
- **Manage:** Settings for every active Space and Members only for Team. These are system destinations, not manifests.
- **Account:** the existing identity destination, locale display, and logout. No fake account screen is introduced.

Server authorization remains final. Hiding Members for Personal/Creator is only presentation; the Members route independently rejects non-Team access.

## Registry integration

`moduleRegistry` remains the sole business-module catalog. A manifest's `navigation` object can supply:

- `labelKey`: localized display label;
- `icon`: a reviewed system-icon identifier;
- `section`: currently the validated `work` section;
- `priority`: `primary` or `overflow`.

`order`, route, visibility, compatibility, release state, entitlements, and capabilities remain on the existing manifest. The resolver emits normalized navigation only after access checks. There is no parallel UI registry. Defaults keep older manifests compatible (`module`, `work`, `primary`).

## Overflow and future personalization

The sidebar shows up to six primary resolved modules and places all remaining or explicitly overflow-priority entries behind an accessible **More** disclosure. Because links retain their canonical registry route, overflow cannot alter routing. The sidebar itself scrolls on short displays. Mobile uses one labeled drawer rather than a long horizontal list; Escape and the scrim close it.

Future pinned/favorite ordering can be applied as a user-specific ordering layer *after* authoritative resolution and before the primary/overflow split. It must never grant access, mutate manifests, or persist inside this shell. Until a real preference service exists, no pins are shown or stored.

## Module host convention

`ModuleShell` is a deliberately small presentation primitive. It composes an optional icon, `PageHeader` title/description/status/actions, optional real subnavigation, and a content slot. A module route must still call `requireModuleAccess` before rendering; the host is not an authorization boundary. Do not render speculative tabs. Module-specific filters and actions belong in the module header/content, not the global or Space navigation.

To add a module:

1. add one validated manifest to `lib/workspace/module-registry.js` with canonical route and navigation metadata;
2. add its i18n label and only a reviewed, actually used icon;
3. create the canonical module route and call `requireModuleAccess` server-side before data access;
4. render `ModuleShell` and include subnavigation only for implemented destinations;
5. add access, route, responsive, and accessibility tests.

## Dashboard foundation

`/espace/[spaceId]` remains the Space dashboard. Its header and real Space context are followed by restrained empty regions for “To do” and recent activity. They contain no KPI, analytics, or fabricated records. Future primary/secondary widgets and module shortcuts can replace those regions using resolved data.

## Responsive and accessibility

- Large desktop/laptop: 240 px compact sidebar and fluid central work area, capped as one product environment.
- Tablet: the sidebar becomes an overlay drawer; content retains product gutters.
- Mobile: the topbar retains brand/switcher, a dedicated 48 px navigation trigger opens the drawer, and dashboard/module-header layouts stack.
- Long Space names truncate without changing the grid. Sidebar and switcher menus independently scroll.
- Active links use `aria-current`; disclosures use `aria-expanded`/`aria-controls`; Space switching and the mobile drawer support Escape; focus rings and 44 px targets are retained; reduced motion disables drawer transition.

## Icons

Only five unmodified Boxicons system SVGs are promoted from `design/icon-library/source` to `public/workspace-icons`: overview, generic module, members, settings, and overflow. Attribution is stored beside them. The source library is not published. Product/brand icons remain a separate future concern.

## Future compatibility, not implementation

- **Public profile:** Zero Limit ID may later expose an explicitly opt-in profile with bio, experience, past structures, links, per-field visibility, and a reversible publish switch. Workspace/onboarding data may propose prefill values but must never publish automatically.
- **Post-purchase onboarding:** a future flow may produce typed preferences for dashboard emphasis, priorities, highlighted resolved modules, professional context, recommendations, and profile prefill. These preferences decorate authorized output; they cannot change access.
- **Platform services:** Orbs remains a global resource, separate from billing, points, rewards, and gamification. Search/notifications gain topbar affordances only when functional.
- **Gamification:** points, XP, levels, streaks, rewards, and shops are a separate product project. The shell has no dependency on them.

## Deliberate debt

No real business module exists yet, so overflow is covered with registry fixtures/tests rather than fake production entries. Preview review with authenticated Personal and Team data remains necessary. Search, notifications, platform-resource navigation, persistence for pins, public profiles, onboarding, and gamification remain intentionally unimplemented.
