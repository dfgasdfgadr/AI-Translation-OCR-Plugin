import { translateText } from '@/utils/translator';
import { getSettings } from '@/utils/storage';

// src/background/index.ts

chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Translate Extension Installed');
});

// Handle Keyboard Shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'execute_translation') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TRIGGER_TRANSLATION' })
          .catch(() => {
            // Ignore errors if content script is not ready or page doesn't support it
            console.log('Content script not ready or not supported on this page');
          });
      }
    });
  } else if (command === 'capture_screenshot') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_SCREENSHOT_OVERLAY' })
          .catch(() => {
            // Ignore errors
            console.log('Content script not ready or not supported on this page');
          });
      }
    });
  }
});

// Handle Messages from Content Script or Popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'CAPTURE_VISIBLE_TAB') {
    // Capture the visible tab
    chrome.tabs.captureVisibleTab(
      // @ts-expect-error - chrome types might be strict about windowId
      undefined, 
      { format: 'png' }, 
      (dataUrl) => {
        sendResponse({ dataUrl });
      }
    );
    return true; // Asynchronous response
  } else if (request.type === 'TRANSLATE_TEXT_BG') {
    (async () => {
      try {
        const settings = await getSettings();
        const result = await translateText(request.text, settings);
        sendResponse({ translated: result });
      } catch (error: any) {
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }
});
