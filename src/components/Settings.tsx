import React, { useEffect, useState } from 'react';
import { AppSettings, defaultSettings, getSettings, saveSettings } from '@/utils/storage';
import { Save, ArrowLeft } from 'lucide-react';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [status, setStatus] = useState('');

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    await saveSettings(settings);
    setStatus('Saved!');
    setTimeout(() => setStatus(''), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: keyof AppSettings) => {
    e.preventDefault();
    e.stopPropagation();
    
    const keys: string[] = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.metaKey) keys.push('Meta');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    
    // Ignore modifier key events themselves
    if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
      return;
    }
    
    keys.push(e.key.toUpperCase());
    
    if (keys.length > 0) {
      setSettings({ ...settings, [field]: keys.join('+') });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center mb-4 shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full mr-2">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold">Settings</h2>
      </div>

      <div className="space-y-4 flex-1">
        {/* API Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
          <input
            type="text"
            className="w-full border rounded p-2 text-sm"
            value={settings.apiEndpoint}
            onChange={(e) => setSettings({ ...settings, apiEndpoint: e.target.value })}
            placeholder="https://api.openai.com/v1/chat/completions"
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: <code>https://api.openai.com/v1/chat/completions</code>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <input
            type="password"
            className="w-full border rounded p-2 text-sm"
            value={settings.apiKey}
            onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
            placeholder="sk-..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
          <input
            type="text"
            className="w-full border rounded p-2 text-sm"
            value={settings.model}
            onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            placeholder="gpt-3.5-turbo"
          />
        </div>

        {/* Shortcuts */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Custom Shortcuts</h3>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Translation Shortcut</label>
            <input
              type="text"
              className="w-full border rounded p-2 text-sm bg-gray-50 cursor-pointer focus:bg-white focus:ring-2 focus:ring-blue-500"
              value={settings.translateShortcut}
              onKeyDown={(e) => handleKeyDown(e, 'translateShortcut')}
              readOnly
              placeholder="Click and press keys (e.g. Alt+T)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Screenshot Shortcut</label>
            <input
              type="text"
              className="w-full border rounded p-2 text-sm bg-gray-50 cursor-pointer focus:bg-white focus:ring-2 focus:ring-blue-500"
              value={settings.screenshotShortcut}
              onKeyDown={(e) => handleKeyDown(e, 'screenshotShortcut')}
              readOnly
              placeholder="Click and press keys (e.g. Alt+Shift+S)"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Click input and press desired key combination. <br/>
            Note: These shortcuts work when the page is focused.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between shrink-0">
        <span className="text-green-600 text-sm">{status}</span>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          <Save size={16} />
          Save
        </button>
      </div>
    </div>
  );
};

export default Settings;
