import { NextResponse } from "next/server";

import { getMaintenanceModeState } from "@/lib/maintenance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const maintenanceSettings = await getMaintenanceModeState(createSupabaseAdminClient());

    return NextResponse.json(
      {
        status: maintenanceSettings?.enabled ? "maintenance" : "online"
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("[status] failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        status: "offline"
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
