"use client";

import { useState, useRef } from 'react';

function LicenseModal({ isOpen, onAgree }: { isOpen: boolean, onAgree: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4">
      <div className="bg-teal-950 border border-orange-500/40 p-8 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-2xl font-black text-orange-400 mb-6 uppercase tracking-widest text-center border-b border-orange-500/20 pb-4">
          Závazná právní EULA CONVO
        </h2>
        <div className="text-[11px] text-slate-300 space-y-4 font-mono leading-relaxed text-justify">
          <p className="text-emerald-300 font-bold">1. DUŠEVNÍ VLASTNICTVÍ: Veškerý software, algoritmy a značka CONVO jsou výhradním vlastnictvím autora. Jakákoli dekompilace či krádež nápadu budou stíhány v plném rozsahu.</p>
          <p className="text-cyan-300 font-bold">2. VĚKOVÉ OMEZENÍ: Uživatel prohlašuje, že dosáhl věku minimálně 15 let a je plně právně způsobilý k uzavření této smlouvy.</p>
          <p className="text-emerald-300 font-bold">3. BEZPEČNOST A SOUKROMÍ: CONVO využívá šifrování pro ochranu vašich dat. Autor garantuje, že neprodává uživatelská data třetím stranám.</p>
          <p className="text-orange-400 font-bold">4. ODPOVĚDNOST (DISCLAIMER): Aplikace je poskytována "TAK, JAK JE". Autor nenese odpovědnost za přímé či nepřímé škody vzniklé provozem systému.</p>
          <p className="text-teal-300 font-bold">5. SMLUVNÍ POKUTY: Porušení autorských práv či zneužití kódu zakládá nárok na smluvní pokutu 500 000 Kč za každý incident.</p>
          <p className="text-orange-400 font-bold">6. ZABEZPEČENÍ A BAN: Pokusy o narušení infrastruktury znamenají okamžitý ban a předání logovacích dat orgánům činným v trestním řízení.</p>
          <p className="text-cyan-300 font-bold">7. ŘEŠENÍ SPORŮ: Spory se řídí právem ČR. Místně příslušným soudem je obecný soud autora.</p>
          <p className="text-teal-300 font-bold">8. ZMĚNY A NEVRATNOST: Autor může podmínky jednostranně změnit. Tento souhlas je právně závazný, bezpodmínečný a nevratný.</p>
        </div>
        <button 
          onClick={onAgree} 
          className="mt-8 w-full py-4 bg-orange-600 hover:bg-orange-500 text-teal-950 font-black rounded-xl uppercase tracking-widest text-sm"
        >
          Souhlasím se všemi podmínkami
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [currentView, setCurrentView] = useState<'uvod' | 'registrace' | 'app'>('uvod');
  const [combinedAgreed, setCombinedAgreed] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [messages, setMessages] = useState([{ sender: 'ai', text: 'Ahoj, jsem Lucie. Jsem tvůj šifrovaný uzel. Jak se dnes máš?' }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startScan = () => {
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 100;
        }
        return prev + 5;
      });
    }, 30);
  };

  const stopScan = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    const userMsg = input;
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'ai', text: `Rozumím: "${userMsg}". Lucie potvrzuje příjem šifrovaného paketu.` }]);
    }, 1500);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-tr from-teal-950 via-teal-900 to-orange-900 text-white p-4">
      <LicenseModal isOpen={showLicenseModal} onAgree={() => { setCombinedAgreed(true); setShowLicenseModal(false); }} />

      {currentView === 'uvod' && (
        <div className="text-center space-y-6">
          <h1 className="text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-orange-500">CONVO</h1>
          <button onClick={() => setCurrentView('registrace')} className="px-10 py-4 bg-orange-600 rounded-xl font-bold uppercase tracking-widest hover:scale-105 transition-all">
            Vstoupit do sítě
          </button>
        </div>
      )}

      {currentView === 'registrace' && (
        <div className="max-w-md w-full bg-teal-950/60 p-8 rounded-3xl border border-orange-500/40 backdrop-blur-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-orange-400">INITIALIZE_NODE</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (progress >= 100 && combinedAgreed) setCurrentView('app'); }} className="space-y-6">
            <input 
              required 
              value={regUsername} 
              onChange={(e) => setRegUsername(e.target.value)} 
              placeholder="Identita" 
              className="w-full bg-teal-900/50 p-4 rounded-xl border border-orange-500/30" 
            />
            <div 
              className={`w-24 h-24 rounded-full border-4 mx-auto flex items-center justify-center cursor-pointer ${progress >= 100 ? 'border-orange-500' : 'border-orange-500/50'}`} 
              onMouseDown={startScan} 
              onMouseUp={stopScan} 
              onTouchStart={startScan} 
              onTouchEnd={stopScan}
            >
              {progress >= 100 ? '✅' : '🔒'}
            </div>
            
            <div 
              onClick={() => setShowLicenseModal(true)} 
              className={`p-4 rounded-xl border cursor-pointer text-center transition-all ${combinedAgreed ? 'border-orange-500 bg-orange-950/30' : 'border-orange-500/50'}`}
            >
              {combinedAgreed ? '✅ Potvrzuji věk 15+' : '☐ Potvrzuji věk 15+'}
            </div>
            
            <button type="submit" disabled={progress < 100 || !combinedAgreed} className="w-full py-4 bg-orange-600 rounded-xl font-bold disabled:opacity-50">
              SPUSTIT
            </button>
          </form>
        </div>
      )}

      {currentView === 'app' && (
        <div className="w-full max-w-lg h-[80vh] bg-teal-950/60 rounded-3xl border border-orange-500/40 backdrop-blur-md flex flex-col overflow-hidden">
          <div className="p-4 border-b border-orange-500/30 bg-teal-900/50 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-pink-500" />
            <h2 className="font-bold text-orange-400">Lucie</h2>
          </div>
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`p-4 rounded-2xl max-w-[80%] ${m.sender === 'user' ? 'bg-orange-600 ml-auto' : 'bg-teal-900'}`}>
                {m.text}
              </div>
            ))}
            {isTyping && <p className="text-xs text-pink-400">Lucie píše...</p>}
          </div>
          <form onSubmit={sendMessage} className="p-4 border-t border-orange-500/30 bg-teal-900/50">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Zpráva..." 
              className="w-full bg-transparent outline-none" 
            />
          </form>
        </div>
      )}
    </main>
  );
}