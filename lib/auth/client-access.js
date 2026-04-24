import "server-only";

import { createDemoApplication, createDemoClientAccess, createDemoProfile, DEMO_CLIENT_USER_ID } from "@/lib/auth/demo-client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function ensureClientAccessForUser(user) {
  if (user?.id === DEMO_CLIENT_USER_ID) {
    return createDemoClientAccess();
  }

  const adminClient = createSupabaseAdminClient();
  const existingAccess = await adminClient.clientAccess.getAnyByUserId(user.id);

  if (existingAccess.ok && Array.isArray(existingAccess.data) && existingAccess.data.length > 0) {
    return existingAccess.data[0].status === "active" ? existingAccess.data[0] : null;
  }

  const email = String(user?.email || user?.user_metadata?.email || "").trim().toLowerCase();

  if (!email) {
    return null;
  }

  const latestApplication = await adminClient.applications.getLatestByEmail(email);

  if (!latestApplication.ok || !Array.isArray(latestApplication.data) || latestApplication.data.length === 0) {
    return null;
  }

  const application = latestApplication.data[0];
  const upsertResult = await adminClient.clientAccess.upsertByApplication({
    user_id: user.id,
    application_id: application.id,
    email,
    role: "client",
    status: "active",
    revoked_at: null,
    last_email_error: null
  });

  if (!upsertResult.ok || !Array.isArray(upsertResult.data) || upsertResult.data.length === 0) {
    return null;
  }

  await adminClient.userRoles.upsert({
    user_id: user.id,
    role: "client"
  });

  return upsertResult.data[0];
}

export async function getAuthorizedClientAccess(user) {
  if (user?.id === DEMO_CLIENT_USER_ID) {
    return createDemoClientAccess();
  }

  const adminClient = createSupabaseAdminClient();
  const result = await adminClient.clientAccess.getByUserId(user.id);

  if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
    return null;
  }

  return result.data[0];
}

export async function getClientWorkspaceContext(user) {
  if (!user?.id) {
    return {
      access: null,
      application: null,
      profile: null
    };
  }

  if (user.id === DEMO_CLIENT_USER_ID) {
    return {
      access: createDemoClientAccess(),
      application: createDemoApplication(),
      profile: createDemoProfile()
    };
  }

  const access = await ensureClientAccessForUser(user);

  if (!access?.application_id) {
    return {
      access: null,
      application: null,
      profile: null
    };
  }

  const adminClient = createSupabaseAdminClient();
  const applicationResult = await adminClient.applications.getById(access.application_id);
  const profileResult = await adminClient.clientProfiles.getByApplicationId(access.application_id);

  const application =
    applicationResult.ok && Array.isArray(applicationResult.data) && applicationResult.data.length > 0
      ? applicationResult.data[0]
      : null;
  const profile =
    profileResult.ok && Array.isArray(profileResult.data) && profileResult.data.length > 0
      ? profileResult.data[0]
      : null;

  return {
    access,
    application,
    profile
  };
}

export function buildClientApplicationUrl(applicationId) {
  return `/espace-client/${applicationId}`;
}
