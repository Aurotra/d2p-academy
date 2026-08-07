import { ImageResponse } from "next/og";

import { getFaviconLogoDataUrl } from "@/shared/utils/favicon-logo";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
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
        }}
      >
        <img src={logoSrc} width={30} height={30} style={{ objectFit: "contain" }} alt="" />
      </div>
    ),
    { ...size },
  );
}
