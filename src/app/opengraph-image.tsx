import { ImageResponse } from "next/og";

export const alt = "D2P Academy";
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
          padding: 72,
          background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 45%, #ffffff 100%)",
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
            color: "#ffffff",
            fontSize: 36,
            fontWeight: 800,
            marginBottom: 28,
          }}
        >
          D2P
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "#0c4a6e",
            lineHeight: 1.1,
          }}
        >
          D2P Academy
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 28,
            color: "#0369a1",
            maxWidth: 820,
            lineHeight: 1.4,
          }}
        >
          Design to Print — 3D tasarım, baskı ve robotik atölyeleri
        </div>
      </div>
    ),
    { ...size },
  );
}
