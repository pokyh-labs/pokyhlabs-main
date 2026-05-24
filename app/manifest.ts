import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "pokyh.studio – 3D Websites & Webdesign",
    short_name: "pokyh.studio",
    description: "3D Websites & professionelles Webdesign kaufen. Digital Studio aus Südtirol.",
    start_url: "/",
    display: "standalone",
    background_color: "#e4e2dc",
    theme_color: "#0c0c0c",
    icons: [
      { src: "/assets/logo.png", sizes: "any", type: "image/png" },
    ],
  }
}
