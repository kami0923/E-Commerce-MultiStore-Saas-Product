import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  // Windows can intermittently lock generated route folders when build workers
  // race to create them. A single worker keeps local and CI builds deterministic.
  experimental: {
    cpus: 1,
    // The media library accepts up to ten 8 MB images in one submission.
    // Leave a small allowance for multipart field metadata and boundaries.
    serverActions: { bodySizeLimit: "85mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
    ] }];
  },
};

export default nextConfig;
