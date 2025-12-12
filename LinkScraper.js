/**
 * Fetches Link Metadata using the "Professional Link Preview" strategy.
 * Prioritizes OG Tags > Twitter Cards > Standard Meta > HTML Body.
 * Reference: https://andrejgajdos.com/how-to-create-a-link-preview/
 */
function fetchLinkMetadata(url) {
  try {
    const params = {
      method: "get",
      muteHttpExceptions: true,
      headers: {
        // Use Googlebot UA to bypass "unusual traffic" blocks from data centers
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    };
    const response = UrlFetchApp.fetch(url, params);
    const html = response.getContentText();

    // 1. EXTRACTOR HELPER (Matches <meta property="..." content="..."> OR <meta name="..." content="...">)
    function getMetaContent(propertyOrName) {
      // Try Property first (OG)
      let match =
        html.match(
          new RegExp(
            "<meta\\s+[^>]*?property=[\"']" +
              propertyOrName +
              "[\"'][^>]*?content=[\"']([^\"']+)[\"']",
            "i"
          )
        ) ||
        html.match(
          new RegExp(
            "<meta\\s+[^>]*?content=[\"']([^\"']+)[\"'][^>]*?property=[\"']" +
              propertyOrName +
              "[\"']",
            "i"
          )
        );
      if (match) return match[1];

      // Try Name second (Twitter / Standard)
      match =
        html.match(
          new RegExp(
            "<meta\\s+[^>]*?name=[\"']" +
              propertyOrName +
              "[\"'][^>]*?content=[\"']([^\"']+)[\"']",
            "i"
          )
        ) ||
        html.match(
          new RegExp(
            "<meta\\s+[^>]*?content=[\"']([^\"']+)[\"'][^>]*?name=[\"']" +
              propertyOrName +
              "[\"']",
            "i"
          )
        );
      return match ? match[1] : null;
    }

    // 2. TITLE STRATEGY
    let title =
      getMetaContent("og:title") ||
      getMetaContent("twitter:title") ||
      (html.match(/<title>([^<]+)<\/title>/i)
        ? html.match(/<title>([^<]+)<\/title>/i)[1]
        : "") ||
      (html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
        ? html.match(/<h1[^>]*>([^<]+)<\/h1>/i)[1]
        : "") ||
      url;

    // 3. DESCRIPTION STRATEGY
    let description =
      getMetaContent("og:description") ||
      getMetaContent("twitter:description") ||
      getMetaContent("description") ||
      (html.match(/<p[^>]*>([^<]+)<\/p>/i)
        ? html.match(/<p[^>]*>([^<]+)<\/p>/i)[1].substring(0, 150) + "..."
        : "");

    // 4. IMAGE STRATEGY
    let image =
      getMetaContent("og:image") ||
      getMetaContent("twitter:image") ||
      (html.match(
        /<link\s+[^>]*?rel=["\']image_src["\'][^>]*?href=["\']([^"\']+)["\']/
      )
        ? html.match(
            /<link\s+[^>]*?rel=["\']image_src["\'][^>]*?href=["\']([^"\']+)["\']/
          )[1]
        : "") ||
      (html.match(
        /<link\s+[^>]*?rel=["\']apple-touch-icon["\'][^>]*?href=["\']([^"\']+)["\']/
      )
        ? html.match(
            /<link\s+[^>]*?rel=["\']apple-touch-icon["\'][^>]*?href=["\']([^"\']+)["\']/
          )[1]
        : "") ||
      "";

    // 5. CLEANUP & NORMALIZATION
    // Fix relative URLs
    if (image && !image.startsWith("http")) {
      // Root relative (starts with /)
      const match = url.match(/^https?:\/\/[^\/]+/);
      const baseUrl = match ? match[0] : url;

      if (image.startsWith("/")) {
        image = baseUrl + image;
      } else {
        image = baseUrl + "/" + image;
      }
    }

    // Decode HTML Entities
    const decodeEntities = (str) => {
      if (!str) return "";
      return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#039;/g, "'");
    };

    return {
      success: true,
      url: url,
      title: decodeEntities(title),
      description: decodeEntities(description),
      image: image,
      hostname: url.split("/")[2],
    };
  } catch (e) {
    return {
      success: false,
      url: url,
      title: url,
      hostname: url.split("/")[2] || "Unknown",
      error: "Failed to fetch: " + e.message,
    };
  }
}
