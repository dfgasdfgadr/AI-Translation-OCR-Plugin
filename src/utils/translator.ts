import { AppSettings } from './storage';

export const translateText = async (text: string, settings: AppSettings): Promise<string> => {
  if (!settings.apiKey) {
    throw new Error('API Key is missing. Please check settings.');
  }

  // const targetLangName = settings.targetLang === 'zh' ? 'Simplified Chinese' : 'English';
  
  const messages = [
    {
      role: 'system',
      content: `You are a professional translator. 
      Rules:
      1. Automatically detect the source language.
      2. If source is Chinese, translate to English.
      3. If source is English/Other, translate to Simplified Chinese.
      4. OUTPUT ONLY THE TRANSLATED TEXT. NO EXPLANATIONS, NO PREAMBLE, NO "OKAY", NO "PROCESSING".
      5. Maintain original tone and formatting.`
    },
    { role: 'user', content: text }
  ];

  try {
    const response = await fetch(settings.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: messages,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      
      if (response.status === 404) {
         throw new Error(`API Endpoint Not Found (404). Please check your URL setting. It usually ends with "/v1/chat/completions". Current: ${settings.apiEndpoint}`);
      }

      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.error?.message || `API Request failed: ${response.status} ${response.statusText}`);
      } catch (e) {
        throw new Error(`API Request failed: ${response.status} ${response.statusText} - ${responseText.slice(0, 200)}`);
      }
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid API Response: Missing choices/message');
    }
    return data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error('Translation Error:', error);
    throw new Error(error.message || 'Network error or invalid response.');
  }
};
