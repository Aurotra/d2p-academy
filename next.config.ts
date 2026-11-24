import type { NextConfig } from "next";

import { getSecurityHeaders, getStaticAssetCorsHeaders } from "./src/shared/config/security-headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  serverExternalPackages: [
    "@sparticuz/chromium-min",
    "puppeteer-core",
    "officetopdf-js",
    "officetopdf-linux-x64",
    "officetopdf-linux-x64-musl",
    "officetopdf-windows-x64",
  ],
  outputFileTracingIncludes: {
    "/api/v1/admin/certificates": ["./src/lib/certificates/**/*"],
    "/api/v1/admin/presentations": [
      "./node_modules/officetopdf-js/**/*",
      "./node_modules/officetopdf-linux-x64/**/*",
      "./node_modules/officetopdf-linux-x64-musl/**/*",
      "./node_modules/officetopdf-windows-x64/**/*",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: getStaticAssetCorsHeaders(),
      },
      {
        source: "/:path*",
        headers: getSecurityHeaders(),
      },
    ];
  },
  async redirects() {
    return [
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
      {
        source: "/gizlilik",
        destination: "/gizlilik-sozlesmesi",
        permanent: true,
      },
      {
        source: "/magaza/fennec-planespotter-masaustu-ucak-izleme-cihazi",
        destination: "/magaza/ath-planespotter-masaustu-ucak-izleme-cihazi",
        permanent: true,
      },
      {
        source: "/magaza/fennec-planespotter-masaustu-ucak-izleme-cihazi/satin-al",
        destination: "/magaza/ath-planespotter-masaustu-ucak-izleme-cihazi/satin-al",
        permanent: true,
      },
    ];
  },
};export default nextConfig;
