import "server-only";

import { buildClientApplicationUrl } from "@/lib/auth/client-access";
import { buildAuthRedirectUrl } from "@/lib/auth/deployment-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeText(value) {
  return String(value || "").trim();
}

function buildActivationRedirectUrl() {
  return buildAuthRedirectUrl("/connexion/definir-mot-de-passe");
}

function buildUserMetadata(application) {
  return {
    first_name: normalizeText(application?.first_name),
    last_name: normalizeText(application?.last_name),
    pseudo: normalizeText(application?.pseudo),
    application_id: application?.id || null
  };
}

function buildAccessRecord({
  userId,
  application,
  existingAccess,
  email,
  nowIso,
  status,
  lastEmailError
}) {
  return {
    user_id: userId,
    application_id: application.id,
    email,
    role: existingAccess?.role || "client",
    status,
    activation_email_sent_at: lastEmailError ? existingAccess?.activation_email_sent_at || null : nowIso,
    welcome_email_sent_at:
      status === "pending_activation" && !lastEmailError
        ? existingAccess?.welcome_email_sent_at || nowIso
        : existingAccess?.welcome_email_sent_at || null,
    activated_at: status === "active" ? existingAccess?.activated_at || nowIso : null,
    revoked_at: status === "revoked" ? nowIso : null,
    last_email_error: lastEmailError || null
  };
}

function buildFriendlyEmailError(errorMessage, existingAccess) {
  const normalized = String(errorMessage || "").toLowerCase();

  if (normalized.includes("over_email_send_rate_limit")) {
    return "Un email d'activation a déjà été envoyé récemment. Patientez une minute avant de renvoyer un nouveau lien.";
  }

  if (normalized.includes("for security purposes")) {
    return "Un email vient déjà d'être envoyé à ce client. Patientez un instant avant de renvoyer un nouveau lien.";
  }

  if (existingAccess?.status === "active") {
    return "Le compte client existe déjà, mais l'email de réinitialisation n'a pas pu être envoyé pour le moment.";
  }

  return errorMessage || "Impossible d'envoyer l'email d'activation.";
}

function buildActivationSuccessMessage({ action, userWasCreated, previousStatus }) {
  if (action === "resend") {
    if (previousStatus === "revoked") {
      return "L'accès a été réactivé et un nouvel email d'activation a été envoyé au client.";
    }

    if (previousStatus === "active") {
      return "Un email de réinitialisation d'accès a été envoyé au client.";
    }

    return "L'email d'activation a bien été renvoyé au client.";
  }

  if (previousStatus === "revoked") {
    return "L'accès client a été réactivé. Le client doit maintenant définir son mot de passe pour finaliser son espace.";
  }

  if (previousStatus === "active") {
    return "Le compte client était déjà actif. Un email de réinitialisation d'accès a été envoyé.";
  }

  if (userWasCreated) {
    return "Le compte a été préparé et l'email d'invitation a été envoyé. L'accès restera en attente tant que le mot de passe n'aura pas été défini.";
  }

  return "L'accès client a été préparé et l'email d'invitation a été envoyé. Le client doit encore définir son mot de passe.";
}

async function ensureAuthUser(adminClient, application) {
  const email = normalizeEmail(application?.email);

  if (!email) {
    throw new Error("L'email du client est manquant.");
  }

  const metadata = buildUserMetadata(application);
  const lookup = await adminClient.auth.findUserByEmail(email);

  if (!lookup.ok) {
    throw new Error(lookup.error || "Impossible de rechercher le compte client.");
  }

  if (lookup.data?.id) {
    const updateResult = await adminClient.auth.updateUser(lookup.data.id, {
      email,
      user_metadata: {
        ...(lookup.data.user_metadata || {}),
        ...metadata
      },
      app_metadata: {
        ...(lookup.data.app_metadata || {}),
        role: "client"
      }
    });

    if (!updateResult.ok || !updateResult.data?.user?.id) {
      return {
        user: lookup.data,
        wasCreated: false
      };
    }

    return {
      user: updateResult.data.user,
      wasCreated: false
    };
  }

  const createResult = await adminClient.auth.createUser({
    email,
    email_confirm: true,
    user_metadata: metadata,
    app_metadata: {
      role: "client"
    }
  });

  if (createResult.ok && createResult.data?.user?.id) {
    return {
      user: createResult.data.user,
      wasCreated: true
    };
  }

  const createError = String(
    createResult.data?.msg ||
      createResult.data?.error_description ||
      createResult.data?.error ||
      createResult.error ||
      ""
  ).toLowerCase();

  if (
    createError.includes("already") ||
    createError.includes("exists") ||
    createError.includes("registered")
  ) {
    const secondLookup = await adminClient.auth.findUserByEmail(email);

    if (secondLookup.ok && secondLookup.data?.id) {
      return {
        user: secondLookup.data,
        wasCreated: false
      };
    }
  }

  throw new Error("Impossible de créer le compte client dans Supabase Auth.");
}

export async function triggerClientActivation(applicationId, action = "activate") {
  const adminClient = createSupabaseAdminClient();
  const applicationResult = await adminClient.applications.getById(applicationId);

  if (!applicationResult.ok || !Array.isArray(applicationResult.data) || applicationResult.data.length === 0) {
    throw new Error("Dossier client introuvable.");
  }

  const application = applicationResult.data[0];
  const email = normalizeEmail(application.email);

  if (!email) {
    throw new Error("Le dossier client ne contient pas d'email exploitable.");
  }

  const existingAccessResult = await adminClient.clientAccess.getByApplicationId(applicationId);
  const existingAccess =
    existingAccessResult.ok && Array.isArray(existingAccessResult.data) && existingAccessResult.data.length > 0
      ? existingAccessResult.data[0]
      : null;

  const previousStatus = existingAccess?.status || null;
  const authUserResult = await ensureAuthUser(adminClient, application);
  const authUser = authUserResult.user;
  const redirectTo = buildActivationRedirectUrl();
  const recoveryResult = await adminClient.auth.sendPasswordRecovery(email, redirectTo);
  const nowIso = new Date().toISOString();
  const sendFailed = !recoveryResult.ok;
  const rawEmailError = sendFailed
    ? recoveryResult.data?.msg ||
      recoveryResult.data?.error_description ||
      recoveryResult.data?.error ||
      "Impossible d'envoyer l'email d'activation."
    : null;
  const emailError = sendFailed ? buildFriendlyEmailError(rawEmailError, existingAccess) : null;

  const accessStatus = action === "resend" && previousStatus === "active" ? "active" : "pending_activation";
  const upsertAccess = await adminClient.clientAccess.upsertByApplication(
    buildAccessRecord({
      userId: authUser.id,
      application,
      existingAccess,
      email,
      nowIso,
      status: accessStatus,
      lastEmailError: emailError
    })
  );

  if (!upsertAccess.ok || !Array.isArray(upsertAccess.data) || upsertAccess.data.length === 0) {
    throw new Error(
      `Le compte a été préparé, mais la liaison client_access a échoué : ${
        upsertAccess?.error || upsertAccess?.message || "erreur inconnue"
      }`
    );
  }

  if (sendFailed) {
    throw new Error(emailError);
  }

  return {
    success: true,
    access: upsertAccess.data[0],
    activationRedirectPath: buildClientApplicationUrl(applicationId),
    emailSentTo: email,
    message: buildActivationSuccessMessage({
      action,
      userWasCreated: authUserResult.wasCreated,
      previousStatus
    })
  };
}

export async function revokeClientAccess(applicationId) {
  const adminClient = createSupabaseAdminClient();
  const existingAccessResult = await adminClient.clientAccess.getByApplicationId(applicationId);
  const existingAccess =
    existingAccessResult.ok && Array.isArray(existingAccessResult.data) && existingAccessResult.data.length > 0
      ? existingAccessResult.data[0]
      : null;

  if (!existingAccess) {
    throw new Error("Aucun accès client actif ou préparé n'est lié à ce dossier.");
  }

  const revokeResult = await adminClient.clientAccess.upsertByApplication({
    ...existingAccess,
    status: "revoked",
    revoked_at: new Date().toISOString()
  });

  if (!revokeResult.ok || !Array.isArray(revokeResult.data) || revokeResult.data.length === 0) {
    throw new Error("Impossible de révoquer l'accès client.");
  }

  return {
    success: true,
    access: revokeResult.data[0]
  };
}

export async function activateClientAccessFromRecovery(user) {
  const adminClient = createSupabaseAdminClient();
  const email = normalizeEmail(user?.email || user?.user_metadata?.email);

  if (!user?.id || !email) {
    throw new Error("Impossible d'activer ce compte client.");
  }

  const accessResult = await adminClient.clientAccess.getAnyByUserId(user.id);
  let access =
    accessResult.ok && Array.isArray(accessResult.data) && accessResult.data.length > 0
      ? accessResult.data[0]
      : null;

  if (!access) {
    const latestApplication = await adminClient.applications.getLatestApprovedByEmail(email);

    if (!latestApplication.ok || !Array.isArray(latestApplication.data) || latestApplication.data.length === 0) {
      throw new Error("Aucun dossier client n'est encore lié à ce compte.");
    }

    const application = latestApplication.data[0];
    const upsertResult = await adminClient.clientAccess.upsertByApplication({
      user_id: user.id,
      application_id: application.id,
      email,
      role: "client",
      status: "active",
      activated_at: new Date().toISOString(),
      activation_email_sent_at: null,
      welcome_email_sent_at: null,
      revoked_at: null,
      last_email_error: null
    });

    if (!upsertResult.ok || !Array.isArray(upsertResult.data) || upsertResult.data.length === 0) {
      throw new Error("Impossible de finaliser l'accès client.");
    }

    access = upsertResult.data[0];
  } else if (access.status === "revoked") {
    throw new Error("Cet accès client a été révoqué. Demandez une nouvelle activation à Zero Limit Agency.");
  } else if (access.status !== "active") {
    const upsertResult = await adminClient.clientAccess.upsertByApplication({
      ...access,
      user_id: user.id,
      email,
      role: access.role || "client",
      status: "active",
      activated_at: access.activated_at || new Date().toISOString(),
      revoked_at: null,
      last_email_error: null
    });

    if (!upsertResult.ok || !Array.isArray(upsertResult.data) || upsertResult.data.length === 0) {
      throw new Error("Impossible d'activer définitivement l'accès client.");
    }

    access = upsertResult.data[0];
  }

  await adminClient.userRoles.upsert({
    user_id: user.id,
    role: "client"
  });

  const existingProfileResult = await adminClient.clientProfiles.getByApplicationId(access.application_id);
  const existingProfile =
    existingProfileResult.ok &&
    Array.isArray(existingProfileResult.data) &&
    existingProfileResult.data.length > 0
      ? existingProfileResult.data[0]
      : null;

  await adminClient.clientProfiles.upsertByApplication({
    user_id: user.id,
    application_id: access.application_id,
    avatar_data_url: existingProfile?.avatar_data_url || null,
    notion_url: existingProfile?.notion_url || null,
    space_status: existingProfile?.space_status || "active",
    market_access_enabled: Boolean(existingProfile?.market_access_enabled),
    resource_links: Array.isArray(existingProfile?.resource_links) ? existingProfile.resource_links : [],
    timeline_events: Array.isArray(existingProfile?.timeline_events) ? existingProfile.timeline_events : []
  });

  return access;
}
