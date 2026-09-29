import { NextResponse } from "next/server";
import { hasTrustedMutationOrigin } from "@/lib/security/csrf-origin";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isSameOrigin(request) {
  return hasTrustedMutationOrigin({
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer")
  });
}

function requiresBrowserOriginCheck(request) {
  if (!request.nextUrl.pathname.startsWith("/api/")) return false;
  if (!MUTATING_METHODS.has(request.method)) return false;

  // Stripe authenticates the exact raw body and is not a cookie-authenticated
  // browser endpoint. Requiring browser headers would reject legitimate hooks.
  return request.nextUrl.pathname !== "/api/billing/stripe/webhook";
}

export function middleware(request) {
  const path = request.nextUrl.pathname;

  if (requiresBrowserOriginCheck(request) && !isSameOrigin(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Origine de requête non autorisée."
      },
      { status: 403 }
    );
  }

  const response = NextResponse.next();

  if (path.startsWith("/api/admin") || path.startsWith("/api/client") || path.startsWith("/api/auth")) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"]
};
