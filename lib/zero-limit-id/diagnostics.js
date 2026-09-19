import "server-only";

import { randomUUID } from "node:crypto";
import { describeProfileDataAccessError } from "@/lib/zero-limit-id/profile";

export function reportProfileDataAccessError(error, route) {
  const diagnostic = describeProfileDataAccessError(error);
  if (!diagnostic) return null;

  const correlationId = randomUUID();
  console.error("[zero-limit-id] profile unavailable", {
    correlationId,
    route,
    ...diagnostic
  });
  return correlationId;
}
