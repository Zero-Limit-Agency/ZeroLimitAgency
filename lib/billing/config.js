import "server-only";
import { BillingError } from "./errors.js";

export function getStripeConfig(env = process.env) {
  const secretKey = env.STRIPE_SECRET_KEY;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) throw new BillingError("billing_not_configured", 503);
  const live = secretKey.startsWith("sk_live_");
  const production = env.VERCEL_ENV === "production";
  if (production !== live) throw new BillingError("billing_not_configured", 503);
  if (!production && !secretKey.startsWith("sk_test_")) throw new BillingError("billing_not_configured", 503);
  let priceMap;
  try { priceMap = JSON.parse(env.STRIPE_PRICE_MAP_JSON || "{}"); }
  catch { throw new BillingError("billing_not_configured", 503); }
  return { secretKey, webhookSecret, priceMap, mode: live ? "live" : "test" };
}

