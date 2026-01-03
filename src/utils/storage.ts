export interface AppSettings {
  apiKey: string;
  apiEndpoint: string;
  model: string;
  targetLang: 'en' | 'zh';
}

export const defaultSettings: AppSettings = {
  apiKey: '',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
  targetLang: 'zh',
};

export const getSettings = async (): Promise<AppSettings> => {
  const result = await chrome.storage.sync.get('settings');
  return { ...defaultSettings, ...(result.settings || {}) };
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  await chrome.storage.sync.set({ settings });
};
