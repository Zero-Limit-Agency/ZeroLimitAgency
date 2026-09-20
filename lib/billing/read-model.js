import "server-only";
import { normalizeProductBillingStatus } from "./status.js";
import { supabaseServerRequest } from "@/lib/supabase/server";
import { requireSpaceAccess } from "@/lib/zero-limit-id/spaces";

export async function getCurrentBillingForSpace(spaceId, { request = supabaseServerRequest, accessOptions } = {}) {
  const { space } = await requireSpaceAccess(spaceId, accessOptions);
  const subscriptionResult = await request(`/rest/v1/billing_subscriptions?target_space_id=eq.${encodeURIComponent(spaceId)}&select=plan_key,status,quantity,current_period_end,cancel_at_period_end&order=provider_updated_at.desc&limit=1`, { useServiceRole: true });
  if (!subscriptionResult.ok) throw new Error("billing_read_failed");
  const subscription = subscriptionResult.data?.[0];
  if (!subscription) return null;
  let seatUsage = null;
  if (space.kind === "team") {
    const membershipResult = await request(`/rest/v1/organization_memberships?organization_id=eq.${encodeURIComponent(space.organization.id)}&select=id`, { useServiceRole: true });
    if (!membershipResult.ok) throw new Error("billing_read_failed");
    seatUsage = membershipResult.data?.length || 0;
  }
  const model = {
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  };
  return {
    planKey: subscription.plan_key,
    status: normalizeProductBillingStatus(model),
    renewalOrEndDate: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    seats: space.kind === "team" ? { usage: seatUsage, allowance: subscription.quantity } : null
  };
}
