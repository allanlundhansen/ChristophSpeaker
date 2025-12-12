/**
 * ENTRY POINTS & ROUTING
 * 
 * Note: Apps Script runs all .gs files in the same global scope.
 * Functions in Database.gs, Config.gs, etc. are available here automatically.
 */

/**
 * RUN THIS IDLE FUNCTION ONCE IN THE EDITOR TO AUTHORIZE PERMISSIONS
 */
/**
 * ENTRY POINTS & ROUTING
 * 
 * Note: Apps Script runs all .gs files in the same global scope.
 * Functions in Database.gs, Config.gs, etc. are available here automatically.
 */

// Global permissions helper
function authorizeScript() {
  console.log("Authorizing...");
  UrlFetchApp.fetch("https://www.google.com");
  SpreadsheetApp.getActiveSpreadsheet();
  console.log("Authorized!");
}

function doGet(e) {
  // Try "index" first, then "index.html"
  let template;
  try {
    template = HtmlService.createTemplateFromFile("index");
  } catch (e) {
    try {
        template = HtmlService.createTemplateFromFile("index.html");
    } catch(e2) {
        return ContentService.createTextOutput("CRITICAL ERROR: Could not find 'index' or 'index.html' file. Please redeploy.");
    }
  }

  try {
    return template
      .evaluate()
      .setTitle("YSMS Dashboard")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    return ContentService.createTextOutput("TEMPLATE EVALUATION ERROR: " + e.message + " | Stack: " + e.stack);
  }
}

function include(filename) {
  try {
    // Try exact name using Template evaluation (supports nested includes)
    return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
  } catch (e) {
    try {
        // Try appending .html
        return HtmlService.createTemplateFromFile(filename + ".html").evaluate().getContent();
    } catch(e2) {
        // Return error comment to be visible in source
        return "<!-- ERROR: Could not find file '" + filename + "' or '" + filename + ".html' -->";
    }
  }
}
