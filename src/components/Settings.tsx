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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full mr-2">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold">Settings</h2>
      </div>

      <div className="space-y-4 flex-1">
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
            Example: <code>https://api.openai.com/v1/chat/completions</code><br/>
            Must include <code>/chat/completions</code> at the end.
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
          <p className="text-xs text-gray-500 mt-1">
            Common models:<br/>
            OpenAI: <code>gpt-3.5-turbo</code>, <code>gpt-4o</code><br/>
            DeepSeek: <code>deepseek-chat</code>, <code>deepseek-coder</code><br/>
            Moonshot: <code>moonshot-v1-8k</code>
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
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
