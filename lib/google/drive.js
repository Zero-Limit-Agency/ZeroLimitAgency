import "server-only";

import { assertGoogleOAuthEnv, getValidGoogleDriveAccessToken } from "@/lib/google/oauth";

const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const GOOGLE_DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";

async function googleDriveRequest(url, { method = "GET", headers, body } = {}) {
  const accessToken = await getValidGoogleDriveAccessToken();
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...headers
    },
    body,
    cache: "no-store"
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message || data?.error_description || "Erreur Google Drive.";

    throw new Error(message);
  }

  return data;
}

function escapeDriveQueryValue(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function sanitizeSegment(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 60);
}

function buildShortId(applicationId) {
  return String(applicationId || "")
    .replace(/-/g, "")
    .slice(0, 6)
    .toLowerCase();
}

function buildLeadFolderName({ applicationId, firstName, lastName, pseudo, createdAt, email }) {
  const createdDate = createdAt
    ? new Date(createdAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const orderedSegments = [
    createdDate,
    sanitizeSegment(lastName),
    sanitizeSegment(firstName),
    sanitizeSegment(pseudo),
    !lastName && !firstName && !pseudo ? sanitizeSegment(email?.split("@")[0]) : "",
    buildShortId(applicationId)
  ].filter(Boolean);

  return orderedSegments.join("_");
}

export function buildDriveFolderUrl(folderId) {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

export async function ensureLeadDriveFolder({
  applicationId,
  firstName,
  lastName,
  pseudo,
  createdAt,
  email
}) {
  const { leadsRootFolderId } = assertGoogleOAuthEnv();
  const folderName = buildLeadFolderName({
    applicationId,
    firstName,
    lastName,
    pseudo,
    createdAt,
    email
  });
  const searchParams = new URLSearchParams({
    q: [
      `mimeType='application/vnd.google-apps.folder'`,
      `trashed=false`,
      `name='${escapeDriveQueryValue(folderName)}'`,
      `'${escapeDriveQueryValue(leadsRootFolderId)}' in parents`
    ].join(" and "),
    fields: "files(id,name)",
    pageSize: "1"
  });
  const searchUrl = `${GOOGLE_DRIVE_API_BASE}/files?${searchParams.toString()}`;
  const searchData = await googleDriveRequest(searchUrl);
  const existingFolder = Array.isArray(searchData?.files) ? searchData.files[0] : null;

  if (existingFolder?.id) {
    return {
      id: existingFolder.id,
      url: buildDriveFolderUrl(existingFolder.id),
      created: false
    };
  }

  const createUrl = `${GOOGLE_DRIVE_API_BASE}/files?fields=id,name`;
  const createdFolder = await googleDriveRequest(createUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [leadsRootFolderId]
    })
  });

  return {
    id: createdFolder.id,
    url: buildDriveFolderUrl(createdFolder.id),
    created: true
  };
}

export async function uploadFilesToLeadFolder({ folderId, files }) {
  const uploadedFiles = [];

  for (const file of files) {
    const uploadedFile = await uploadFileToFolder({ folderId, file });
    uploadedFiles.push(uploadedFile);
  }

  return uploadedFiles;
}

async function uploadFileToFolder({ folderId, file }) {
  const boundary = `zero-limit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const metadata = {
    name: file.name,
    parents: [folderId]
  };
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const multipartBody = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
    ),
    Buffer.from(`--${boundary}\r\nContent-Type: ${file.type || "application/octet-stream"}\r\n\r\n`),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--`)
  ]);
  const uploadUrl = `${GOOGLE_DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,webViewLink,mimeType,size`;
  const uploadedFile = await googleDriveRequest(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  return {
    id: uploadedFile.id,
    name: uploadedFile.name,
    mimeType: uploadedFile.mimeType,
    size: uploadedFile.size,
    url: uploadedFile.webViewLink || null
  };
}
