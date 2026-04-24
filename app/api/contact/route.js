import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  buildInternalNewApplicationEmail,
  buildSignupConfirmationEmail,
  sendZeroLimitEmail
} from "@/lib/emails/zero-limit";
import { ensureLeadDriveFolder, uploadFilesToLeadFolder } from "@/lib/google/drive";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

async function rollbackSignup(userId, applicationId) {
  if (applicationId) {
    await supabase.from("applications").delete().eq("id", applicationId).catch(() => null);
  }

  if (userId) {
    await supabase.auth.admin.deleteUser(userId).catch(() => null);
  }
}

async function persistDriveWarning(applicationId, message) {
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
    const formData = await request.formData();

    const fullName = formData.get("fullName")?.toString() || "";
    const birthDate = formData.get("birthDate")?.toString() || "";
    const username = formData.get("username")?.toString() || "";
    const email = formData.get("email")?.toString().trim().toLowerCase() || "";
    const password = formData.get("password")?.toString() || "";
    const company = formData.get("company")?.toString() || "";
    const country = formData.get("country")?.toString() || "Non renseigné";
    const language = formData.get("language")?.toString() || "";
    const requestType = formData.get("request")?.toString() || "";
    const message = formData.get("message")?.toString() || "";
    const newsletter = parseBoolean(formData.get("newsletter")?.toString() || "");
    const files = formData
      .getAll("files")
      .filter((file) => file instanceof File && file.size > 0);

    if (!fullName || !birthDate || !email || !password || !language || !requestType || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Merci de remplir tous les champs obligatoires."
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Le mot de passe doit contenir au moins 8 caractères."
        },
        { status: 400 }
      );
    }

    const { firstName, lastName } = splitFullName(fullName);

    const authResult = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        pseudo: username || null
      },
      app_metadata: {
        role: "client"
      }
    });

    if (authResult.error || !authResult.data?.user?.id) {
      const rawError = authResult.error?.message || "Impossible de créer le compte pour le moment.";

      return NextResponse.json(
        {
          success: false,
          error: rawError
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
          pseudo: username || null,
          email,
          birth_date: birthDate,
          company: company || null,
          country,
          language,
          request_type: requestType,
          message_raw: message,
          status: "pending_review",
          newsletter_opt_in: newsletter
        }
      ])
      .select()
      .single();

    if (insertError || !application?.id) {
      await rollbackSignup(userId, null);

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
        pseudo: username || null,
        createdAt: application.created_at,
        email
      });

      if (files.length > 0) {
        await uploadFilesToLeadFolder({
          folderId: driveFolder.id,
          files
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
        throw new Error("Impossible de rattacher le dossier Google Drive à la demande.");
      }

      finalApplication = updatedApplication;
    } catch (driveError) {
      console.error("[contact] drive upload failed", driveError);
      const warningMessage =
        files.length > 0
          ? "Fichiers non transferes vers Google Drive"
          : "Dossier Google Drive non cree";

      const updatedApplication = await persistDriveWarning(application.id, warningMessage);

      if (updatedApplication) {
        finalApplication = updatedApplication;
      }
    }

    const internalEmail = buildInternalNewApplicationEmail({ application: finalApplication });
    const confirmationEmail = buildSignupConfirmationEmail({ application: finalApplication });

    await Promise.all([
      sendZeroLimitEmail({
        to: process.env.INSCRIPTIONS_EMAIL,
        from: process.env.INSCRIPTIONS_EMAIL,
        ...internalEmail
      }),
      sendZeroLimitEmail({
        to: email,
        from: process.env.INSCRIPTIONS_EMAIL,
        ...confirmationEmail
      })
    ]);

    return NextResponse.json({
      success: true,
      message: "Inscription réussie",
      applicationId: finalApplication.id
    });
  } catch (error) {
    console.error("[contact] fatal error", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur serveur"
      },
      { status: 500 }
    );
  }
}
