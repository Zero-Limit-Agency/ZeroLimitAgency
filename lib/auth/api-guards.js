import "server-only";

import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { resolveOwnerSession } from "@/lib/owner/access";
import { OwnerAccessError } from "@/lib/owner/errors";

export function buildUuidParamError(label = "Identifiant invalide.") {
  return NextResponse.json({ success: false, error: label }, { status: 400 });
}

export function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );
}

export async function requireAdminApiSession() {
  const session = await getClientSession();

  if (!session?.user || !(await isAdminUser(session.user))) {
    return {
      ok: false,
      session: null,
      response: NextResponse.json(
        {
          success: false,
          error: "Accès administrateur requis."
        },
        { status: 403 }
      )
    };
  }

  return {
    ok: true,
    session,
    response: null
  };
}

export async function requireAuthenticatedApiSession() {
  const session = await getClientSession();

  if (!session?.user) {
    return {
      ok: false,
      session: null,
      response: NextResponse.json(
        {
          success: false,
          error: "Connexion requise."
        },
        { status: 401 }
      )
    };
  }

  return {
    ok: true,
    session,
    response: null
  };
}

export async function requireOwnerApiSession() {
  const session = await getClientSession();
  try { const owner = await resolveOwnerSession(session); return { ok: true, session, owner, response: null }; }
  catch (error) {
    const status = error instanceof OwnerAccessError ? error.status : 503;
    const code = error instanceof OwnerAccessError ? error.code : "owner_action_forbidden";
    return { ok: false, session: null, owner: null, response: NextResponse.json({ success: false, error: code }, { status }) };
  }
}
