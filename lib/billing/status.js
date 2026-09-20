export const SUBSCRIPTION_STATUSES = Object.freeze(["incomplete", "trialing", "active", "past_due", "unpaid", "canceled", "paused"]);

export function subscriptionGrantsAccess(subscription, now = new Date()) {
  if (!subscription || !SUBSCRIPTION_STATUSES.includes(subscription.status)) return false;
  const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() : null;
  if (subscription.status === "trialing" || subscription.status === "active") return periodEnd === null || periodEnd > now.getTime();
  // A provider can report canceled while the already-paid period is still open.
  return subscription.status === "canceled" && periodEnd !== null && periodEnd > now.getTime();
}

export function normalizeProductBillingStatus(subscription, now = new Date()) {
  if (subscriptionGrantsAccess(subscription, now)) return subscription.cancelAtPeriodEnd ? "ending" : "active";
  if (subscription?.status === "past_due") return "payment_issue";
  return "inactive";
}

