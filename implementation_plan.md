# Implementation Plan: YouTube Script Management System (YSMS)

Web-based workflow tool for video production management, utilizing Google Sheets and Apps Script.

## User Review Required

> [!IMPORTANT] > **Data Integrity**: We have implemented a "Double-Layer" translation protection. Frontend debouncing + Backend Synchronous Fallback ensures English fields are never empty on save.
> **Delete Logic**: Deletion is permanent and can be triggered from both Dashboard (Row/Card) and Detailed View (Studio Header).

## Current Status: Phase 3 (Refining & Optimization)

We have successfully implemented the core Dashboard, the Detailed "Studio" View, and the robust Translation pipeline.

### Completed Features

- **Dashboard**: Kanban/List toggle, Role Filters, Status Filters (Dual filtering possible).
- **Detailed Studio Reference**:
  - Split-pane layout (German Input / English Output).
  - **Visual Sources**: Rich Link Preview cards (OG Tags scraped via Googlebot).
  - **Tagging**: Visual pills system.
  - **Navigation**: "Save Studio" and "Delete" actions in the top header.
- **Backend**:
  - Robust `saveVideo` with auto-translation fallback.
  - `fetchLinkMetadata` for scraping external URLs.
  - `deleteVideo` for managing spreadsheet rows.

## Upcoming Phase 4: Expansion & Maintainability

The next immediate steps focus on code health and the final major feature (Teleprompter).

### 1. Codebase Modularization (Refactor)

The `Code.gs` and `index.html` files are becoming monolithic. We will split them:

- **Backend Split**:
  - `Code.gs`: Main entry points and configuration.
  - `Database.gs`: CRUD operations (`getVideos`, `saveVideo`, `deleteVideo`).
  - `LinkScraper.gs`: The `fetchLinkMetadata` and regex logic.
  - `Translations.gs`: The `translateText` wrapper.
- **Frontend Split**:
  - Break `index.html` into component files (`Components/Header.html`, `Components/Dashboard.html`, `Components/DetailedView.html`, `Components/Modal.html`) included via `<?!= include() ?>`.

### 2. Teleprompter View (Speaker Role)

A dedicated, distraction-free scrolling view for the Speaker role.

- **Route**: New `viewMode === 'teleprompter'`.
- **Features**:
  - Large text display (white on black).
  - Adjustable scroll speed.
  - Mirror mode (optional).
  - "Mark as Recorded" button at the end.

## Data Schema (Google Sheets)

### `Videos` (Main Database)

| Column Index | Header              | Key                   | Type   | Description                   |
| :----------- | :------------------ | :-------------------- | :----- | :---------------------------- |
| 0            | ID                  | `id`                  | UUID   | Unique ID                     |
| 1            | Title_DE            | `title_de`            | String | Original Title                |
| 2            | Text_DE             | `text_de`             | Text   | Script Content (German)       |
| 3            | Title_EN            | `title_en`            | String | **Auto-Translated** (English) |
| 4            | Text_EN             | `text_en`             | Text   | **Auto-Translated** (English) |
| 5            | Ideas               | `ideas`               | Text   | Concept notes                 |
| 6            | Tags                | `tags`                | String | JSON-like string (comma sep)  |
| 7            | Ref_Image           | `ref_image`           | URL    | Image helper                  |
| 8            | Source_Link         | `source_link`         | Text   | Raw links (input)             |
| 9            | Director_Notes      | `director_notes`      | Text   | For Filming                   |
| 10           | Editor_Instructions | `editor_instructions` | Text   | For Editing                   |
| 11           | Raw_Footage_URL     | `raw_footage_url`     | URL    | Dropbox Link                  |
| 12           | Final_Video_URL     | `final_video_url`     | URL    | Drive Link                    |
| 13           | Link_YouTube        | `link_youtube`        | URL    | Published                     |
| 14           | Link_Instagram      | `link_instagram`      | URL    | Published                     |
| 15           | Link_TikTok         | `link_tiktok`         | URL    | Published                     |
| 16           | Status              | `status`              | String | State Machine                 |
| 17           | Date                | `date`                | Date   | Created Date                  |

## Updated Verification Plan

### Automated

- **Link Scraper**: Verify `fetchLinkMetadata` returns generic icons for unknown sites and specific logos for YT/Check.
- **Translation**: Verify empty English fields are auto-filled on backend save.

### Manual

1.  **Teleprompter Flow**:
    - Log in as "Speaker".
    - Open a "Recording Ready" video.
    - Click "Enter Teleprompter".
    - Start Scroll -> Reach End -> "Mark Recorded".
    - Verify status updates to `recording` or `edit_ready`.
