import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SAFE_ACTION_PATTERN = /^[a-z0-9_.:-]{3,120}$/;

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => !/(token|secret|password|cookie|authorization|key)/i.test(key))
      .map(([key, value]) => [String(key).slice(0, 80), typeof value === "string" ? value.slice(0, 500) : value])
  );
}

export async function recordAuditEvent({ actorUserId, actorProfileId, actorRole, action, resourceType, resourceId, correlationId, result = "success", metadata = {} }) {
  const safeAction = String(action || "").trim().toLowerCase();
  const safeResourceType = String(resourceType || "").trim().toLowerCase();

  if (!SAFE_ACTION_PATTERN.test(safeAction) || !SAFE_ACTION_PATTERN.test(safeResourceType)) {
    return { ok: false, skipped: true };
  }

  try {
    const adminClient = createSupabaseAdminClient();
    return await adminClient.auditLogs.create({
      actor_user_id: actorUserId || null,
      ...(actorProfileId ? { actor_profile_id: actorProfileId } : {}),
      actor_role: actorRole || null,
      action: safeAction,
      resource_type: safeResourceType,
      resource_id: resourceId ? String(resourceId).slice(0, 160) : null,
      ...(correlationId ? { correlation_id: correlationId } : {}),
      result: result === "failure" ? "failure" : "success",
      metadata: sanitizeMetadata(metadata)
    });
  } catch {
    return { ok: false };
  }
}
