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
  },
  outputFileTracingExcludes: {
    "*": ["./node_modules/@matbee/libreoffice-converter/wasm/**"],
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
      // LibreOffice WASM workers: COEP page requires matching COEP on the worker script.
      {
        source: "/libreoffice/:path*",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'none'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net blob:; connect-src 'self' https://cdn.jsdelivr.net blob: data:; worker-src 'self' blob:;",
          },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/admin/presentations",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
      {
        source: "/admin/presentations/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
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
