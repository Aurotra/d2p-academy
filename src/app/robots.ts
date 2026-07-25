import type { MetadataRoute } from "next";

import { SITE_URL } from "@/shared/constants/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/dashboard",
        "/dashboard/",
        "/instructor",
        "/instructor/",
        "/student-dashboard",
        "/student-dashboard/",
        "/login",
        "/register",
        "/student-login",
        "/instructor-login",
        "/dogrula/",
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
