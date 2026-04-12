import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app/", "/onboarding/", "/admin/", "/api/", "/vendor-portal/"],
      },
    ],
    sitemap: "https://workchores.com/sitemap.xml",
  };
}
