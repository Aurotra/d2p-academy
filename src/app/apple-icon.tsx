import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          letterSpacing: "-0.12em",
        }}
      >
        <span style={{ fontSize: 108, fontWeight: 900, color: "#E63946", lineHeight: 1 }}>D</span>
        <span style={{ fontSize: 108, fontWeight: 900, color: "#FFB703", lineHeight: 1, marginTop: -10 }}>
          2
        </span>
        <span style={{ fontSize: 108, fontWeight: 900, color: "#2A9D8F", lineHeight: 1 }}>P</span>
      </div>
    ),
    { ...size },
  );
}
