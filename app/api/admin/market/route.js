import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/api-guards";
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
                academic: normalizeScore(
                  month?.academic,
                  `Marche des academies ${month?.label || month?.key}`
                ),
                structures: normalizeScore(
                  month?.structures,
                  `Investissement des structures ${month?.label || month?.key}`
                ),
                saturation: normalizeScore(
                  month?.saturation,
                  `Saturation du marche ${month?.label || month?.key}`
                ),
                hype: normalizeScore(month?.hype, `Hype du moment ${month?.label || month?.key}`),
                globalState: normalizeScore(
                  month?.globalState,
                  `Opportunite globale ${month?.label || month?.key}`
                ),
                majorActive: Boolean(month?.majorActive),
                fncsActive: Boolean(month?.fncsActive),
                ewcActive: Boolean(month?.ewcActive)
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
    const guard = await requireAdminApiSession();

    if (!guard.ok) {
      return guard.response;
    }

    const body = await request.json();
    const settings = normalizeMarketPayload(body);
    const adminClient = createSupabaseAdminClient();
    const existingResult = await adminClient.globalMarketSettings.get();
    const existingSettings =
      existingResult.ok && Array.isArray(existingResult.data) && existingResult.data.length > 0
        ? existingResult.data[0]?.settings || {}
        : {};
    const mergedRegions = Object.fromEntries(
      Object.entries(settings.regions).map(([regionKey, regionValue]) => {
        const existingRegion = existingSettings?.regions?.[regionKey] || {};
        return [
          regionKey,
          {
            ...existingRegion,
            ...regionValue,
            months: {
              ...(existingRegion.months || {}),
              ...(regionValue.months || {})
            }
          }
        ];
      })
    );
    const result = await adminClient.globalMarketSettings.upsert({
      settings: {
        ...existingSettings,
        outlook: settings.outlook,
        regions: mergedRegions
      },
      updated_by: guard.session.user.id
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
    console.error("[admin-market] failed", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      {
        success: false,
        error: "Une erreur est survenue lors de l'enregistrement du market."
      },
      { status: 500 }
    );
  }
}
