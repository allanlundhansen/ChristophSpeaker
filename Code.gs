/**
 * CONFIGURATION
 */
const CONFIG = {
  SHEET_NAME: "Videos",
};

function doGet(e) {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("YSMS Dashboard")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); // Remove headers

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

  // If new, generate ID and append
  if (rowIndex === -1) {
    data.id = Utilities.getUuid();
    data.date = new Date(); // Set creation date
    data.status = data.status || "Idea";
    sheet.appendRow([
      data.id,
      data.title_de,
      data.text_de,
      data.title_en,
      data.text_en,
      data.ideas,
      data.tags,
      data.ref_image,
      data.source_link,
      data.director_notes,
      data.editor_instructions,
      data.raw_footage_url,
      data.final_video_url,
      data.link_youtube,
      data.link_instagram,
      data.link_tiktok,
      data.status,
      data.date,
    ]);
  } else {
    // Update existing row (Naive update: just update mutable fields)
    // For simplicity in this iteration, we recreate the row array.
    // In production, we might want to update specific cells to avoid overwriting concurrent edits,
    // but for this team size, row overwrite is acceptable.
    const range = sheet.getRange(rowIndex, 1, 1, 18);
    // Get existing row to preserve valid dates if not passed
    // But for now, let's assume 'data' contains what we want to save.
    // Important: We need to map data object back to array
    const rowArray = [
      data.id,
      data.title_de,
      data.text_de,
      data.title_en,
      data.text_en,
      data.ideas,
      data.tags,
      data.ref_image,
      data.source_link,
      data.director_notes,
      data.editor_instructions,
      data.raw_footage_url,
      data.final_video_url,
      data.link_youtube,
      data.link_instagram,
      data.link_tiktok,
      data.status,
      data.date || new Date(),
    ];
    range.setValues([rowArray]);
  }

  return true;
}
