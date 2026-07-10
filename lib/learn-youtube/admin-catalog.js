import "server-only";

import { supabaseServerRequest } from "@/lib/supabase/server";

export const TRAINING_STATUSES = ["draft", "published", "archived"];
export const ENTITLEMENT_STATUSES = ["active", "revoked", "expired", "pending"];
export const RESOURCE_TYPES = ["pdf", "link", "file", "template", "checklist", "document"];
export const YOUTUBE_PROGRAM_PRODUCT_KEY = "training.youtube";

const TABLE_MISSING_CODES = new Set(["PGRST205", "42P01"]);

function enc(value) {
  return encodeURIComponent(value);
}

function okArray(result) {
  return result?.ok && Array.isArray(result.data) ? result.data : [];
}

export function isTrainingSchemaMissing(result) {
  const data = Array.isArray(result?.data) ? result.data[0] : result?.data;
  const code = String(data?.code || result?.code || "");
  const message = String(data?.message || result?.error || "").toLowerCase();
  return result?.status === 404 || TABLE_MISSING_CODES.has(code) || message.includes("training_programs");
}

async function getTable(path) {
  return supabaseServerRequest(path, { useServiceRole: true });
}

export async function loadTrainingAdminModel() {
  const programsResult = await getTable("/rest/v1/training_programs?select=*&order=sort_order.asc");

  if (!programsResult.ok) {
    return {
      schemaReady: false,
      schemaError: isTrainingSchemaMissing(programsResult)
        ? "Les tables formation ne sont pas encore disponibles. Exécute la migration training_platform_foundation avant de gérer le catalogue."
        : "Impossible de charger le catalogue formation.",
      programs: [],
      packs: [],
      modules: [],
      lessons: [],
      resources: [],
      entitlements: [],
      users: []
    };
  }

  const [packsResult, modulesResult, lessonsResult, resourcesResult, entitlementsResult] = await Promise.all([
    getTable("/rest/v1/training_packs?select=*&order=sort_order.asc"),
    getTable("/rest/v1/training_modules?select=*&order=sort_order.asc"),
    getTable("/rest/v1/training_lessons?select=*&order=sort_order.asc"),
    getTable("/rest/v1/training_resources?select=*&order=sort_order.asc"),
    getTable("/rest/v1/training_entitlements?select=*&order=created_at.desc")
  ]);

  return {
    schemaReady: true,
    schemaError: "",
    programs: okArray(programsResult),
    packs: okArray(packsResult),
    modules: okArray(modulesResult),
    lessons: okArray(lessonsResult),
    resources: okArray(resourcesResult),
    entitlements: okArray(entitlementsResult),
    users: []
  };
}

export async function listAuthUsersForAdmin({ page = 1, perPage = 100 } = {}) {
  const result = await supabaseServerRequest(`/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
    useServiceRole: true
  });
  return result?.ok && Array.isArray(result.data?.users) ? result.data.users : [];
}

export async function writeTrainingRecord(table, record, id = null, { onConflict = null } = {}) {
  if (id) {
    return supabaseServerRequest(`/rest/v1/${table}?id=eq.${enc(id)}`, {
      method: "PATCH",
      useServiceRole: true,
      headers: { Prefer: "return=representation" },
      body: record
    });
  }

  return supabaseServerRequest(`/rest/v1/${table}${onConflict ? `?on_conflict=${onConflict}` : ""}`, {
    method: "POST",
    useServiceRole: true,
    headers: { Prefer: onConflict ? "resolution=merge-duplicates,return=representation" : "return=representation" },
    body: record
  });
}

export async function updateTrainingRecord(table, id, record) {
  return writeTrainingRecord(table, record, id);
}

export async function countTrainingDependencies(kind, id) {
  const empty = { progress: 0, favorites: 0, notes: 0, comments: 0, resources: 0, entitlements: 0, children: 0 };
  if (!id) return empty;

  if (kind === "pack") {
    const [modules, entitlements] = await Promise.all([
      getTable(`/rest/v1/training_modules?pack_id=eq.${enc(id)}&select=id`),
      getTable(`/rest/v1/training_entitlements?pack_id=eq.${enc(id)}&select=id`)
    ]);
    return { ...empty, children: okArray(modules).length, entitlements: okArray(entitlements).length };
  }

  if (kind === "module") {
    const lessons = await getTable(`/rest/v1/training_lessons?module_id=eq.${enc(id)}&select=id`);
    return { ...empty, children: okArray(lessons).length };
  }

  if (kind === "lesson") {
    const [progress, favorites, notes, comments, resources] = await Promise.all([
      getTable(`/rest/v1/training_lesson_progress?lesson_id=eq.${enc(id)}&select=id`),
      getTable(`/rest/v1/training_favorites?lesson_id=eq.${enc(id)}&select=id`),
      getTable(`/rest/v1/training_notes?lesson_id=eq.${enc(id)}&select=id`),
      getTable(`/rest/v1/training_comments?lesson_id=eq.${enc(id)}&select=id`),
      getTable(`/rest/v1/training_resources?lesson_id=eq.${enc(id)}&select=id`)
    ]);
    return {
      ...empty,
      progress: okArray(progress).length,
      favorites: okArray(favorites).length,
      notes: okArray(notes).length,
      comments: okArray(comments).length,
      resources: okArray(resources).length
    };
  }

  return empty;
}
