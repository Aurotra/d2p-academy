import { ImageResponse } from "next/og";

import { SITE_NAME, SITE_TAGLINE } from "@/shared/constants/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 55%, #38bdf8 100%)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "#E63946",
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "-0.04em",
          }}
        >
          D2P
        </div>
        <div style={{ marginTop: 40, fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>
          {SITE_NAME}
        </div>
        <div style={{ marginTop: 20, fontSize: 32, fontWeight: 500, opacity: 0.92 }}>
          {SITE_TAGLINE} · 3D tasarım, baskı ve robotik eğitimleri
        </div>
        <div style={{ marginTop: 48, fontSize: 24, opacity: 0.85 }}>www.d2p.com.tr</div>
      </div>
    ),
    { ...size },
  );
}
