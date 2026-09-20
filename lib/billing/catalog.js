export const BILLING_MODES = Object.freeze({ RECURRING: "recurring" });

export const BILLING_PLANS = Object.freeze([
  { key: "personal_coach", productKey: "personal_coach", spaceKind: "personal", personalProfession: "coach", billingMode: BILLING_MODES.RECURRING, entitlementKey: "personal_access" },
  { key: "personal_manager_agent", productKey: "personal_manager_agent", spaceKind: "personal", personalProfession: "manager_agent", billingMode: BILLING_MODES.RECURRING, entitlementKey: "personal_access" },
  { key: "personal_ceo", productKey: "personal_ceo", spaceKind: "personal", personalProfession: "ceo", billingMode: BILLING_MODES.RECURRING, entitlementKey: "personal_access" },
  { key: "personal_community_manager", productKey: "personal_community_manager", spaceKind: "personal", personalProfession: "community_manager", billingMode: BILLING_MODES.RECURRING, entitlementKey: "personal_access" },
  { key: "creator", productKey: "creator", spaceKind: "creator", billingMode: BILLING_MODES.RECURRING, entitlementKey: "creator_access" },
  // The commercial allowance is deliberately configuration, not a final product promise.
  { key: "team", productKey: "team", spaceKind: "team", billingMode: BILLING_MODES.RECURRING, includedSeats: null, entitlementKey: "team_access" }
]);

const plansByKey = new Map(BILLING_PLANS.map((plan) => [plan.key, plan]));

if (plansByKey.size !== BILLING_PLANS.length) throw new Error("Duplicate billing plan key");

export function getBillingPlan(planKey) {
  return plansByKey.get(planKey) || null;
}

export function assertBillingPlanTarget(plan, target) {
  if (!plan || !target || target.kind !== plan.spaceKind) return false;
  return plan.spaceKind !== "personal" || target.personalProfession === plan.personalProfession;
}

