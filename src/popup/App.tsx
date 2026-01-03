import { useState } from 'react';
import Translator from '@/components/Translator';
import Settings from '@/components/Settings';

function App() {
  const [view, setView] = useState<'translator' | 'settings'>('translator');

  return (
    <div className="w-[400px] h-[550px] bg-white p-4 overflow-hidden">
      {view === 'translator' ? (
        <Translator onOpenSettings={() => setView('settings')} />
      ) : (
        <Settings onBack={() => setView('translator')} />
      )}
    </div>
  );
}

export default App;
