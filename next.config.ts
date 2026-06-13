import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "d2p.com.tr" }],
        destination: "https://www.d2p.com.tr/:path*",
        permanent: true,
      },
    ];
  },
};
export default nextConfig;