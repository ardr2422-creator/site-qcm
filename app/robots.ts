import type { MetadataRoute } from "next";

/** L'espace organisateur et les routes techniques ne sont pas à indexer. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
  };
}
