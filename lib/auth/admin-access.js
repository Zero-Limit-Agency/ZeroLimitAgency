import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEMO_CLIENT_USER_ID } from "@/lib/auth/demo-client";

export async function getUserRole(user) {
  if (!user?.id) {
    return null;
  }

  if (user.id === DEMO_CLIENT_USER_ID) {
    return "client";
  }

  const adminClient = createSupabaseAdminClient();
  const result = await adminClient.userRoles.getByUserId(user.id);

  if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
    return null;
  }

  return result.data[0]?.role || null;
}

export async function isAdminUser(user) {
  return (await getUserRole(user)) === "admin";
}

export async function isClientUser(user) {
  return (await getUserRole(user)) === "client";
}
