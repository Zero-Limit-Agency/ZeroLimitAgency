import { SECURITY_HEADERS } from "./lib/security/headers.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: process.env.NODE_ENV === "production"
          ? SECURITY_HEADERS
          : SECURITY_HEADERS.filter((header) => header.key !== "Strict-Transport-Security")
      }
    ];
  }
};

export default nextConfig;