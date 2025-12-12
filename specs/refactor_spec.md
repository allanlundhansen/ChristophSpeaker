# Codebase Refactor Specification

## Overview

This refactor aims to decompose the monolithic `Code.js` (backend) and `index.html` (frontend) files into modular, domain-specific files. This increases maintainability and readability, clearing the path for the upcoming Teleprompter feature.

## 1. Backend Refactor (`Code.js`)

The `Code.js` file currently handles Configuration, Auth, Routing, CRUD, and Scraping. It will be split into:

| New File              | Responsibility                                                                  |
| :-------------------- | :------------------------------------------------------------------------------ |
| **`Main.js`**         | Entry points (`doGet`, `authorizeScript`), `include` helper.                    |
| **`Config.js`**       | Global constants (`CONFIG`).                                                    |
| **`Database.js`**     | Core CRUD (`getVideos`, `saveVideo`, `deleteVideo`, `setVideoRecordingStatus`). |
| **`LinkScraper.js`**  | `fetchLinkMetadata` and regex helper functions.                                 |
| **`Translations.js`** | `translateText` and language logic.                                             |

_Note: In the local filesystem they are `.js`. in Apps Script they compile to `.gs`._

## 2. Frontend Layout Refactor (`index.html`)

The `index.html` file contains the logic for multiple view modes (Dashboard, Detail, Modal) in one 500+ line file. It will be split using the `<?!= include() ?>` pattern.

### Structure

**`index.html`** will become a minimal "Shell":

```html
<!DOCTYPE html>
<html>
  <head>
    ...
  </head>
  <body>
    <div id="app">
      <!-- Components -->
      <?!= include('components/Dashboard'); ?>
      <?!= include('components/DetailedView'); ?>
      <?!= include('components/Modal'); ?>
      <!-- Future: Teleprompter -->
    </div>
    <?!= include('javascript'); ?>
  </body>
</html>
```

### Components Folder

| New File (e.g. `components/...`) | Content                                               |
| :------------------------------- | :---------------------------------------------------- |
| **`Navbar.html`**                | The top navigation bar (Logo, Role Switcher).         |
| **`Dashboard.html`**             | The Kanban Grid and List Table.                       |
| **`DetailedView.html`**          | The "Studio" full-screen overlay (includes Header).   |
| **`Modal.html`**                 | The "New Video" / "Edit" popup.                       |
| **`Icons.html`**                 | (Optional) SVG definitions if we want to deduplicate. |

## 3. Execution Plan

1.  **Backup**: Ensure `Code.js` and `index.html` are safe (Git commit).
2.  **Backend Split**: Create new `.js` files and move functions. Verify `doGet` references them correctly (Apps Script global scope makes this easy).
3.  **Frontend Split**:
    - Extract specific HTML blocks into their own files.
    - Replace blocks in `index.html` with `include` calls.
4.  **Verification**: Deploy and test that all Views (Dashboard, Detail, Modal) still render and data loads.
