import { NextResponse } from "next/server";

import { isUuidLike, requireAdminApiSession } from "@/lib/auth/api-guards";
import {
  ENTITLEMENT_STATUSES,
  RESOURCE_TYPES,
  TRAINING_STATUSES,
  YOUTUBE_PROGRAM_PRODUCT_KEY,
  countTrainingDependencies,
  listAuthUsersForAdmin,
  updateTrainingRecord,
  writeTrainingRecord
} from "@/lib/learn-youtube/admin-catalog";
import { sanitizeExternalUrl } from "@/lib/security/urls";
import { formatSupabaseAdminError } from "@/lib/supabase/errors";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,80}$/;
const PRODUCT_KEY_PATTERN = /^[a-z0-9][a-z0-9._:-]{1,120}$/;
const TABLES = {
  program: "training_programs",
  pack: "training_packs",
  module: "training_modules",
  lesson: "training_lessons",
  resource: "training_resources",
  entitlement: "training_entitlements"
};

function text(value, max = 2000) {
  return String(value || "").trim().slice(0, max);
}

function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function statusValue(value, allowed = TRAINING_STATUSES) {
  return allowed.includes(value) ? value : "draft";
}

function nullableUuid(value) {
  const normalized = text(value, 80);
  return isUuidLike(normalized) ? normalized : null;
}

function parseDate(value) {
  const raw = text(value, 80);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "invalid" : date.toISOString();
}

function jsonError(error, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

function assertSlug(slug) {
  return SLUG_PATTERN.test(slug) ? "" : "Slug invalide : utilisez des minuscules, chiffres et tirets.";
}

function assertProductKey(productKey) {
  return PRODUCT_KEY_PATTERN.test(productKey) ? "" : "Clé produit invalide.";
}

async function parsePayload(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function findUser(query) {
  const normalized = text(query, 160).toLowerCase();
  if (!normalized) return [];
  const users = await listAuthUsersForAdmin({ page: 1, perPage: 200 });
  return users
    .filter((user) => {
      const haystack = [user.id, user.email, user.user_metadata?.first_name, user.user_metadata?.last_name, user.user_metadata?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    })
    .slice(0, 12)
    .map((user) => ({ id: user.id, email: user.email, user_metadata: user.user_metadata || {} }));
}

export async function GET(request) {
  const guard = await requireAdminApiSession();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const users = await findUser(searchParams.get("q"));
  return NextResponse.json({ success: true, users });
}

export async function POST(request) {
  const guard = await requireAdminApiSession();
  if (!guard.ok) return guard.response;

  const body = await parsePayload(request);
  if (!body) return jsonError("Le corps de la requête doit être un JSON valide.");

  const action = text(body.action, 80);

  try {
    let result;

    if (action === "save-program") {
      const id = nullableUuid(body.id);
      const slug = text(body.slug || "youtube", 90);
      const productKey = text(body.product_key || YOUTUBE_PROGRAM_PRODUCT_KEY, 130);
      const slugError = assertSlug(slug);
      const productError = assertProductKey(productKey);
      if (slugError || productError) return jsonError(slugError || productError);

      result = await writeTrainingRecord(TABLES.program, {
        title: text(body.title, 160) || "Formation YouTube",
        slug,
        description: text(body.description, 4000),
        product_key: productKey,
        status: statusValue(body.status),
        sort_order: numberValue(body.sort_order)
      }, id, { onConflict: "product_key" });
    } else if (action === "save-pack") {
      const id = nullableUuid(body.id);
      const programId = nullableUuid(body.program_id);
      const slug = text(body.slug, 90);
      const productKey = text(body.product_key, 130);
      if (!programId) return jsonError("Programme parent invalide.");
      const slugError = assertSlug(slug);
      const productError = assertProductKey(productKey);
      if (slugError || productError) return jsonError(slugError || productError);

      result = await writeTrainingRecord(TABLES.pack, {
        program_id: programId,
        title: text(body.title, 160),
        slug,
        short_description: text(body.short_description, 600),
        description: text(body.description, 4000),
        product_key: productKey,
        status: statusValue(body.status),
        sort_order: numberValue(body.sort_order)
      }, id);
    } else if (action === "save-module") {
      const id = nullableUuid(body.id);
      const packId = nullableUuid(body.pack_id);
      const slug = text(body.slug, 90);
      if (!packId) return jsonError("Pack parent invalide.");
      const slugError = assertSlug(slug);
      if (slugError) return jsonError(slugError);

      result = await writeTrainingRecord(TABLES.module, {
        pack_id: packId,
        title: text(body.title, 160),
        slug,
        description: text(body.description, 3000),
        status: statusValue(body.status),
        sort_order: numberValue(body.sort_order)
      }, id);
    } else if (action === "save-lesson") {
      const id = nullableUuid(body.id);
      const moduleId = nullableUuid(body.module_id);
      const slug = text(body.slug, 90);
      if (!moduleId) return jsonError("Module parent invalide.");
      const slugError = assertSlug(slug);
      if (slugError) return jsonError(slugError);

      result = await writeTrainingRecord(TABLES.lesson, {
        module_id: moduleId,
        title: text(body.title, 180),
        slug,
        description: text(body.description, 6000),
        trainer_name: text(body.trainer_name, 160),
        duration_seconds: Math.max(0, numberValue(body.duration_seconds, 0)),
        video_provider: text(body.video_provider, 80),
        video_asset_id: text(body.video_asset_id, 240),
        status: statusValue(body.status),
        sort_order: numberValue(body.sort_order)
      }, id);
    } else if (action === "save-resource") {
      const id = nullableUuid(body.id);
      const lessonId = nullableUuid(body.lesson_id);
      if (!lessonId) return jsonError("Leçon parente invalide.");
      const resourceType = RESOURCE_TYPES.includes(body.resource_type) ? body.resource_type : "document";
      const url = sanitizeExternalUrl(body.url, { allowedProtocols: ["https:"] });
      if (body.url && !url) return jsonError("URL de ressource invalide ou protocole non autorisé.");

      result = await writeTrainingRecord(TABLES.resource, {
        lesson_id: lessonId,
        title: text(body.title, 180),
        resource_type: resourceType,
        url,
        storage_path: text(body.storage_path, 500),
        is_downloadable: Boolean(body.is_downloadable),
        status: statusValue(body.status),
        sort_order: numberValue(body.sort_order)
      }, id);
    } else if (action === "save-entitlement") {
      const userId = nullableUuid(body.user_id);
      const programId = nullableUuid(body.program_id);
      const packId = nullableUuid(body.pack_id);
      const startsAt = parseDate(body.starts_at) || new Date().toISOString();
      const expiresAt = parseDate(body.expires_at);
      if (!userId) return jsonError("Utilisateur invalide.");
      if ((programId && packId) || (!programId && !packId)) return jsonError("Choisissez soit un programme, soit un pack.");
      if (startsAt === "invalid" || expiresAt === "invalid") return jsonError("Date invalide.");
      if (expiresAt && new Date(expiresAt).getTime() <= new Date(startsAt).getTime()) return jsonError("La date d'expiration doit être postérieure au début.");
      const status = ENTITLEMENT_STATUSES.includes(body.status) ? body.status : "active";

      result = await writeTrainingRecord(TABLES.entitlement, {
        user_id: userId,
        program_id: programId,
        pack_id: packId,
        product_key: text(body.product_key, 130) || (programId ? YOUTUBE_PROGRAM_PRODUCT_KEY : "training.youtube.pack"),
        source: "manual",
        status,
        starts_at: startsAt,
        expires_at: expiresAt || null,
        metadata: { internal_note: text(body.internal_note, 1000), updated_by: guard.session.user.id }
      }, nullableUuid(body.id));
    } else if (action === "archive") {
      const kind = ["pack", "module", "lesson", "resource", "program"].includes(body.kind) ? body.kind : "";
      const id = nullableUuid(body.id);
      if (!kind || !id) return jsonError("Archive impossible : cible invalide.");
      const dependencies = await countTrainingDependencies(kind, id);
      if ((kind === "pack" && dependencies.entitlements > 0) || (kind === "lesson" && (dependencies.progress || dependencies.notes || dependencies.favorites || dependencies.comments))) {
        return jsonError("Archivage bloqué : ce contenu possède déjà des accès ou données utilisateur. Dépubliez-le d'abord et vérifiez les dépendances.", 409);
      }
      result = await updateTrainingRecord(TABLES[kind], id, { status: "archived" });
    } else {
      return jsonError("Action formation inconnue.");
    }

    if (!result?.ok) {
      return jsonError(formatSupabaseAdminError(result?.data, "Impossible d'enregistrer cette modification formation."), result?.status || 500);
    }

    return NextResponse.json({ success: true, message: "Modification formation enregistrée.", records: result.data || [] });
  } catch (error) {
    console.error("[admin-training] failed", error instanceof Error ? error.message : "unknown");
    return jsonError("Impossible d'enregistrer cette modification formation.", 500);
  }
}
