import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  serverExternalPackages: ["@sparticuz/chromium-min", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/v1/admin/certificates": ["./src/lib/certificates/**/*"],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/favicon-32x32.png",
        permanent: false,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "d2p.com.tr" }],
        destination: "https://www.d2p.com.tr/:path*",
        permanent: true,
      },
      {
        source: "/kayit",
        destination: "/etkinlikler",
        permanent: true,
      },
    ];
  },
};
export default nextConfig;
