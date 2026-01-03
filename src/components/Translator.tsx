import React, { useState, useEffect, useRef } from 'react';
import { translateText } from '../utils/translator';
import { getSettings } from '../utils/storage';
import Tesseract from 'tesseract.js';
import { Settings as SettingsIcon, Image as ImageIcon, Type, Loader2, AlertCircle, Copy, Check } from 'lucide-react';

interface TranslatorProps {
  initialText?: string;
  onOpenSettings: () => void;
}

const Translator: React.FC<TranslatorProps> = ({ initialText = '', onOpenSettings }) => {
  const [inputText, setInputText] = useState(initialText);
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'text' | 'screenshot'>('text');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
      handleTranslate(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    if (textareaRef.current && mode === 'text') {
      textareaRef.current.focus();
    }
  }, [mode]);

  const handleTranslate = async (text: string) => {
    if (!text.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const settings = await getSettings();
      if (!settings.apiKey) {
        throw new Error('Please configure API Key in settings first.');
      }
      const result = await translateText(text, settings);
      setTranslatedText(result);
    } catch (err: any) {
      setError(err.message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleTranslate(inputText);
    }
  };

  const performOCR = async (imageData: string) => {
    setOcrLoading(true);
    setOcrStatus('Initializing OCR engine...');
    setError('');
    
    let worker: Tesseract.Worker | null = null;

    try {
      const workerPath = chrome.runtime.getURL('tesseract/worker.min.js');
      const corePath = chrome.runtime.getURL('tesseract/tesseract-core.wasm.js');
      // Ensure langPath does NOT have a trailing slash as per Tesseract.js docs
      const langPath = chrome.runtime.getURL('tesseract/lang-data').replace(/\/$/, '');

      console.log('Using local Tesseract resources:', { workerPath, corePath, langPath });

      // Verify language file access
      try {
          const testUrl = langPath + '/eng.traineddata.gz';
          const response = await fetch(testUrl, { method: 'HEAD' });
          if (!response.ok) {
              console.error('Language file access check failed:', testUrl, response.status);
              setOcrStatus(`Error: Cannot access local language file (${response.status})`);
              throw new Error(`Cannot access local language file at ${testUrl}`);
          }
          console.log('Language file access check passed:', testUrl);
      } catch (e) {
          console.error('Language file access check error:', e);
          // Don't throw here, let Tesseract try, but log it
      }

      // @ts-ignore
      worker = await Tesseract.createWorker('eng+chi_sim', 1, {
        workerPath,
        corePath,
        langPath: langPath,
        gzip: true,
        logger: (m) => {
            console.log(m);
            if (m.status === 'loading tesseract core') {
                setOcrStatus('Loading OCR core...');
            } else if (m.status === 'initializing tesseract') {
                setOcrStatus('Initializing Tesseract...');
            } else if (m.status === 'loading language traineddata') {
                setOcrStatus(`Downloading language data (${Math.round(m.progress * 100)}%)...`);
            } else if (m.status === 'initializing api') {
                setOcrStatus('Initializing API...');
            } else if (m.status === 'recognizing text') {
                setOcrStatus(`Recognizing text (${Math.round(m.progress * 100)}%)...`);
            } else {
                setOcrStatus(m.status);
            }
        },
        errorHandler: (err) => console.error('Tesseract Error:', err),
        workerBlobURL: false
      });
      
      setOcrStatus('Processing image...');
      const result = await worker.recognize(imageData);
      
      const text = result.data.text;
      if (!text.trim()) {
         throw new Error("No text detected in the image.");
      }

      setInputText(text);
      // Auto translate after OCR
      handleTranslate(text);
    } catch (err: any) {
      console.error(err);
      if (String(err).includes("importScripts") || String(err).includes("WorkerGlobalScope") || String(err).includes("NetworkError")) {
          setError("OCR Error: Failed to load local OCR engine. Please ensure 'public/tesseract' files are correctly copied. Details: " + String(err));
      } else {
          setError('OCR Failed: ' + (err.message || String(err)));
      }
    } finally {
      if (worker) {
          await worker.terminate();
      }
      setOcrLoading(false);
      setOcrStatus('');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              performOCR(event.target.result as string);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
           <button
             onClick={() => setMode('text')}
             className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
               mode === 'text' 
                 ? 'bg-white text-blue-600 shadow-sm' 
                 : 'text-gray-500 hover:text-gray-700'
             }`}
           >
             <Type size={14} />
             Text
           </button>
           <button
             onClick={() => setMode('screenshot')}
             className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
               mode === 'screenshot' 
                 ? 'bg-white text-blue-600 shadow-sm' 
                 : 'text-gray-500 hover:text-gray-700'
             }`}
           >
             <ImageIcon size={14} />
             Screenshot
           </button>
        </div>
        <button 
          onClick={onOpenSettings}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          title="Settings"
        >
          <SettingsIcon size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mode === 'screenshot' ? (
             <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Screenshot Translation</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono text-gray-600">Alt+Shift+S</kbd> to select an area on screen.
                </p>
                <div className="text-xs text-gray-400">
                    Or use the shortcut defined in chrome://extensions/shortcuts
                </div>
             </div>
        ) : (
            <>
                {/* Input Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            className="w-full h-32 p-4 text-gray-700 placeholder-gray-400 resize-none focus:outline-none text-base leading-relaxed bg-transparent"
                            placeholder="Enter text or paste image (Ctrl+V) to translate..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            disabled={loading || ocrLoading}
                        />
                        <div className="absolute bottom-2 right-3 text-xs text-gray-400 font-medium bg-white/90 px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {inputText.length} chars
                        </div>
                        {ocrLoading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center flex-col gap-2 z-10">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                <span className="text-sm font-medium text-blue-600 animate-pulse">{ocrStatus || 'Extracting text...'}</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Action Bar */}
                    <div className="flex items-center justify-end px-3 py-2 bg-gray-50 border-t border-gray-100">
                        <button
                            className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                loading || !inputText.trim()
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow active:translate-y-0.5'
                            }`}
                            onClick={() => handleTranslate(inputText)}
                            disabled={loading || !inputText.trim()}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Translating...
                                </>
                            ) : (
                                'Translate'
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start animate-in fade-in slide-in-from-top-2 duration-200">
                    <AlertCircle className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1 leading-relaxed">{error}</div>
                </div>
                )}

                {/* Result Section */}
                {translatedText && (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-green-700 uppercase tracking-wide flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Result
                        </span>
                        <button 
                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-all ${
                                copied 
                                ? 'bg-green-200 text-green-800' 
                                : 'text-green-700 hover:bg-green-100'
                            }`}
                            onClick={handleCopy}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                    <div className="p-5 text-gray-800 leading-relaxed text-base whitespace-pre-wrap font-serif">
                    {translatedText}
                    </div>
                </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default Translator;
