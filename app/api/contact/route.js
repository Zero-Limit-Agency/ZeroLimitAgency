import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  buildInternalNewApplicationEmail,
  buildSignupConfirmationEmail,
  sendZeroLimitEmail
} from "@/lib/emails/zero-limit";
import { ensureLeadDriveFolder, uploadFilesToLeadFolder } from "@/lib/google/drive";
import {
  assertSafeUploadBatch,
  clampText,
  isValidEmailAddress,
  normalizeEmailAddress
} from "@/lib/security/uploads";
import { enforceRateLimit, permanentlyBlockRequestIp } from "@/lib/security/rate-limit";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function summarizeEmailFailure(result, label) {
  if (!result || result.ok || result.skipped) {
    return null;
  }

  return {
    target: label,
    provider: result.provider || "unknown",
    transient: Boolean(result.transient),
    reason: String(result.error || "Email delivery failed")
  };
}

function parseBoolean(value) {
  if (typeof value !== "string") {
    return false;
  }

  return ["true", "1", "on", "yes"].includes(value.toLowerCase());
}

function splitFullName(fullName) {
  const trimmed = String(fullName || "").trim();

  if (!trimmed) {
    return { firstName: "Client", lastName: "" };
  }

  const parts = trimmed.split(/\s+/);
  const firstName = parts.shift() || "Client";
  const lastName = parts.join(" ");

  return { firstName, lastName };
}

function normalizeBirthDate(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const numericMatch = raw.match(/^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{4})$/);

  if (numericMatch) {
    const [, day, month, year] = numericMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const normalized = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const textMatch = normalized.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);

  if (!textMatch) {
    return raw;
  }

  const monthMap = {
    janvier: "01",
    fevrier: "02",
    mars: "03",
    avril: "04",
    mai: "05",
    juin: "06",
    juillet: "07",
    aout: "08",
    septembre: "09",
    octobre: "10",
    novembre: "11",
    decembre: "12"
  };

  const [, day, monthLabel, year] = textMatch;
  const month = monthMap[monthLabel];

  return month ? `${year}-${month}-${day.padStart(2, "0")}` : raw;
}

function normalizeSignupPayload(formData) {
  return {
    website: clampText(formData.get("website")?.toString() || "", 200),
    fullName: clampText(formData.get("fullName")?.toString() || "", 120),
    birthDate: normalizeBirthDate(formData.get("birthDate")?.toString() || ""),
    username: clampText(formData.get("username")?.toString() || "", 80),
    email: normalizeEmailAddress(formData.get("email")?.toString() || ""),
    password: formData.get("password")?.toString() || "",
    company: clampText(formData.get("company")?.toString() || "", 120),
    country: clampText(formData.get("country")?.toString() || "", 120) || "Non renseigne",
    language: clampText(formData.get("language")?.toString() || "", 40),
    requestType: clampText(formData.get("request")?.toString() || "", 80),
    message: clampText(formData.get("message")?.toString() || "", 4000),
    newsletter: parseBoolean(formData.get("newsletter")?.toString() || ""),
    files: formData.getAll("files").filter((file) => file instanceof File && file.size > 0)
  };
}

function buildCreateUserErrorMessage(error) {
  const rawError = String(error?.message || "").toLowerCase();

  if (
    rawError.includes("already") ||
    rawError.includes("exists") ||
    rawError.includes("registered") ||
    rawError.includes("duplicate")
  ) {
    return "Cette adresse email est deja utilisee.";
  }

  return "Impossible de creer le compte pour le moment.";
}

async function rollbackSignup(supabase, userId, applicationId) {
  if (applicationId) {
    await supabase.from("applications").delete().eq("id", applicationId).catch(() => null);
  }

  if (userId) {
    await supabase.auth.admin.deleteUser(userId).catch(() => null);
  }
}

async function persistDriveWarning(supabase, applicationId, message) {
  const { data, error } = await supabase
    .from("applications")
    .update({
      drive_transfer_error: message || null
    })
    .eq("id", applicationId)
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function POST(request) {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuration serveur incomplete."
        },
        { status: 500 }
      );
    }

    const rateLimitResponse = enforceRateLimit(request, {
      key: "contact",
      limit: 15,
      windowMs: 60 * 1000
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const formData = await request.formData();
    const payload = normalizeSignupPayload(formData);

    if (payload.website) {
      permanentlyBlockRequestIp(request, "contact-honeypot");
      return NextResponse.json({ success: true });
    }

    if (
      !payload.fullName ||
      !payload.birthDate ||
      !payload.email ||
      !payload.password ||
      !payload.language ||
      !payload.requestType ||
      !payload.message
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Merci de remplir tous les champs obligatoires."
        },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.birthDate)) {
      return NextResponse.json(
        {
          success: false,
          error: "La date de naissance doit etre valide et au format jour/mois/annee."
        },
        { status: 400 }
      );
    }

    if (payload.password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Le mot de passe doit contenir au moins 8 caracteres."
        },
        { status: 400 }
      );
    }

    if (!isValidEmailAddress(payload.email)) {
      return NextResponse.json(
        {
          success: false,
          error: "L'adresse email saisie n'est pas valide."
        },
        { status: 400 }
      );
    }

    await assertSafeUploadBatch(payload.files, {
      label: "fichier",
      maxFiles: 6,
      maxSizeBytes: 10 * 1024 * 1024,
      maxTotalBytes: 24 * 1024 * 1024,
      allowedExtensions: [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic", ".heif", ".zip"],
      allowedMimeTypes: [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/heic",
        "image/heif",
        "application/zip",
        "application/x-zip-compressed",
        "multipart/x-zip"
      ],
      allowedSignatures: ["pdf", "png", "jpeg", "webp", "heic", "zip"]
    });

    const { firstName, lastName } = splitFullName(payload.fullName);

    const authResult = await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        pseudo: payload.username || null
      },
      app_metadata: {
        role: "client"
      }
    });

    if (authResult.error || !authResult.data?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: buildCreateUserErrorMessage(authResult.error)
        },
        { status: 400 }
      );
    }

    const userId = authResult.data.user.id;

    const { data: application, error: insertError } = await supabase
      .from("applications")
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          pseudo: payload.username || null,
          email: payload.email,
          birth_date: payload.birthDate,
          company: payload.company || null,
          country: payload.country,
          language: payload.language,
          request_type: payload.requestType,
          message_raw: payload.message,
          status: "pending_review",
          newsletter_opt_in: payload.newsletter
        }
      ])
      .select()
      .single();

    if (insertError || !application?.id) {
      await rollbackSignup(supabase, userId, null);

      return NextResponse.json(
        {
          success: false,
          error: "Impossible d'enregistrer la demande."
        },
        { status: 500 }
      );
    }

    let finalApplication = application;

    try {
      const driveFolder = await ensureLeadDriveFolder({
        applicationId: application.id,
        firstName,
        lastName,
        pseudo: payload.username || null,
        createdAt: application.created_at,
        email: payload.email
      });

      if (payload.files.length > 0) {
        await uploadFilesToLeadFolder({
          folderId: driveFolder.id,
          files: payload.files
        });
      }

      const { data: updatedApplication, error: updateDriveError } = await supabase
        .from("applications")
        .update({
          drive_folder_id: driveFolder.id,
          drive_folder_url: driveFolder.url,
          files_folder_url: driveFolder.url,
          drive_transfer_error: null
        })
        .eq("id", application.id)
        .select()
        .single();

      if (updateDriveError || !updatedApplication) {
        throw new Error("Impossible de rattacher le dossier Google Drive a la demande.");
      }

      finalApplication = updatedApplication;
    } catch (driveError) {
      console.error(
        "[contact] drive upload failed",
        driveError instanceof Error ? driveError.message : "unknown"
      );
      const driveErrorMessage = driveError instanceof Error ? driveError.message : "Erreur inconnue";
      const warningMessage =
        payload.files.length > 0
          ? `Fichiers non transferes vers Google Drive: ${driveErrorMessage}`
          : `Dossier Google Drive non cree: ${driveErrorMessage}`;

      const updatedApplication = await persistDriveWarning(
        supabase,
        application.id,
        warningMessage
      );

      if (updatedApplication) {
        finalApplication = updatedApplication;
      }
    }

    if (payload.newsletter) {
      const newsletterResult = await supabase
        .from("newsletter_subscriptions")
        .upsert(
          {
            email: payload.email,
            application_id: finalApplication.id,
            status: "subscribed",
            source: "contact_form",
            language: payload.language,
            country: payload.country,
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null
          },
          {
            onConflict: "email"
          }
        )
        .select()
        .single();

      if (newsletterResult.error) {
        console.error(
          "[contact] newsletter sync failed",
          newsletterResult.error instanceof Error ? newsletterResult.error.message : "unknown"
        );
      }
    }

    const internalEmail = buildInternalNewApplicationEmail({ application: finalApplication });
    const confirmationEmail = buildSignupConfirmationEmail({ application: finalApplication });

    const emailResults = await Promise.all([
      sendZeroLimitEmail({
        to: process.env.INSCRIPTIONS_EMAIL,
        from: process.env.INSCRIPTIONS_EMAIL,
        ...internalEmail
      }),
      sendZeroLimitEmail({
        to: payload.email,
        from: process.env.INSCRIPTIONS_EMAIL,
        ...confirmationEmail
      })
    ]);

    const emailFailures = [
      summarizeEmailFailure(emailResults[0], "internal_notification"),
      summarizeEmailFailure(emailResults[1], "signup_confirmation")
    ].filter(Boolean);

    if (emailFailures.length > 0) {
      console.error("[contact] email delivery issue", {
        applicationId: finalApplication.id,
        failures: emailFailures
      });
    }

    return NextResponse.json({
      success: true,
      message:
        emailFailures.length > 0
          ? "Inscription enregistrée. Un incident de livraison email est en cours de résolution."
          : "Inscription reussie",
      applicationId: finalApplication.id,
      emailDelivery: {
        ok: emailFailures.length === 0,
        failures: emailFailures
      }
    });
  } catch (error) {
    console.error("[contact] fatal error", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur."
      },
      { status: 500 }
    );
  }
}
