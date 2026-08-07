import { ImageResponse } from "next/og";

import { getFaviconLogoDataUrl } from "@/shared/utils/favicon-logo";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const logoSrc = await getFaviconLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          padding: 20,
        }}
      >
        <img src={logoSrc} width={140} height={140} style={{ objectFit: "contain" }} alt="" />
      </div>
    ),
    { ...size },
  );
}
