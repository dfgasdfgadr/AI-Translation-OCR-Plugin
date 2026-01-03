# AI Browser Translation Plugin

A powerful Chrome Extension for bidirectional English-Chinese translation with OCR capabilities.

## Features

- **Text Translation**:
  - Select text on any webpage and use `Alt+T` to translate instantly.
  - Or simply select text and wait for the translation bubble (configurable).
  - Popup translation with auto-language detection.
- **Image Translation**:
  - **Screenshot**: Press `Alt+Shift+S` to select an area on the screen, OCR the text, and translate it.
  - **Paste**: Paste an image directly into the extension popup (Ctrl+V) to recognize and translate text.
- **AI Powered**: Uses OpenAI-compatible APIs (OpenAI, DeepSeek, etc.) for high-quality context-aware translation.

## Installation

1.  Clone or download this repository.
2.  Run `npm install` to install dependencies.
3.  Run `npm run build` to build the extension.
4.  Open Chrome and go to `chrome://extensions`.
5.  Enable "Developer mode" (top right).
6.  Click "Load unpacked" and select the `dist` folder in this project.

## Configuration

1.  Click the extension icon to open the popup.
2.  Click the **Settings** (gear icon).
3.  Enter your API Key (e.g., OpenAI API Key).
4.  (Optional) Change the API Endpoint if using a proxy or different provider.
5.  Click Save.

## Shortcuts

- **Alt+T**: Translate selected text.
- **Alt+Shift+S**: Start Screenshot Translation mode.

## Tech Stack

- React + TypeScript
- Vite + CRXJS (Manifest V3)
- Tailwind CSS
- Tesseract.js (OCR)
