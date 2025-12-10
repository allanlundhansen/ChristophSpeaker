# YSMS - YouTube Script Management System

A Google Apps Script Web Application for managing video shorts ideation, filming, and publishing workflows.

## Features

- **Role-Based Access**: Specialized views for Authors, Directors, Speakers, Editors, and Managers.
- **Workflow Tracking**: `Draft` -> `Ready for Recording` -> `Recording` -> `Post-Production` -> `Published`.
- **Real-Time Updates**: Auto-polling dashboard for live collaboration.
- **Teleprompter Ready**: Optimized view for speakers (Planned).
- **Google Sheets Backend**: Uses a standard Google Sheet as the database.

## Architecture

- **Backend**: Google Apps Script (`Code.gs`)
- **Frontend**: Vue.js + Tailwind CSS (served via `HtmlService`)
- **Database**: Google Sheets

## Setup

1.  Create a new Google Sheet.
2.  Open **Extensions > Apps Script**.
3.  Copy the contents of the files in this repo into the script editor.
4.  Deploy as Web App.

## Status Values

- `draft`: Initial idea.
- `recording_ready`: Approved and script finalized.
- `recording`: Currently being filmed.
- `edit_ready`: Raw footage uploaded.
- `publish_ready`: Final video ready for review.
- `published`: Live on platform.
