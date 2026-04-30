import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/api-guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerConfig } from "@/lib/supabase/server";

function getEnvPresence() {
  return {
    NEXT_PUBLIC_APP_URL: {
      present: Boolean(process.env.NEXT_PUBLIC_APP_URL)
    },
    NEXT_PUBLIC_SUPABASE_URL: {
      present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      present: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
    },
    PUBLIC_CONTACT_EMAIL: {
      present: Boolean(process.env.PUBLIC_CONTACT_EMAIL)
    },
    INSCRIPTIONS_EMAIL: {
      present: Boolean(process.env.INSCRIPTIONS_EMAIL)
    },
    CLIENT_EMAIL: {
      present: Boolean(process.env.CLIENT_EMAIL)
    }
  };
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ success: false, error: "Introuvable." }, { status: 404 });
  }

  const adminAccess = await requireAdminApiSession();

  if (!adminAccess.ok) {
    return adminAccess.response;
  }

  const env = getEnvPresence();

  try {
    const config = getSupabaseServerConfig();
    const adminClient = createSupabaseAdminClient();

    const [authSettings, restOpenApi, usersCheck] = await Promise.all([
      adminClient.authPublic.settings(),
      adminClient.rest.openApi(),
      adminClient.auth.listUsers()
    ]);

    return NextResponse.json({
      success: true,
      projectUrl: config.url,
      env,
      checks: {
        authSettings: {
          ok: authSettings.ok,
          status: authSettings.status
        },
        restOpenApi: {
          ok: restOpenApi.ok,
          status: restOpenApi.status
        },
        adminUsers: {
          ok: usersCheck.ok,
          status: usersCheck.status
        }
      }
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        env,
        error: "Impossible de vérifier la connexion Supabase."
      },
      { status: 500 }
    );
  }
}
