import "server-only";

import { notFound, redirect } from "next/navigation";

import { getClientSession } from "@/lib/auth/client-auth";
import { supabaseServerRequest } from "@/lib/supabase/server";

export const YOUTUBE_PROGRAM_KEY = "training.youtube";

function okArray(result) {
  return result?.ok && Array.isArray(result.data) ? result.data : [];
}

function enc(value) {
  return encodeURIComponent(value);
}

export async function requireTrainingUser(next = "/learn-youtube/espace") {
  const session = await getClientSession();
  if (!session?.user || session.isDemo) {
    redirect(`/connexion?next=${encodeURIComponent(next)}`);
  }
  return session.user;
}

export async function getTrainingCatalogForUser(userId) {
  const entitlementResult = await supabaseServerRequest(
    `/rest/v1/training_entitlements?user_id=eq.${enc(userId)}&status=eq.active&select=*,program:training_programs(*),pack:training_packs(*)`,
    { useServiceRole: true }
  );
  const entitlements = okArray(entitlementResult).filter((item) => {
    const now = Date.now();
    return (!item.starts_at || new Date(item.starts_at).getTime() <= now) && (!item.expires_at || new Date(item.expires_at).getTime() > now);
  });

  const hasProgramAccess = entitlements.some((item) => item.program?.product_key === YOUTUBE_PROGRAM_KEY || item.product_key === YOUTUBE_PROGRAM_KEY);
  const packKeys = new Set(entitlements.map((item) => item.pack?.product_key || item.product_key).filter(Boolean));

  const programs = okArray(await supabaseServerRequest(
    `/rest/v1/training_programs?product_key=eq.${enc(YOUTUBE_PROGRAM_KEY)}&select=*&limit=1`,
    { useServiceRole: true }
  ));
  const program = programs[0] || null;

  if (!program) {
    return { program: null, packs: [], modules: [], lessons: [], progress: [], favorites: [], notes: [], resources: [], entitlements };
  }

  const allPacks = okArray(await supabaseServerRequest(
    `/rest/v1/training_packs?program_id=eq.${enc(program.id)}&status=eq.published&select=*&order=sort_order.asc`,
    { useServiceRole: true }
  ));
  const packs = hasProgramAccess ? allPacks : allPacks.filter((pack) => packKeys.has(pack.product_key));
  const packIds = packs.map((pack) => pack.id);

  if (packIds.length === 0) {
    return { program, packs: [], modules: [], lessons: [], progress: [], favorites: [], notes: [], resources: [], entitlements };
  }

  const modules = okArray(await supabaseServerRequest(
    `/rest/v1/training_modules?pack_id=in.(${packIds.map(enc).join(",")})&status=eq.published&select=*&order=sort_order.asc`,
    { useServiceRole: true }
  ));
  const moduleIds = modules.map((module) => module.id);
  const lessons = moduleIds.length
    ? okArray(await supabaseServerRequest(
        `/rest/v1/training_lessons?module_id=in.(${moduleIds.map(enc).join(",")})&status=eq.published&select=*&order=sort_order.asc`,
        { useServiceRole: true }
      ))
    : [];
  const lessonIds = lessons.map((lesson) => lesson.id);
  const progress = lessonIds.length
    ? okArray(await supabaseServerRequest(`/rest/v1/training_lesson_progress?user_id=eq.${enc(userId)}&lesson_id=in.(${lessonIds.map(enc).join(",")})&select=*`, { useServiceRole: true }))
    : [];
  const favorites = lessonIds.length
    ? okArray(await supabaseServerRequest(`/rest/v1/training_favorites?user_id=eq.${enc(userId)}&lesson_id=in.(${lessonIds.map(enc).join(",")})&select=*`, { useServiceRole: true }))
    : [];
  const notes = lessonIds.length
    ? okArray(await supabaseServerRequest(`/rest/v1/training_notes?user_id=eq.${enc(userId)}&lesson_id=in.(${lessonIds.map(enc).join(",")})&select=*`, { useServiceRole: true }))
    : [];
  const resources = lessonIds.length
    ? okArray(await supabaseServerRequest(`/rest/v1/training_resources?lesson_id=in.(${lessonIds.map(enc).join(",")})&status=eq.published&select=*&order=sort_order.asc`, { useServiceRole: true }))
    : [];

  return { program, packs, modules, lessons, progress, favorites, notes, resources, entitlements };
}

export function enrichTraining(catalog) {
  const progressByLesson = new Map(catalog.progress.map((item) => [item.lesson_id, item]));
  const favoriteIds = new Set(catalog.favorites.map((item) => item.lesson_id));
  const noteByLesson = new Map(catalog.notes.map((item) => [item.lesson_id, item]));
  const resourcesByLesson = new Map();
  catalog.resources.forEach((resource) => {
    resourcesByLesson.set(resource.lesson_id, [...(resourcesByLesson.get(resource.lesson_id) || []), resource]);
  });
  const lessons = catalog.lessons.map((lesson) => ({ ...lesson, progress: progressByLesson.get(lesson.id) || null, isFavorite: favoriteIds.has(lesson.id), note: noteByLesson.get(lesson.id) || null, resources: resourcesByLesson.get(lesson.id) || [] }));
  const lessonsByModule = new Map();
  lessons.forEach((lesson) => lessonsByModule.set(lesson.module_id, [...(lessonsByModule.get(lesson.module_id) || []), lesson]));
  const modules = catalog.modules.map((module) => ({ ...module, lessons: lessonsByModule.get(module.id) || [] }));
  const modulesByPack = new Map();
  modules.forEach((module) => modulesByPack.set(module.pack_id, [...(modulesByPack.get(module.pack_id) || []), module]));
  const packs = catalog.packs.map((pack) => ({ ...pack, modules: modulesByPack.get(pack.id) || [] }));
  const completedLessons = lessons.filter((lesson) => lesson.progress?.status === "completed").length;
  return { ...catalog, packs, modules, lessons, completedLessons, totalLessons: lessons.length, globalProgress: lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0 };
}

export async function getTrainingSpace(userId) {
  return enrichTraining(await getTrainingCatalogForUser(userId));
}

export function findNextLesson(space) {
  const active = [...space.progress].sort((a, b) => new Date(b.last_activity_at || b.updated_at).getTime() - new Date(a.last_activity_at || a.updated_at).getTime())[0];
  const activeLesson = active ? space.lessons.find((lesson) => lesson.id === active.lesson_id && active.status !== "completed") : null;
  return activeLesson || space.lessons.find((lesson) => lesson.progress?.status !== "completed") || space.lessons[0] || null;
}

export async function requireLessonAccess(userId, lessonId) {
  const space = await getTrainingSpace(userId);
  const lesson = space.lessons.find((item) => item.id === lessonId);
  if (!lesson) notFound();
  const module = space.modules.find((item) => item.id === lesson.module_id);
  const pack = space.packs.find((item) => item.id === module?.pack_id);
  return { space, lesson, module, pack };
}
