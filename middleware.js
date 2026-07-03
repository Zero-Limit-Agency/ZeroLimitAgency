import { NextResponse } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isSameOrigin(request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export function middleware(request) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/api/") && MUTATING_METHODS.has(request.method) && !isSameOrigin(request)) {
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
