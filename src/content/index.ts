import Tesseract from 'tesseract.js';

console.log('AI Translate Content Script Loaded');

let shadowHost: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;

function getShadowRoot() {
  if (!shadowHost) {
    shadowHost = document.createElement('div');
    shadowHost.id = 'ai-translate-host';
    shadowHost.style.position = 'fixed';
    shadowHost.style.top = '0';
    shadowHost.style.left = '0';
    shadowHost.style.zIndex = '2147483647'; // Max z-index
    shadowHost.style.width = '0';
    shadowHost.style.height = '0';
    shadowHost.style.overflow = 'visible';
    document.body.appendChild(shadowHost);
    shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    
    const style = document.createElement('style');
    style.textContent = `
      .bubble {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        padding: 12px;
        position: absolute;
        pointer-events: auto;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        color: #1f2937;
        width: 350px;
        max-width: 550px;
        z-index: 1000;
      }
      .bubble-loading {
        color: #6b7280;
        font-style: italic;
      }
      .bubble-error {
        color: #ef4444;
      }
      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.3);
        pointer-events: auto;
        cursor: crosshair;
        z-index: 999;
      }
      .selection-box {
        border: 2px solid #3b82f6;
        background: rgba(59, 130, 246, 0.1);
        position: absolute;
        pointer-events: none;
      }
      .action-btn {
        background: #2563eb;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-top: 8px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .action-btn:hover { background: #1d4ed8; }
      .close-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        background: transparent;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        padding: 2px;
      }
      .close-btn:hover { color: #4b5563; }
    `;
    shadowRoot.appendChild(style);
  }
  return shadowRoot;
}

// --- Text Translation ---


// Store cleanup function for the bubble
let cleanupBubble: (() => void) | null = null;

function showTranslationBubble(text: string, x: number, y: number) {
  // Clean up any existing bubble first
  if (cleanupBubble) {
    cleanupBubble();
  }

  const root = getShadowRoot();
  if (!root) return;

  const bubble = document.createElement('div');
  bubble.className = 'bubble bubble-loading';
  bubble.style.left = `${x}px`;
  bubble.style.top = `${y + 10}px`;
  bubble.innerHTML = `
    <div class="header" style="display:flex; justify-content:space-between; margin-bottom:4px; cursor:move; user-select:none;">
        <span style="font-weight:bold; font-size:12px; color:#3b82f6;">AI Translate</span>
        <button class="close-btn">×</button>
    </div>
    <div class="content">Translating...</div>
  `;

  root.appendChild(bubble);

  // --- Drag Logic ---
  const header = bubble.querySelector('.header') as HTMLElement;
  let isDragging = false;
  let startDragX = 0;
  let startDragY = 0;
  let startBubbleLeft = 0;
  let startBubbleTop = 0;

  const onMouseDown = (e: MouseEvent) => {
    isDragging = true;
    startDragX = e.clientX;
    startDragY = e.clientY;
    
    // Parse current left/top (removing 'px')
    startBubbleLeft = parseInt(bubble.style.left || '0', 10);
    startBubbleTop = parseInt(bubble.style.top || '0', 10);
    
    e.preventDefault(); // Prevent text selection
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startDragX;
    const dy = e.clientY - startDragY;
    
    bubble.style.left = `${startBubbleLeft + dx}px`;
    bubble.style.top = `${startBubbleTop + dy}px`;
  };

  const onMouseUp = () => {
    isDragging = false;
  };

  header.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  // --- Close Logic (Button & Esc) ---
  const removeBubble = () => {
    bubble.remove();
    // Cleanup listeners
    header.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('keydown', onEscKey);
    cleanupBubble = null;
  };

  const onEscKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      removeBubble();
    }
  };

  document.addEventListener('keydown', onEscKey);
  bubble.querySelector('.close-btn')?.addEventListener('click', removeBubble);

  // Assign cleanup function for next call
  cleanupBubble = removeBubble;

  // Send to Background
  chrome.runtime.sendMessage({ type: 'TRANSLATE_TEXT_BG', text }, (response) => {
    const contentDiv = bubble.querySelector('.content');
    if (!contentDiv) return;

    if (response.error) {
      bubble.classList.add('bubble-error');
      contentDiv.textContent = 'Error: ' + response.error;
    } else {
      bubble.classList.remove('bubble-loading');
      contentDiv.textContent = response.translated;
    }
  });
}

document.addEventListener('mouseup', (_e) => {
  const selection = window.getSelection();
  const text = selection?.toString().trim();
  if (text && text.length > 0) {
      // We don't auto-show bubble on selection to avoid annoyance, 
      // but we can listen for a shortcut or double click modifier.
      // For this requirement: "选中文本后使用快捷键翻译" (Select text then use shortcut)
      // So we wait for the shortcut command.
  }
});

// --- Screenshot Logic ---

let isSelecting = false;
let startX = 0, startY = 0;
let overlayEl: HTMLElement | null = null;
let selectionBox: HTMLElement | null = null;

function startScreenshotMode() {
  const root = getShadowRoot();
  if (!root || overlayEl) return;

  overlayEl = document.createElement('div');
  overlayEl.className = 'overlay';
  root.appendChild(overlayEl);

  selectionBox = document.createElement('div');
  selectionBox.className = 'selection-box';
  selectionBox.style.display = 'none';
  overlayEl.appendChild(selectionBox);

  overlayEl.addEventListener('mousedown', onMouseDown);
  document.addEventListener('keydown', onEscKey);
}

function stopScreenshotMode() {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
    selectionBox = null;
  }
  document.removeEventListener('keydown', onEscKey);
}

function onEscKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    stopScreenshotMode();
  }
}

function onMouseDown(e: MouseEvent) {
  isSelecting = true;
  startX = e.clientX;
  startY = e.clientY;
  
  if (selectionBox) {
    selectionBox.style.display = 'block';
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
  }

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e: MouseEvent) {
  if (!isSelecting || !selectionBox) return;

  const currentX = e.clientX;
  const currentY = e.clientY;

  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  const left = Math.min(currentX, startX);
  const top = Math.min(currentY, startY);

  selectionBox.style.width = `${width}px`;
  selectionBox.style.height = `${height}px`;
  selectionBox.style.left = `${left}px`;
  selectionBox.style.top = `${top}px`;
}

async function onMouseUp(_e: MouseEvent) {
  isSelecting = false;
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);

  if (!selectionBox) return;

  // Capture coordinates
  const rect = selectionBox.getBoundingClientRect();
  const cropX = rect.left;
  const cropY = rect.top;
  const cropWidth = rect.width;
  const cropHeight = rect.height;

  if (cropWidth < 10 || cropHeight < 10) {
      stopScreenshotMode(); // Too small
      return;
  }

  // Hide selection box temporarily to avoid capturing it
  if (selectionBox) selectionBox.style.display = 'none';

  try {
    // 1. Capture Visible Tab via Background
    const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_VISIBLE_TAB' });
    const dataUrl = response.dataUrl;

    // Show selection box again (or update it with processing state)
    if (selectionBox) {
        selectionBox.style.display = 'block';
        selectionBox.innerHTML = '<span style="background:white; padding:2px; font-size:12px;">Processing...</span>';
    }

    if (dataUrl) {
      // 2. Crop Image
      const croppedDataUrl = await cropImage(dataUrl, cropX, cropY, cropWidth, cropHeight);
      
      // 3. OCR
      const text = await performOCR(croppedDataUrl);
      
      // 4. Translate and Show Result
      stopScreenshotMode();
      showTranslationBubble(text, cropX, cropY + cropHeight);
    }
  } catch (err) {
    console.error(err);
    alert('Screenshot failed: ' + String(err));
    stopScreenshotMode();
  }
}

function cropImage(dataUrl: string, x: number, y: number, w: number, h: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Source x, y need to scale by DPR because captureVisibleTab returns full res image (usually matches screen pixel density)
        // Wait, captureVisibleTab behavior depends on browser. Usually it is already scaled or matches window innerWidth/Height * DPR.
        ctx.drawImage(img, x * dpr, y * dpr, w * dpr, h * dpr, 0, 0, w * dpr, h * dpr);
        resolve(canvas.toDataURL());
      }
    };
    img.src = dataUrl;
  });
}

async function performOCR(imageUrl: string): Promise<string> {
  try {
    const workerPath = chrome.runtime.getURL('tesseract/worker.min.js');
    const corePath = chrome.runtime.getURL('tesseract/tesseract-core.wasm.js');
    const langPath = chrome.runtime.getURL('tesseract/lang-data').replace(/\/$/, '');
    
    // @ts-ignore
    const result = await Tesseract.recognize(
      imageUrl,
      'eng+chi_sim',
      { 
        workerPath,
        corePath,
        langPath,
        // logger: m => console.log(m) 
      }
    );
    return result.data.text;
  } catch (e) {
    console.error("OCR Error", e);
    return "OCR Failed: " + String(e);
  }
}

// --- Message Listeners ---

chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.type === 'TRIGGER_TRANSLATION') {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (rect) {
        // Calculate position relative to viewport + scroll
        // But for fixed positioned bubble, we need viewport coordinates?
        // Wait, shadowHost is fixed positioned at (0,0).
        // So bubble.style.left/top are relative to viewport.
        // rect.left is relative to viewport.
        // rect.bottom is relative to viewport.
        // window.scrollY is NOT needed if host is fixed.
        
        // Let's re-verify shadowHost position.
        // shadowHost: position: fixed; top: 0; left: 0;
        // So we should use clientX/Y directly or rect values directly.
        // rect.left/bottom are relative to viewport.
        
        showTranslationBubble(text, rect.left, rect.bottom);
      }
    }
  } else if (request.type === 'SHOW_SCREENSHOT_OVERLAY') {
    startScreenshotMode();
  }
});
