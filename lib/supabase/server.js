import "server-only";

function assertServerSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL est manquante.");
  }

  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY est manquante.");
  }

  return { url, anonKey, serviceRoleKey };
}

export function getSupabaseServerConfig() {
  return assertServerSupabaseEnv();
}

export function requireSupabaseServiceRoleConfig() {
  const { url, serviceRoleKey } = assertServerSupabaseEnv();
  if (!serviceRoleKey) {
    const error = new Error("Supabase service role is not configured");
    error.name = "SupabaseServiceRoleConfigurationError";
    throw error;
  }
  return { url, serviceRoleKey };
}

export async function supabaseServerRequest(path, { method = "GET", body, useServiceRole = false, headers } = {}) {
  const { url, anonKey, serviceRoleKey } = assertServerSupabaseEnv();
  const apiKey = useServiceRole ? serviceRoleKey : anonKey;

  if (useServiceRole && !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY est manquante.");
  }

  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });

  const data = await response.json().catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    data
  };
}
