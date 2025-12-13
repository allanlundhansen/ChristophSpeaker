# Feature Spec: Persistent Teleprompter Settings & Multi-Language Support

## 1. Overview

The Speaker needs to be able to read scripts in either German (Original) or English (Translated) within the Teleprompter. Furthermore, reading preferences (Font Size, Paragraph Spacing) should be **persistent** for each video and **independent** for each language (since text length and density differ).

## 2. Requirements

### 2.1. Multi-Language Support

- **Toggle**: A control in the Teleprompter UI to switch between `DE` and `EN`.
- **Content**:
  - `DE`: Displays `Title_DE` and `Text_DE`.
  - `EN`: Displays `Title_EN` and `Text_EN`.
- **Default**: Opens in `DE` by default, or remembers last choice? (Assumption: Default to DE for now).

### 2.2. Text Alignment

- **Style**: Text should be **Left Aligned** (keep the container centered on screen, but align text to the left) to improve readability compared to centered text.

### 2.3. Persistent Settings

- **Storage**: Settings must be saved to the database (Google Sheet) so they persist across sessions/reloads.
- **Granularity**: Settings are per-row (Video) AND per-language.
- **Parameters**:
  - `fontSize` (Int: 20-100)
  - `paragraphSpacing` (Int: 20-200)
  - `speed` (Int: 0-100)

## 3. Implementation Plan

### 3.1. Database Schema Update

Currently, the sheet has 18 columns. We will add a **19th Column**: `Prompter_Settings`.
To avoid clogging the sheet with 4 new columns, we will store a **JSON String** in this column.

**Column 19**: `Prompter_Settings`
**Format (JSON)**:

```json
{
  "de": {
    "fontSize": 60,
    "paragraphSpacing": 50,
    "speed": 25
  },
  "en": {
    "fontSize": 60,
    "paragraphSpacing": 50,
    "speed": 25
  }
}
```

### 3.2. Backend Changes (`Database.js`)

- **`getVideos()`**: Read Column 19, parse JSON (handle errors/empty), and return as `prompter_settings` property.
- **`saveVideo()`**: Accept `prompter_settings`, stringify it, and write to Column 19.

### 3.3. Frontend Changes (`TeleprompterView` & `javascript.html`)

- **State**:
  - Add `prompter.activeLanguage` ('de' | 'en').
  - Bind the UI sliders to `prompter.settings[activeLanguage].fontSize` etc.
- **Watchers**:
  - When `activeLanguage` changes -> Update `prompter.fontSize` and `prompter.paragraphSpacing` from the saved settings.
  - When Sliders move -> Update `prompter.settings` and trigger a **Debounced Save**.
- **UI**:
  - Add a Toggle Switch (DE/EN) to the control bar.
  - Add a Full Screen Button (Toggle) to maximize the teleprompter view.
  - Update `v-html` content binding to shown the active language text.

## 4. Migration

- Existing rows will have empty Column 19.
- Frontend must handle `null`/`undefined` settings by falling back to defaults (Size: 60, Space: 50).
