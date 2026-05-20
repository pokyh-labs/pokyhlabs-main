import { ImageResponse } from "next/og"

export const alt = "pokyh.studio – 3D Websites & Webdesign kaufen"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1a1a1a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "80px",
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#593DF8",
              marginRight: "14px",
            }}
          />
          <span
            style={{
              color: "#593DF8",
              fontSize: "16px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            pokyh.studio
          </span>
        </div>

        <div
          style={{
            color: "#ffffff",
            fontSize: "80px",
            fontWeight: 600,
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
            marginBottom: "32px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>We build the web.</span>
          <span style={{ color: "#593DF8" }}>Properly.</span>
        </div>

        <div
          style={{
            color: "#666666",
            fontSize: "22px",
            letterSpacing: "0.02em",
          }}
        >
          3D Websites & Webdesign kaufen — Digital Studio Südtirol
        </div>
      </div>
    ),
    { ...size }
  )
}
