# Space switcher

## Product behavior

The switcher displays only server-authorized spaces and groups them as **Personal**, **Creator**, and **Teams**. Personal profession labels are not organization roles. Teams show their organization name and current `admin`/`member` role. Platform OWNER never appears.

It supports zero, one, or many entries. Multiple Personal professions and multiple Teams stay separate. Each selection goes through an activation endpoint which checks current access before navigation. Revoked membership, removed spaces, and inaccessible organizations return to a neutral selector or private not-found state without revealing private metadata.

With no space, the page says the Zero Limit ID is ready and offers three preparation links. These placeholders do not create a space, organization, entitlement, or subscription.

## Landings

- Personal: name, profession, owner, ready status, and module placeholder.
- Creator: name, ready status, and module placeholder.
- Team: organization name, role, canonical owner indication when applicable, ready status, and module placeholder.

No invented metrics, member counts, marketplace, billing, or business dashboard is included.

## Interaction, responsive behavior, and language

The trigger exposes `aria-expanded` and menu semantics. Opening moves focus to the first item; Escape closes and restores trigger focus. Links and buttons have visible focus states and at least 44px touch targets. At 768px and below the menu becomes a large bottom surface; long names truncate without shrinking targets. Layouts remain fluid from 320px through desktop widths.

Space groups, professions, roles, empty states, actions, and landing copy are centralized in French and English. `preferred_locale` selects the dictionary with French as fallback.

## Preview checks

1. Sign in and finish onboarding, then open `/espace`.
2. With no spaces, verify the three non-creating preparation paths.
3. Seed two Personal rows (Coach and Manager), one Creator, and Team memberships in two organizations; verify all three groups and distinct rows.
4. Select each kind and verify its minimal landing and URL.
5. Switch Team A to Team B and verify the page performs a server navigation.
6. Delete the Team A membership, revisit its URL and the saved `/espace` entry, and verify no Team A data is shown.
7. Paste another user's Personal ID and another organization's Team ID; verify the same neutral not-found response.
8. Test keyboard open, focus, Escape, and return focus, then widths 1440, 1280, 960, 768, 430, 390, 375, and 320px.
