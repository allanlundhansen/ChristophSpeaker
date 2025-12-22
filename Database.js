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
  // 0:ID ... 17:Date, 18:Prompter_Settings (JSON)

  // Filter out rows where ID (Index 0) is empty or whitespace
  const validData = data.filter((row) => row[0].toString().trim() !== "");
  console.log("Found " + validData.length + " valid videos.");

  return validData
    .map((row) => {
      let settings = {};
      try {
        settings = row[18] ? JSON.parse(row[18]) : {};
      } catch (e) {
        console.warn("Failed to parse settings for row", row[0], e);
      }
      return {
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
        prompter_settings: settings
      };
    })
    .reverse();
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

  // AUTO-TRANSLATION FALLBACK
  // ... (Identical to before)
  if (!data.title_en && data.title_de) {
    try {
      data.title_en = LanguageApp.translate(data.title_de, "de", "en");
    } catch (e) {
      data.title_en = ""; // Fail silently
    }
  }
  if (!data.text_en && data.text_de) {
    try {
      data.text_en = LanguageApp.translate(data.text_de, "de", "en");
    } catch (e) {
      data.text_en = "";
    }
  }

  // Map data to full row (19 columns)
  const rowData = [
    data.id,
    data.title_de || "",
    data.text_de || "",
    data.title_en || "", 
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
    data.prompter_settings ? JSON.stringify(data.prompter_settings) : "" // Col 19: JSON Settings
  ];

  // Write the full row at once
  sheet.getRange(rowIndex, 1, 1, 19).setValues([rowData]);
  
  // Sanitize return object: Convert Date objects to strings for Apps Script serialization
  if (data.date instanceof Date) {
    data.date = data.date.toLocaleDateString();
  }

  console.log("Server saveVideo called for ID:", data.id, "Status:", data.status);
  console.log("Data Fields - Ideas:", !!data.ideas, "Instruc:", !!data.editor_instructions, "Notes:", !!data.director_notes);
  
  return data;
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

/**
 * API: Set a single video as 'recording'
 * Enforces that only ONE video can be 'recording' at a time.
 * Demotes any other 'recording' videos to 'recording_ready'.
 */
function setAsActiveRecording(targetId) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  // Column Indexes (0-based)
  // ID is Col 0 (A)
  // Status is Col 16 (Q)
  const ID_COL = 0;
  const STATUS_COL = 16;
  
  // We need to write updates. To be efficient, we can collect them.
  // Or just write directly as we iterate since volume is low.
  
  let targetFound = false;

  for (let i = 1; i < data.length; i++) {
    const rowId = data[i][ID_COL];
    const currentStatus = data[i][STATUS_COL];
    const rowIndex = i + 1; // 1-based index for Sheet API

    if (rowId == targetId) {
       // Promote to recording
       if (currentStatus !== 'recording') {
         sheet.getRange(rowIndex, STATUS_COL + 1).setValue('recording');
       }
       targetFound = true;
    } else if (currentStatus === 'recording') {
       // Demote others to recording_ready
       sheet.getRange(rowIndex, STATUS_COL + 1).setValue('recording_ready');
    }
  }
  
  SpreadsheetApp.flush(); // Force write to ensure subsequent reads are fresh
  return targetFound;
}

/**
 * API: Finish current recording and start next
 * Transition oldId -> targetStatus
 * Transitions newId -> recording
 */
function finishAndNextRecording(oldId, newId, targetStatus) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const STATUS_COL = 16;
  const ID_COL = 0;
  
  let oldUpdated = false;
  let newUpdated = false;

  for (let i = 1; i < data.length; i++) {
    const rowId = data[i][ID_COL];
    const rowIndex = i + 1;

    if (rowId == oldId) {
      sheet.getRange(rowIndex, STATUS_COL + 1).setValue(targetStatus || 'recorded');
      oldUpdated = true;
    } else if (rowId == newId) {
      sheet.getRange(rowIndex, STATUS_COL + 1).setValue('recording');
      newUpdated = true;
    }
  }
  
  SpreadsheetApp.flush();
  return { old: oldUpdated, new: newUpdated };
}

/**
 * API: Update status of a single video
 */
function updateVideoStatus(id, status) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const STATUS_COL = 16;
  const ID_COL = 0;

  for (let i = 1; i < data.length; i++) {
    if (data[i][ID_COL] == id) {
      sheet.getRange(i + 1, STATUS_COL + 1).setValue(status);
      SpreadsheetApp.flush();
      return true;
    }
  }
  return false;
}

/**
 * API: Get Global Teleprompter Settings
 * Uses ScriptProperties to store settings for ALL videos.
 */
function getGlobalSettings() {
  const props = PropertiesService.getScriptProperties();
  const json = props.getProperty('TELEPROMPTER_SETTINGS');
  return json ? JSON.parse(json) : {};
}

/**
 * API: Save Global Teleprompter Settings
 */
function saveGlobalSettings(settings) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('TELEPROMPTER_SETTINGS', JSON.stringify(settings));
  return true;
}
