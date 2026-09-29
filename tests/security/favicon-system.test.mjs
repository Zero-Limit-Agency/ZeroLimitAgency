import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const requiredPublicAssets = [
  "favicon.svg",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "favicon-48x48.png",
  "favicon.ico",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "icon-1024.png",
  "icon-maskable-192.png",
  "icon-maskable-512.png",
  "icon-maskable-1024.png",
  "safari-pinned-tab.svg"
];

const layout = await readFile(new URL("../../app/layout.js", import.meta.url), "utf8");
const manifest = await readFile(new URL("../../app/manifest.js", import.meta.url), "utf8");

test("all referenced favicon and app icon assets exist in public", async () => {
  for (const filename of requiredPublicAssets) {
    await access(new URL(`../../public/${filename}`, import.meta.url));
  }
});

test("root metadata references the explicit public icon system", () => {
  assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/);
  assert.match(layout, /\/favicon\.svg/);
  assert.match(layout, /\/favicon-48x48\.png/);
  assert.match(layout, /\/favicon-32x32\.png/);
  assert.match(layout, /\/favicon-16x16\.png/);
  assert.match(layout, /\/favicon\.ico/);
  assert.match(layout, /\/apple-touch-icon\.png/);
  assert.match(layout, /\/safari-pinned-tab\.svg/);
});

test("manifest includes regular and maskable install icons", () => {
  assert.match(manifest, /\/icon-192\.png/);
  assert.match(manifest, /\/icon-512\.png/);
  assert.match(manifest, /\/icon-maskable-192\.png/);
  assert.match(manifest, /\/icon-maskable-512\.png/);
  assert.match(manifest, /purpose:\s*"any"/);
  assert.match(manifest, /purpose:\s*"maskable"/);
});
