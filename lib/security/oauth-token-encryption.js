import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const TOKEN_PREFIX = "zla-oauth-token";
const TOKEN_VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;
const KEY_LENGTH_BYTES = 32;

function getEncryptionKeyMaterial() {
  return String(process.env.OAUTH_TOKEN_ENCRYPTION_KEY || "").trim();
}

function decodeEncryptionKey() {
  const keyMaterial = getEncryptionKeyMaterial();

  if (!keyMaterial) {
    throw new Error("OAUTH_TOKEN_ENCRYPTION_KEY est manquante.");
  }

  const normalized = keyMaterial.startsWith("base64:") ? keyMaterial.slice("base64:".length) : keyMaterial;
  const key = Buffer.from(normalized, "base64");

  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error("OAUTH_TOKEN_ENCRYPTION_KEY doit contenir 32 octets encodes en base64.");
  }

  return key;
}

export function isEncryptedToken(value) {
  return String(value || "").startsWith(`${TOKEN_PREFIX}:${TOKEN_VERSION}:`);
}

export function encryptToken(token) {
  const plaintext = String(token || "");

  if (!plaintext) {
    return null;
  }

  const key = decodeEncryptionKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES
  });
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    TOKEN_PREFIX,
    TOKEN_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url")
  ].join(":");
}

export function decryptToken(value) {
  const serialized = String(value || "");

  if (!serialized) {
    return null;
  }

  if (!isEncryptedToken(serialized)) {
    return serialized;
  }

  const [version, ivValue, authTagValue, ciphertextValue] = serialized.slice(`${TOKEN_PREFIX}:`.length).split(":");

  if (version !== TOKEN_VERSION || !ivValue || !authTagValue || !ciphertextValue) {
    throw new Error("Format de token OAuth chiffre invalide.");
  }

  const key = decodeEncryptionKey();
  const iv = Buffer.from(ivValue, "base64url");
  const authTag = Buffer.from(authTagValue, "base64url");
  const ciphertext = Buffer.from(ciphertextValue, "base64url");

  if (iv.length !== IV_LENGTH_BYTES || authTag.length !== AUTH_TAG_LENGTH_BYTES) {
    throw new Error("Parametres de token OAuth chiffre invalides.");
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES
  });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function getEncryptedTokenValue(record, encryptedField, legacyField) {
  const encryptedValue = record?.[encryptedField];

  if (encryptedValue) {
    return decryptToken(encryptedValue);
  }

  return decryptToken(record?.[legacyField] || null);
}
