import "server-only";

import { getSupabaseServerConfig } from "@/lib/supabase/server";

export const POST_CALL_ZERO_BUCKET = "post-call-zero";
export const SITE_ASSETS_BUCKET = "site-assets";
export const CLIENT_COLLABORATION_BUCKET = "client-collaboration";

function encodeStoragePath(path) {
  return String(path || "")
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function sanitizeFileName(fileName) {
  return String(fileName || "document")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export function buildPostCallZeroStoragePath(applicationId, documentType, fileName) {
  const safeName = sanitizeFileName(fileName);
  return `applications/${applicationId}/${documentType}-${Date.now()}-${safeName}`;
}

export function buildSiteAssetStoragePath(section, itemId, fileName) {
  const safeName = sanitizeFileName(fileName);
  const safeItemId = sanitizeFileName(itemId || "item");
  const safeSection = sanitizeFileName(section || "site");
  return `site-content/${safeSection}/${safeItemId}-${Date.now()}-${safeName}`;
}

export function buildClientCollaborationStoragePath(applicationId, messageId, fileName) {
  const safeName = sanitizeFileName(fileName);
  const safeApplicationId = sanitizeFileName(applicationId || "application");
  const safeMessageId = sanitizeFileName(messageId || "message");
  return `applications/${safeApplicationId}/collaboration/${safeMessageId}-${Date.now()}-${safeName}`;
}

async function storageRequest(path, { method = "GET", headers, body } = {}) {
  const { url, serviceRoleKey } = getSupabaseServerConfig();

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY est manquante.");
  }

  return fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...headers
    },
    body,
    cache: "no-store"
  });
}

export async function uploadStorageObject({ bucket, path, contentType, body, upsert = true }) {
  const response = await storageRequest(`/storage/v1/object/${encodeStoragePath(`${bucket}/${path}`)}`, {
    method: "POST",
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      "x-upsert": upsert ? "true" : "false"
    },
    body
  });

  const data = await response.json().catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    data,
    error: data?.message || data?.error || null
  };
}

export async function removeStorageObject({ bucket, path }) {
  if (!path) {
    return { ok: true, status: 200 };
  }

  const response = await storageRequest(`/storage/v1/object/${encodeStoragePath(`${bucket}/${path}`)}`, {
    method: "DELETE"
  });

  const data = await response.json().catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    data,
    error: data?.message || data?.error || null
  };
}

export async function downloadStorageObject({ bucket, path }) {
  const response = await storageRequest(`/storage/v1/object/${encodeStoragePath(`${bucket}/${path}`)}`);
  const arrayBuffer = await response.arrayBuffer().catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    data: arrayBuffer,
    contentType: response.headers.get("content-type") || "application/octet-stream"
  };
}

export function getPublicStorageUrl({ bucket, path }) {
  const { url } = getSupabaseServerConfig();
  return `${url}/storage/v1/object/public/${bucket}/${encodeStoragePath(path)}`;
}
