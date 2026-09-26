export const OWNER_ERROR_CODES = Object.freeze({
  REQUIRED: "owner_required", MFA_REQUIRED: "owner_mfa_required", ACTION_FORBIDDEN: "owner_action_forbidden",
  LAST_OWNER_PROTECTED: "owner_last_owner_protected", SUPPORT_CONTEXT_INVALID: "owner_support_context_invalid",
  CONFIRMATION_REQUIRED: "owner_confirmation_required"
});
export class OwnerAccessError extends Error {
  constructor(code = OWNER_ERROR_CODES.REQUIRED, status = 403) { super(code); this.name = "OwnerAccessError"; this.code = code; this.status = status; }
}
