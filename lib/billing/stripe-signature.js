import "server-only";
import crypto from "node:crypto";

function timingSafeHexEqual(left, right) {
  if (!/^[a-f0-9]{64}$/i.test(left || "") || !/^[a-f0-9]{64}$/i.test(right || "")) return false;
  return crypto.timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export function verifyStripeSignature(rawBody, signatureHeader, secret, { now = Date.now(), toleranceSeconds = 300 } = {}) {
  if (!secret || !signatureHeader || typeof rawBody !== "string") return false;
  const parts = signatureHeader.split(",").map((part) => part.trim().split("="));
  const timestamp = Number(parts.find(([key]) => key === "t")?.[1]);
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!Number.isSafeInteger(timestamp) || Math.abs(Math.floor(now / 1000) - timestamp) > toleranceSeconds) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
  return signatures.some((signature) => timingSafeHexEqual(signature, expected));
}

