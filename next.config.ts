import type { NextConfig } from "next";

import { getSecurityHeaders, getStaticAssetCorsHeaders } from "./src/shared/config/security-headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  serverExternalPackages: [
    "@sparticuz/chromium-min",
    "puppeteer-core",
    "@matbee/libreoffice-converter",
  ],
  outputFileTracingIncludes: {
    "/api/v1/admin/certificates": ["./src/lib/certificates/**/*"],
    "/api/v1/admin/presentations": [
      "./node_modules/@matbee/libreoffice-converter/wasm/loader.cjs",
      "./node_modules/@matbee/libreoffice-converter/wasm/soffice.js",
      "./node_modules/@matbee/libreoffice-converter/wasm/soffice.cjs",
      "./node_modules/@matbee/libreoffice-converter/wasm/soffice.worker.js",
      "./node_modules/@matbee/libreoffice-converter/wasm/soffice.worker.cjs",
    ],
  },
  // Keep ~240MB binaries out of the deploy; they are fetched to /tmp at runtime.
  outputFileTracingExcludes: {
    "*": [
      "./node_modules/@matbee/libreoffice-converter/wasm/soffice.wasm",
      "./node_modules/@matbee/libreoffice-converter/wasm/soffice.data",
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
