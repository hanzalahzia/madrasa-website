import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/server-site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/portal", "/account", "/cart", "/checkout", "/orders", "/print", "/api"]
      }
    ],
    sitemap: `${siteBaseUrl()}/sitemap.xml`,
    host: siteBaseUrl()
  };
}
