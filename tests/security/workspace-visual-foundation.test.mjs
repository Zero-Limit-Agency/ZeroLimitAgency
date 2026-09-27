import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const shell = await readFile(new URL("../../components/workspace/private-shell.jsx", import.meta.url), "utf8");
const switcher = await readFile(new URL("../../components/workspace/space-switcher.jsx", import.meta.url), "utf8");
const navigation = await readFile(new URL("../../components/workspace/workspace-navigation.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../../app/espace/workspace.css", import.meta.url), "utf8");
const layout = await readFile(new URL("../../app/espace/layout.js", import.meta.url), "utf8");
const dictionary = await readFile(new URL("../../lib/i18n/spaces.js", import.meta.url), "utf8");
const landing = await readFile(new URL("../../components/workspace/space-landing.jsx", import.meta.url), "utf8");
const members = await readFile(new URL("../../components/workspace/team-members-manager.jsx", import.meta.url), "utf8");

test("Workspace visual styles stay scoped away from Auth and OWNER", () => {
  assert.match(layout, /import "\.\/workspace\.css"/);
  assert.match(layout, /<WorkspaceShell>/);
  assert.match(styles, /\.workspace-root \{/);
  assert.doesNotMatch(styles, /\.owner-|\.identity-shell/);
});

test("the shell preserves routes while separating global and Space navigation", () => {
  assert.match(shell, /href="\/espace"/);
  assert.match(shell, /<WorkspaceNavigation currentSpace=\{currentSpace\}/);
  assert.match(navigation, /`\/espace\/\$\{currentSpace\.id\}`/);
  assert.match(navigation, /\/membres/);
  assert.match(navigation, /\/settings/);
  assert.match(navigation, /module\.href\.replace\("\[spaceId\]", currentSpace\.id\)/);
  assert.match(navigation, /aria-current=\{active \? "page"/);
});

test("switcher retains activation links and accessible menu state", () => {
  assert.match(switcher, /aria-expanded=\{open\}/);
  assert.match(switcher, /aria-haspopup="menu"/);
  assert.match(switcher, /\/activer/);
  assert.match(switcher, /aria-current=\{currentSpace\?\.id === space\.id/);
  assert.match(switcher, /event\.key === "Escape"/);
});

test("responsive, focus and reduced-motion foundations are explicit", () => {
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /@media \(max-width: 1000px\)/);
  assert.match(styles, /@media \(max-width: 767px\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

test("Preview polish keeps Team singular and explains the URL identifier", () => {
  assert.doesNotMatch(dictionary, /team: "Teams"/);
  assert.match(dictionary, /team: "Team"/);
  assert.match(dictionary, /slug: "Identifiant d’URL"/);
  assert.match(dictionary, /slug: "URL identifier"/);
});

test("duplicated settings CTA is removed and empty member groups are compactable", () => {
  assert.doesNotMatch(landing, /settings\.title/);
  assert.match(members, /team-group\$\{groups\[key\]\.length \? "" : " is-empty"\}/);
  assert.match(members, /team-invitations\$\{initialData\.invitations\.length \? "" : " is-empty"\}/);
  assert.match(styles, /\.is-empty \.team-empty/);
});
