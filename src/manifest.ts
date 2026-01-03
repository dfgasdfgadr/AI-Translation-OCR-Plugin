import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'AI Translation & OCR Plugin',
  version: '1.0.0',
  description: 'AI-powered translation and OCR tool for browser.',
  icons: {
    16: 'icons/icon-16.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  permissions: [
    'storage',
    'activeTab',
    'scripting',
    'contextMenus',
    'commands'
  ],
  host_permissions: ['<all_urls>'],
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'AI Translate'
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      run_at: 'document_end',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['tesseract/*', 'tesseract/lang-data/*'],
      matches: ['<all_urls>'],
    },
  ],
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
  },
  commands: {
    execute_translation: {
      suggested_key: {
        default: 'Alt+T',
        mac: 'Alt+T',
      },
      description: 'Translate selected text',
    },
    capture_screenshot: {
      suggested_key: {
        default: 'Alt+Shift+S',
        mac: 'Alt+Shift+S',
      },
      description: 'Capture screenshot for translation',
    },
  },
})
