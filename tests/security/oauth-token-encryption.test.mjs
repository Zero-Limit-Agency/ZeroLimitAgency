import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

process.env.OAUTH_TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");

const {
  decryptToken,
  encryptToken,
  getEncryptedTokenValue,
  isEncryptedToken
} = await import("../../lib/security/oauth-token-encryption.js");

test("encryptToken encrypts and decrypts OAuth tokens", () => {
  const encrypted = encryptToken("secret-token-value");

  assert.equal(isEncryptedToken(encrypted), true);
  assert.equal(decryptToken(encrypted), "secret-token-value");
});

test("encryptToken uses a different IV for each encryption", () => {
  const first = encryptToken("same-token");
  const second = encryptToken("same-token");

  assert.notEqual(first, second);
  assert.equal(decryptToken(first), "same-token");
  assert.equal(decryptToken(second), "same-token");
});

test("decryptToken rejects tampered ciphertext", () => {
  const encrypted = encryptToken("tamper-sensitive-token");
  const parts = encrypted.split(":");
  parts[4] = `${parts[4].slice(0, -2)}${parts[4].endsWith("AA") ? "BB" : "AA"}`;

  assert.throws(() => decryptToken(parts.join(":")));
});

test("legacy plaintext tokens remain readable during migration", () => {
  assert.equal(decryptToken("legacy-token"), "legacy-token");
  assert.equal(
    getEncryptedTokenValue({ access_token: "legacy-token" }, "access_token_encrypted", "access_token"),
    "legacy-token"
  );
});

test("missing key fails in a controlled way for new encryption", async () => {
  const previousKey = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  delete process.env.OAUTH_TOKEN_ENCRYPTION_KEY;

  assert.throws(() => encryptToken("new-token"), /OAUTH_TOKEN_ENCRYPTION_KEY/);

  process.env.OAUTH_TOKEN_ENCRYPTION_KEY = previousKey;
});
