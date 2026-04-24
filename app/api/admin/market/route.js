import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeNumber(value, fallback = 0) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeScore(value, label) {
  const parsed = normalizeNumber(value, null);

  if (parsed === null || parsed < 0 || parsed > 10) {
    throw new Error(`${label} doit etre compris entre 0 et 10.`);
  }

  return parsed;
}

function normalizeMarketPayload(body) {
  const regions = Array.isArray(body?.regions) ? body.regions : [];

  return {
    outlook: normalizeText(body?.outlook),
    regions: Object.fromEntries(
      regions.map((region, index) => [
        normalizeText(region?.key) || `region-${index + 1}`,
        {
          key: normalizeText(region?.key) || `region-${index + 1}`,
          label: normalizeText(region?.label),
          color: normalizeText(region?.color),
          base: normalizeNumber(region?.base, 0),
          months: Object.fromEntries(
            (Array.isArray(region?.months) ? region.months : []).map((month) => [
              normalizeText(month?.key),
              {
                academic: normalizeScore(month?.academic, `Academique ${month?.label || month?.key}`),
                structures: normalizeScore(month?.structures, `Structures ${month?.label || month?.key}`),
                saturation: normalizeScore(month?.saturation, `Saturation ${month?.label || month?.key}`),
                hype: normalizeScore(month?.hype, `Hype ${month?.label || month?.key}`),
                globalState: normalizeScore(month?.globalState, `Etat global ${month?.label || month?.key}`),
                majorActive: Boolean(month?.majorActive),
                fncsActive: Boolean(month?.fncsActive),
                ewcActive: Boolean(month?.ewcActive),
                comment: normalizeText(month?.comment)
              }
            ])
          )
        }
      ])
    )
  };
}

export async function PATCH(request) {
  try {
    const session = await getClientSession();

    if (!session?.user || !(await isAdminUser(session.user))) {
      return NextResponse.json({ success: false, error: "Acces administrateur requis." }, { status: 403 });
    }

    const body = await request.json();
    const settings = normalizeMarketPayload(body);
    const adminClient = createSupabaseAdminClient();
    const result = await adminClient.globalMarketSettings.upsert({
      settings,
      updated_by: session.user.id
    });

    if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Impossible d'enregistrer la configuration globale du market." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "La configuration globale du market a bien ete enregistree.",
      market: result.data[0]
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de l'enregistrement du market."
      },
      { status: 500 }
    );
  }
}
