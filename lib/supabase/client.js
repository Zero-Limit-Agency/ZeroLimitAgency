function assertPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL est manquante.");
  }

  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY est manquante.");
  }

  return { url, anonKey };
}

export function getSupabaseBrowserConfig() {
  return assertPublicSupabaseEnv();
}

export function createSupabaseBrowserClient() {
  const { url, anonKey } = assertPublicSupabaseEnv();

  async function request(path, { method = "GET", body, accessToken, headers } = {}) {
    const response = await fetch(`${url}${path}`, {
      method,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken || anonKey}`,
        "Content-Type": "application/json",
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json().catch(() => null);

    return {
      ok: response.ok,
      status: response.status,
      data
    };
  }

  return {
    auth: {
      signUp({ email, password, options }) {
        return request("/auth/v1/signup", {
          method: "POST",
          body: { email, password, options }
        });
      },
      signInWithPassword({ email, password }) {
        return request("/auth/v1/token?grant_type=password", {
          method: "POST",
          body: { email, password }
        });
      },
      getUser(accessToken) {
        return request("/auth/v1/user", {
          accessToken
        });
      }
    }
  };
}
