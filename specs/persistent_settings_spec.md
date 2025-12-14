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

### 2.2. Text Alignment & Layout

- **Alignment**: Text should be **Left Aligned** for readability.
- **Width**: Text container should fill the **Entire Width** of the window (remove max-width constraints) to maximize screen real estate, especially in Full Screen mode.

### 2.3. Scrolling Behavior

- **Manual Override**: The user must be able to **manually scroll** the text (swipe/wheel) even while auto-scrolling is active.
- **Resume**: After the user stops manually scrolling, the auto-scroll should **continue from the new position** immediately (no need to pause/unpause).

### 2.4. Persistent Settings (Global)

- **Scope**: Settings must be **Global across all videos**. Changing font size on one video applies to all.
- **Components**:
  - `activeLanguage` ('de' | 'en') - Now part of the global setting.
  - Per-Language Sub-settings:
    - `fontSize`
    - `paragraphSpacing`
    - `speed`
- **Storage**: Store in `PropertiesService.getScriptProperties()` (or a dedicated Settings sheet) instead of the Video row.

## 3. Implementation Plan

### 3.1. Backend Changes (`Database.js`)

- **New Methods**:
  - `getGlobalSettings()`: Returns JSON object from ScriptProperties key `TELEPROMPTER_SETTINGS`.
  - `saveGlobalSettings(settings)`: Saves JSON string to ScriptProperties.
- **Cleanup**: Ignore/Remove Column 19 logic from `saveVideo` / `getVideos` (or keep as deprecated fallback).

### 3.2. Frontend Changes (`javascript.html`)

- **Load**: On app start (or Teleprompter open), fetch `globalSettings`.
- **Save**: Debounced save calls `saveGlobalSettings` instead of `saveVideo`.
- **State**: `prompter` object initializes from these global values. `editingVideo.prompter_settings` is no longer used.

### 3.3. Frontend Changes (`TeleprompterView` & `javascript.html`)

- **State**:
  - Add `prompter.activeLanguage` ('de' | 'en').
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
