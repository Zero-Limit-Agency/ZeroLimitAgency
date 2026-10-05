# Module system

## Three independent states

1. **Available:** manifest compatibility matches space kind and, for Personal only, `spaces.personal_profession`.
2. **Enabled:** the compatible module is active in the product and enabled for the owning scope.
3. **Accessible:** it is enabled and the current profile satisfies entitlement and capability requirements.

Technical `status` (`active`, `disabled`, `coming_soon`) is release state, not billing. Only `active` can be enabled. Disabling retains module data.

## Registry and manifest

The production registry is code-first and intentionally empty. `createModuleRegistry` validates stable lowercase snake-case keys and rejects duplicates. A manifest contains only:

- `key`, semantic `version`;
- `supportedSpaceKinds`, optional Personal `supportedProfessions`;
- `requiredEntitlements`, `requiredCapabilities`;
- canonical `route` (`/espace/[spaceId]/modules/<key>`);
- `status`, `order`, `visibility`;
- `navigation.labelKey`, plus optional shell `icon`, `section` and `priority`;
- `defaultEnabled` (explicit bootstrap activation).

Labels are i18n keys, never identifiers. The core does not import module implementations.

## Activation scope and persistence decision

Activation is always **space-scoped** at the service boundary. For Personal/Creator this naturally addresses the owned space. For Team, a single canonical Team space currently exists per organization, so space scope is unambiguous and avoids dual configuration. Entitlements required by Team modules remain organization-scoped.

No migration is justified while there are no real modules or operator activation requirements. For the first configurable module, add one additive `space_modules(space_id, module_key, enabled, updated_at)` table with RLS and audit; do not add profile activation or a module CMS. Replace the activation adapter without changing resolver callers.

## Resolution and routing

`getAccessibleModulesForCurrentProfile(spaceId)` first requires space access, evaluates registry compatibility, activation, scoped entitlements, and capabilities, then emits normalized navigation. `requireModuleAccess(spaceId, moduleKey)` repeats these checks server-side and fails closed. Routes use `/espace/[spaceId]/modules/[moduleKey]`; each real route must call this guard before its backend/UI. No generic public placeholder exists because the registry has no product modules.

`PrivateShell` accepts normalized accessible navigation, so it never imports Calendar, Tasks, or any future module by name. Hidden modules may remain routable but must still pass the server guard.

## Entitlements

An entitlement is a commercial/product capability; a module is application functionality. Manifests may require zero or more existing entitlement keys. Never mint one entitlement per module automatically. Billing may later issue entitlements, but billing is outside this phase and cannot bypass module authorization.
