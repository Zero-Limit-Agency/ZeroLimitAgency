import { NextResponse } from "next/server";
import { AuthenticationRequiredError } from "@/lib/zero-limit-id/profile";
import { reportSpaceDataAccessError, requireSpaceAccess } from "@/lib/zero-limit-id/spaces";
import { SpaceAccessDeniedError } from "@/lib/zero-limit-id/space-model";

export async function GET(request, { params }) {
  try {
    const { space } = await requireSpaceAccess(params.spaceId);
    const response = NextResponse.redirect(new URL(`/espace/${encodeURIComponent(space.id)}`, request.url));
    response.cookies.set("zla_last_space", space.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 180 });
    return response;
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.redirect(new URL("/identite/connexion", request.url));
    if (!(error instanceof SpaceAccessDeniedError)) reportSpaceDataAccessError(error, "/espace/[spaceId]/activer");
    const response = NextResponse.redirect(new URL("/espace?indisponible=1", request.url));
    response.cookies.set("zla_last_space", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    return response;
  }
}
