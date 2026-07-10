#!/usr/bin/env node

const REQUIRED_ENV = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const PROGRAM = {
  slug: "youtube",
  title: "Formation YouTube",
  description: "Programme de formation Zero Limit dédié à la création et au développement d'une chaîne YouTube.",
  product_key: "training.youtube",
  status: "draft",
  sort_order: 1
};
const PACKS = [
  {
    slug: "montage",
    title: "Montage",
    short_description: "Pack dédié aux bases et méthodes de montage pour les contenus YouTube.",
    description: "Pack en préparation. Les modules et leçons seront ajoutés lorsque les contenus réels seront prêts.",
    product_key: "training.youtube.editing",
    status: "draft",
    sort_order: 1
  },
  {
    slug: "graphisme",
    title: "Graphisme",
    short_description: "Pack dédié aux visuels, miniatures et cohérence graphique d'une chaîne YouTube.",
    description: "Pack en préparation. Les modules et leçons seront ajoutés lorsque les contenus réels seront prêts.",
    product_key: "training.youtube.design",
    status: "draft",
    sort_order: 2
  },
  {
    slug: "monetisation",
    title: "Monétisation",
    short_description: "Pack dédié aux fondamentaux de la monétisation YouTube.",
    description: "Pack en préparation. Les modules et leçons seront ajoutés lorsque les contenus réels seront prêts.",
    product_key: "training.youtube.monetization",
    status: "draft",
    sort_order: 3
  },
  {
    slug: "se-lancer-les-bases",
    title: "Se lancer / Les bases",
    short_description: "Pack dédié aux bases pour lancer une chaîne YouTube proprement.",
    description: "Pack en préparation. Les modules et leçons seront ajoutés lorsque les contenus réels seront prêts.",
    product_key: "training.youtube.basics",
    status: "draft",
    sort_order: 4
  }
];

function getEnv(name) {
  return String(process.env[name] || "").trim();
}

function assertEnv() {
  const missing = REQUIRED_ENV.filter((name) => !getEnv(name));
  if (missing.length > 0) {
    throw new Error(`Variables Supabase manquantes: ${missing.join(", ")}. Aucune écriture effectuée.`);
  }
}

function buildHeaders() {
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json"
  };
}

async function supabaseRequest(path, { method = "GET", body, prefer } = {}) {
  const baseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...buildHeaders(),
      ...(prefer ? { Prefer: prefer } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

function assertOk(result, label) {
  if (!result.ok) {
    const message = result.data?.message || result.data?.error || `HTTP ${result.status}`;
    throw new Error(`${label}: ${message}`);
  }
}

async function getByProductKey(table, productKey) {
  const result = await supabaseRequest(`/rest/v1/${table}?product_key=eq.${encodeURIComponent(productKey)}&select=*&limit=1`);
  assertOk(result, `Lecture ${table}`);
  return Array.isArray(result.data) ? result.data[0] || null : null;
}

async function upsertByProductKey(table, record) {
  const result = await supabaseRequest(`/rest/v1/${table}?on_conflict=product_key`, {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: record
  });
  assertOk(result, `Upsert ${table}`);
  return Array.isArray(result.data) ? result.data[0] : null;
}

async function verifySchema() {
  const result = await supabaseRequest("/rest/v1/training_programs?select=id&limit=1");
  if (!result.ok) {
    const message = result.data?.message || "tables formation indisponibles";
    throw new Error(`Schéma formation non prêt: ${message}. Appliquez d'abord la migration 20260704_training_platform_foundation.sql.`);
  }
}

async function main() {
  assertEnv();
  await verifySchema();

  const existingProgram = await getByProductKey("training_programs", PROGRAM.product_key);
  const program = await upsertByProductKey("training_programs", {
    ...(existingProgram || {}),
    ...PROGRAM,
    id: existingProgram?.id
  });

  if (!program?.id) {
    throw new Error("Programme training.youtube introuvable après upsert. Arrêt.");
  }

  for (const pack of PACKS) {
    const existingPack = await getByProductKey("training_packs", pack.product_key);
    await upsertByProductKey("training_packs", {
      ...(existingPack || {}),
      ...pack,
      id: existingPack?.id,
      program_id: program.id
    });
  }

  console.log("Initialisation Formation YouTube terminée: programme training.youtube et 4 packs en draft.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Initialisation impossible.");
  process.exit(1);
});
