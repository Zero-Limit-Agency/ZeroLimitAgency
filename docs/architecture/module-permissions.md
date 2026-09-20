# Module permissions

Capabilities are a small core vocabulary, not a database catalogue of every future action.

Personal and Creator owners receive `consume_modules`, `manage_settings`, and `manage_modules`. Team capability derivation uses canonical ownership first:

| Authority | Core capabilities |
|---|---|
| owner (`organizations.owner_profile_id`) | consume modules, manage members/settings/modules |
| admin membership | consume modules, limited member management |
| member membership | consume modules |

Owner is intentionally absent from membership role values. Admin module management is a deferred product policy and is therefore not granted today. A module declares only core entry capabilities in its manifest. Its internal `read`, `write`, or `manage` actions belong to its own backend policy/RLS and completion review.

`canAccessModule` is represented by resolver accessibility. Management checks use `manage_modules` plus server-side space access. Navigation is merely a projection of authorization, never an authorization mechanism. Unknown, incompatible, disabled, unentitled, and unpermitted requests all fail closed; externally exposed handlers should map them to a non-disclosing 404/403 policy.
