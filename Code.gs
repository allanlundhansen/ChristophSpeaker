/**
 * CONFIGURATION
 */
const CONFIG = {
  SHEET_NAME: "Videos",
};

/**
 * RUN THIS IDLE FUNCTION ONCE IN THE EDITOR TO AUTHORIZE PERMISSIONS
 */
function authorizeScript() {
  console.log("Authorizing...");
  UrlFetchApp.fetch("https://www.google.com");
  SpreadsheetApp.getActiveSpreadsheet();
  console.log("Authorized!");
}

function doGet(e) {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("YSMS Dashboard")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function deleteVideo(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    CONFIG.SHEET_NAME
  );
  const data = sheet.getDataRange().getValues();
  // Row 0 is header.
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1); // 1-based index
      return true;
    }
  }
  return false;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * HELPER: Get the sheet object
 * Uses getActiveSpreadsheet() since script is bound.
 */
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet)
    throw new Error(
      `Sheet "${CONFIG.SHEET_NAME}" not found. Please create it.`
    );
  return sheet;
}

/**
 * API: Get all videos
 */
function getVideos() {
  const sheet = getSheet();
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();
  const headers = data.shift(); // Remove headers

  let idsToUpdate = [];

  // Pre-process: Check for rows with content but missing ID or Date
  data.forEach((row, index) => {
    const id = row[0];
    const date = row[17];
    const hasContent = row
      .slice(1)
      .some((cell) => cell.toString().trim() !== ""); // Check Col B onwards

    let needsUpdate = false;
    const updateData = { row: index + 2 }; // Base update object

    if (hasContent) {
      if (!id) {
        const newId = Utilities.getUuid();
        row[0] = newId;
        updateData.id = newId;
        needsUpdate = true;
      }
      if (!date) {
        const newDate = new Date();
        row[17] = newDate;
        updateData.date = newDate;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      idsToUpdate.push(updateData);
    }
  });

  // Batch Write Back IDs/Dates (if any)
  if (idsToUpdate.length > 0) {
    idsToUpdate.forEach((item) => {
      if (item.id) sheet.getRange(item.row, 1).setValue(item.id);
      if (item.date) sheet.getRange(item.row, 18).setValue(item.date);
    });
  }

  // Column Mappings (0-indexed based on Plan):
  // 0:ID, 1:Title_DE, 2:Text_DE, 3:Title_EN, 4:Text_EN, 5:Ideas, 6:Tags
  // 7:Ref_Image, 8:Source_Link, ... 16:Status, 17:Date

  // Filter out rows where ID (Index 0) is empty or whitespace
  const validData = data.filter((row) => row[0].toString().trim() !== "");
  console.log("Found " + validData.length + " valid videos.");

  return validData
    .map((row) => ({
      id: row[0],
      title_de: row[1],
      text_de: row[2],
      title_en: row[3],
      text_en: row[4],
      ideas: row[5],
      tags: row[6],
      ref_image: row[7],
      source_link: row[8],
      director_notes: row[9],
      editor_instructions: row[10],
      raw_footage_url: row[11],
      final_video_url: row[12],
      link_youtube: row[13],
      link_instagram: row[14],
      link_tiktok: row[15],
      status: row[16],
      date: row[17] ? new Date(row[17]).toLocaleDateString() : "",
    }))
    .reverse(); // Show newest first
}

/**
 * API: Save a video (Create or Update)
 */
function saveVideo(data) {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;

  // Check if updating existing
  if (data.id) {
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0].toString() == data.id) {
        rowIndex = i + 1; // 1-indexed
        break;
      }
    }
  }

  // If new, generate ID and determine next row
  if (rowIndex === -1) {
    data.id = Utilities.getUuid();
    data.date = new Date(); // Set creation date
    data.status = data.status || "draft";

    // Scan Column A to find the first truly empty row
    const ids = sheet.getRange("A:A").getValues();
    let firstEmpty = ids.length + 1;
    for (let i = 1; i < ids.length; i++) {
      if (!ids[i][0]) {
        firstEmpty = i + 1; // Found it (1-indexed)
        break;
      }
    }
    rowIndex = firstEmpty;
  }

  // Map data to full row (18 columns)
  // Col order: ID, Title_DE, Text_DE, Title_EN, Text_EN, Ideas, ...
  const rowData = [
    data.id,
    data.title_de || "",
    data.text_de || "",
    data.title_en || "", // Now saving English values directly
    data.text_en || "",
    data.ideas || "",
    data.tags || "",
    data.ref_image || "",
    data.source_link || "",
    data.director_notes || "",
    data.editor_instructions || "",
    data.raw_footage_url || "",
    data.final_video_url || "",
    data.link_youtube || "",
    data.link_instagram || "",
    data.link_tiktok || "",
    data.status || "draft",
    data.date || new Date(),
  ];

  // Write the full row at once
  sheet.getRange(rowIndex, 1, 1, 18).setValues([rowData]);
  return true;
}

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
/**
 * API: Translate text
 */
function translateText(text, sourceLang, targetLang) {
  if (!text) return "";
  return LanguageApp.translate(text, sourceLang, targetLang);
}
