import "server-only";

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const ZIP_SIGNATURES = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08]
];

function startsWithSignature(bytes, signature) {
  return signature.every((value, index) => bytes[index] === value);
}

async function readFileHeader(file, length = 16) {
  const slice = file.slice(0, length);
  return new Uint8Array(await slice.arrayBuffer());
}

async function detectFileSignature(file) {
  const bytes = await readFileHeader(file, 16);

  if (startsWithSignature(bytes, PDF_SIGNATURE)) {
    return "pdf";
  }

  if (startsWithSignature(bytes, PNG_SIGNATURE)) {
    return "png";
  }

  if (startsWithSignature(bytes, JPEG_SIGNATURE)) {
    return "jpeg";
  }

  if (ZIP_SIGNATURES.some((signature) => startsWithSignature(bytes, signature))) {
    return "zip";
  }

  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }

  if (isHeicLike(bytes)) {
    return "heic";
  }

  return "unknown";
}


function isHeicLike(bytes) {
  if (bytes.length < 12) return false;
  const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
  return ["heic", "heix", "heif", "hevc", "hevx", "mif1", "msf1"].includes(brand);
}

function normalizeName(file) {
  return String(file?.name || "").trim().toLowerCase();
}

export function normalizeEmailAddress(value) {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmailAddress(value) {
  const email = normalizeEmailAddress(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email) && email.length <= 320;
}

export function clampText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

export async function assertSafeUpload(file, options) {
  const {
    label = "fichier",
    maxSizeBytes,
    allowedExtensions = [],
    allowedMimeTypes = [],
    allowedSignatures = [],
    required = true
  } = options;

  if (!(file instanceof File) || file.size <= 0) {
    if (required) {
      throw new Error(`Le ${label} est manquant.`);
    }

    return null;
  }

  if (maxSizeBytes && file.size > maxSizeBytes) {
    throw new Error(`Le ${label} dépasse la taille maximale autorisée.`);
  }

  const lowerName = normalizeName(file);
  const hasAllowedExtension =
    allowedExtensions.length === 0 || allowedExtensions.some((extension) => lowerName.endsWith(extension));
  const mimeType = String(file.type || "").toLowerCase();
  const hasAllowedMime = allowedMimeTypes.length === 0 || allowedMimeTypes.includes(mimeType);

  if (!hasAllowedExtension || !hasAllowedMime) {
    throw new Error(`Le format du ${label} n'est pas autorisé.`);
  }

  if (allowedSignatures.length > 0) {
    const signature = await detectFileSignature(file);

    if (!allowedSignatures.includes(signature)) {
      throw new Error(`Le contenu du ${label} ne correspond pas au format attendu.`);
    }
  }

  return file;
}

export async function assertSafeUploadBatch(files, options) {
  const {
    label = "fichier",
    maxFiles = 5,
    maxTotalBytes = 25 * 1024 * 1024
  } = options;

  if (!Array.isArray(files)) {
    return [];
  }

  if (files.length > maxFiles) {
    throw new Error(`Vous pouvez envoyer au maximum ${maxFiles} ${label}${maxFiles > 1 ? "s" : ""}.`);
  }

  const totalBytes = files.reduce((sum, file) => sum + (file?.size || 0), 0);

  if (totalBytes > maxTotalBytes) {
    throw new Error(`Le volume total des ${label}s dépasse la limite autorisée.`);
  }

  await Promise.all(files.map((file) => assertSafeUpload(file, options)));
  return files;
}
