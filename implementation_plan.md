# Implementation Plan: YouTube Script Management System (YSMS)

Web-based workflow tool for video production management, utilizing Google Sheets and Apps Script.

## User Review Required

> [!IMPORTANT] > **Manual Publishing**: The "Published" status will be triggered manually by the Social Media Manager entering the public links.
> **Translation API**: We will use Google Apps Script's `LanguageApp`. This is free and built-in, but valid only for this user/script quota.
> **Detailed View UI**: We will expand the current simple modal to be a "Full Screen" or "Wide" Detailed View to accommodate two columns (German/English) side-by-side.

## Data Schema (Google Sheets)

### 1. `Videos` (Main Database)

One row per video script.

| Group            | Column Name           | Type                    | Description                       |
| :--------------- | :-------------------- | :---------------------- | :-------------------------------- |
| **ID**           | `ID`                  | String                  | Unique UUID.                      |
| **Content**      | `Title_DE`            | String                  | Original Title (German).          |
|                  | `Text_DE`             | Text                    | Original Script (German).         |
|                  | `Title_EN`            | String                  | Auto-translated Title (English).  |
|                  | `Text_EN`             | Text                    | Auto-translated Script (English). |
|                  | `Ideas`               | Text                    | Initial concept notes.            |
| **Metadata**     | `Tags`                | String                  | SEO Keywords.                     |
|                  | `Ref_Image`           | URL                     | Reference image.                  |
|                  | `Source_Link`         | URL                     | Source material.                  |
| **Instructions** | `Director_Notes`      | Text                    | Mood/Pacing notes.                |
|                  | `Editor_Instructions` | Text                    | Visuals/Cuts notes.               |
| **Assets**       | `Raw_Footage_URL`     | URL                     | Link to raw files.                |
|                  | `Final_Video_URL`     | URL                     | Link to finished video.           |
| **Public**       | `Link_YouTube`        | URL                     | Published Link.                   |
|                  | `Link_Instagram`      | URL                     | Published Link.                   |
|                  | `Link_TikTok`         | URL                     | Published URL                     |
| `Status`         | Dropdown              | Status of the video     |
| `Date`           | Date                  | Target or Creation date | Created.                          |

- **Status Values**: `draft`, `recording_ready`, `recording`, `edit_ready`, `publish_ready`, `published`.

### 2. `Config` (Dropdowns & Settings)

Stores dynamic values for dropdowns.

## Roles & View Modes

**Startup Flow**: The Navbar "Role Switcher" filters the view:

- **Author**: View `draft`.
- **Director**: View `recording_ready` / `recording`.
- **Speaker**: View `recording`.
- **Editor**: View `edit_ready`.
- **Manager**: View `publish_ready` / `published`.

## User Journeys (Expanded)

### 1. The Creative Spark (Author)

- **Persona**: Mike.
- **Journey**: Creates Idea -> Refines in German -> Triggers Translation (New!) -> Moves to "Ready for Recording".

### 2. The Zoom Directing Session (Director)

- **Persona**: Patrick (Remote).
- **Journey**: Selects "Ready" script -> Marks "In Production" (Bumps to top of speaker list).

### 3. The Talent Experience (Speaker)

- **Persona**: Christoph (Studio).
- **Journey**: Sees "In Production" item -> Opens Teleprompter (Future) -> Records -> Uploads.

### 4. The Cutting Room (Editor)

- **Persona**: Daniel.
- **Journey**: Sees "Post-Production" -> Downloads Raw Footage -> Uses English Script for context -> Uploads Final.

### 5. The Distribution (Manager)

- **Persona**: Anna.
- **Journey**: Reviews Final -> Posts to TikTok -> Pastes Link in App -> Marks "Published".

## Phase 3: Deep Dive & Automation Requirements

### [Backend] Code.gs

- **[MODIFY] `Code.gs`**:
  - Add `translateText(text, sourceLang, targetLang)` function exposed to frontend.
  - Ensure `saveVideo` accepts the full link fields (`Source_Link`, `Link_YouTube`...).

### [Frontend] Javascript.html

- **[MODIFY] `javascript.html`**:
  - **Detailed View Logic**:
    - Update `editingVideo` model to include all schema fields.
    - Add `translateField(fieldName)` method calling backend.
    - Add `translateAll()` method.
  - **UI Logic**:
    - Toggle `viewMode` between `dashboard` and `detailed` (replacing the simple edit modal).

### [Frontend] Index.html

- **[MODIFY] `index.html`**:
  - **Detailed View (Modal/Overlay)**:
    - Replace current small modal with a large, 2-column layout (CSS Grid).
    - **Left Column**: German (Title, Text).
    - **Right Column**: English (Title, Text) - Read Only or Editable.
    - **Top Section**: Status, Date, Source Link.
    - **Bottom Section**: Director Notes, Editor Instructions, Public Links.
  - **Translation Controls**:
    - Add "Auto-Translate" button near the German text blocks.

## Verification Plan

### Manual Verification

1.  **Detailed View**:
    - Open a video. Verify all fields (Links, Notes, Scripts) are visible.
    - Edit fields and Save. Verify data persists in Google Sheet.
2.  **Links**:
    - Add a link. Save. Refresh. Verify link is clickable (or at least stored).
3.  **Translation**:
    - Type "Hallo Welt" in German Title.
    - Click "Translate".
    - Verify English Title becomes "Hello World".
