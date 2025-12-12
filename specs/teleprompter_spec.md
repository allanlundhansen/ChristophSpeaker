# Teleprompter & Recording Workflow Specification

## Overview

This feature facilitates a synchronized workflow between the **Director** (remote) and the **Speaker** (in-studio). It allows the Director to "queue" exactly one video for immediate recording, which the Speaker can then open in a dedicated Teleprompter view.

## 1. The "Single Active Recording" Logic (Backend)

To prevent confusion during a recording session, **only one video can be in the `recording` status at a time.**

- **Action**: When a video is moved to `recording`:
  1.  The system identifies any _other_ video currently in `recording`.
  2.  That previous video is demoted back to `recording_ready` (or `draft` if it was somehow draft).
  3.  The target video is updated to `recording`.
- **Result**: The "Recording" bucket in the Speaker's/Director's view always contains exactly **one** item (or zero).

## 2. Director's Workflow (Queueing)

The Director controls the flow. They select which script is "On Air".

### UI / UX

- **Symbol**: A **Play Icon** (▶️).
- **Visibility**: Visible ONLY for videos in `recording_ready` status.
- **Locations**:
  1.  **Kanban Card**: Left side of the footer actions (or top-left of card).
  2.  **List View**: Leftmost action button.
  3.  **Detailed View**: In the Header, immediately to the **Left** of the Status Selector dropdown.

### Interaction

- **Click**:
  1.  Optimistically update UI to show this video as `recording`.
  2.  Server call: `setVideoRecordingStatus(id)`.
  3.  Server enforces the "Single Active" constraint.
  4.  UI refreshes to reflect that other videos are no longer `recording`.

## 3. Speaker's Workflow (Teleprompter)

The Speaker is passive until content is queued.

### Dashboard View

- The Speaker filters by "View As: Speaker".
- They see the **one** video currently in `recording`.
- **Interaction (Smart Click)**:
  - **Main Click (Card)**: DIRECTLY opens the **Teleprompter View**. (Bypasses "Detailed View").
  - **Secondary Action (Icon)**: A small "Info/Edit" button on the card allows opening the standard Detailed View if they need to check notes or fix typos.

### Teleprompter View UI

A new full-screen mode (`viewMode = 'teleprompter'`).

- **Visuals**:
  - Dark Mode (Black background, White text) by default.
  - Large, high-contrast font (sans-serif).
  - Hide all navigation/sidebars.
- **Controls** (Fixed Overlay or Bottom Bar):
  - **Scroll Speed**: Slider/Buttons (Slow <-> Fast).
  - **Play/Pause**: Toggle auto-scroll.
  - **Mirror Mode**: Toggle CSS transform (scaleX(-1)) for hardware teleprompters.
  - **Font Size**: Slider.
- **Completion**:
  - Button: **"Mark as Recorded"**.
  - Action: Updates status to `edit_ready` (removing it from the "Recording" queue) and returns to Dashboard.

## 4. Implementation Checklist

### Database / Backend

- [ ] Create `setAsActiveRecording(id)` function.
  - Transaction-like logic: `current = find(v => v.status === 'recording'); if(current) current.status = 'recording_ready'; target.status = 'recording';`

### Frontend (Director)

- [ ] Add Play Icon to **VideoCard** component (conditionally rendered).
- [ ] Add Play Icon to **ListView** component.
- [ ] Add Play Icon to **DetailedView** Header.
- [ ] Wire up `moveVideoToRecording(video)` method.

### Frontend (Speaker)

- [ ] Create `TeleprompterView` component (HTML/CSS).
- [ ] Implement Scrolling Logic (JS `requestAnimationFrame` or simple CSS scroll).
- [ ] Add "Mark Recorded" logic.
