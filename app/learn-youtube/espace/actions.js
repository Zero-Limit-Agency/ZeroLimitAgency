"use server";

import { revalidatePath } from "next/cache";

import { requireLessonAccess, requireTrainingUser } from "@/lib/learn-youtube/training-data";
import { supabaseServerRequest } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROGRESS_STATUSES = new Set(["in_progress", "completed"]);
const MAX_NOTE_LENGTH = 12_000;

function enc(value) {
  return encodeURIComponent(value);
}

function parseLessonId(formData) {
  const lessonId = String(formData.get("lessonId") || "").trim();
  return UUID_PATTERN.test(lessonId) ? lessonId : "";
}

async function requireActionLesson(formData) {
  const user = await requireTrainingUser();
  const lessonId = parseLessonId(formData);

  if (!lessonId) {
    return { user, lessonId: "", authorized: false };
  }

  await requireLessonAccess(user.id, lessonId);
  return { user, lessonId, authorized: true };
}

export async function markLessonProgress(formData) {
  const { user, lessonId, authorized } = await requireActionLesson(formData);
  const status = String(formData.get("status") || "in_progress").trim();

  if (!authorized || !PROGRESS_STATUSES.has(status)) {
    return;
  }

  const now = new Date().toISOString();
  await supabaseServerRequest("/rest/v1/training_lesson_progress?on_conflict=user_id,lesson_id", {
    method: "POST",
    useServiceRole: true,
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: {
      user_id: user.id,
      lesson_id: lessonId,
      status,
      started_at: now,
      last_activity_at: now,
      completed_at: status === "completed" ? now : null
    }
  });

  revalidatePath("/learn-youtube/espace", "layout");
}

export async function toggleFavorite(formData) {
  const { user, lessonId, authorized } = await requireActionLesson(formData);
  const active = String(formData.get("active") || "") === "1";

  if (!authorized) {
    return;
  }

  if (active) {
    await supabaseServerRequest(`/rest/v1/training_favorites?user_id=eq.${enc(user.id)}&lesson_id=eq.${enc(lessonId)}`, {
      method: "DELETE",
      useServiceRole: true,
      headers: { Prefer: "return=minimal" }
    });
  } else {
    await supabaseServerRequest("/rest/v1/training_favorites?on_conflict=user_id,lesson_id", {
      method: "POST",
      useServiceRole: true,
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: { user_id: user.id, lesson_id: lessonId }
    });
  }

  revalidatePath("/learn-youtube/espace", "layout");
}

export async function saveNote(formData) {
  const { user, lessonId, authorized } = await requireActionLesson(formData);
  const body = String(formData.get("body") || "").slice(0, MAX_NOTE_LENGTH);

  if (!authorized) {
    return;
  }

  if (!body.trim()) {
    await supabaseServerRequest(`/rest/v1/training_notes?user_id=eq.${enc(user.id)}&lesson_id=eq.${enc(lessonId)}`, {
      method: "DELETE",
      useServiceRole: true,
      headers: { Prefer: "return=minimal" }
    });
  } else {
    await supabaseServerRequest("/rest/v1/training_notes?on_conflict=user_id,lesson_id", {
      method: "POST",
      useServiceRole: true,
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: { user_id: user.id, lesson_id: lessonId, body }
    });
  }

  revalidatePath("/learn-youtube/espace", "layout");
}
