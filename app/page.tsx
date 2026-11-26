"use client";

import { useState, useRef, useEffect, useCallback } from 'react';

type Message = { id: number; sender: 'ai' | 'user'; text: string };

function LicenseModal({
  isOpen,
  onAgree,
  onClose,
}: {
  isOpen: boolean;
  onAgree: () => void;
  onClose: () => void;
}) {
  // Zavření klávesou Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="eula-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-teal-950 border border-orange-500/40 p-6 sm:p-8 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <h2
          id="eula-title"
          className="text-xl sm:text-2xl font-black text-orange-400 mb-6 uppercase tracking-widest text-center border-b border-orange-500/20 pb-4"
        >
          Závazná právní EULA CONVO
        </h2>
        <div className="text-xs text-slate-300 space-y-4 font-mono leading-relaxed">
          <p className="text-emerald-300 font-bold">1. DUŠEVNÍ VLASTNICTVÍ: Veškerý software, algoritmy a značka CONVO jsou výhradním vlastnictvím autora. Jakákoli dekompilace či krádež nápadu budou stíhány v plném rozsahu.</p>
          <p className="text-cyan-300 font-bold">2. VĚKOVÉ OMEZENÍ: Uživatel prohlašuje, že dosáhl věku minimálně 15 let a je plně právně způsobilý k uzavření této smlouvy.</p>
          <p className="text-emerald-300 font-bold">3. BEZPEČNOST A SOUKROMÍ: CONVO využívá šifrování pro ochranu vašich dat. Autor garantuje, že neprodává uživatelská data třetím stranám.</p>
          <p className="text-orange-400 font-bold">4. ODPOVĚDNOST (DISCLAIMER): Aplikace je poskytována &quot;TAK, JAK JE&quot;. Autor nenese odpovědnost za přímé či nepřímé škody vzniklé provozem systému.</p>
          <p className="text-teal-300 font-bold">5. SMLUVNÍ POKUTY: Porušení autorských práv či zneužití kódu zakládá nárok na smluvní pokutu 500 000 Kč za každý incident.</p>
          <p className="text-orange-400 font-bold">6. ZABEZPEČENÍ A BAN: Pokusy o narušení infrastruktury znamenají okamžitý ban a předání logovacích dat orgánům činným v trestním řízení.</p>
          <p className="text-cyan-300 font-bold">7. ŘEŠENÍ SPORŮ: Spory se řídí právem ČR. Místně příslušným soudem je obecný soud autora.</p>
          <p className="text-teal-300 font-bold">8. ZMĚNY A NEVRATNOST: Autor může podmínky jednostranně změnit. Tento souhlas je právně závazný, bezpodmínečný a nevratný.</p>
        </div>
        <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="sm:w-1/3 py-4 border border-orange-500/40 text-orange-300 font-bold rounded-xl uppercase tracking-widest text-sm hover:bg-orange-500/10 transition-colors"
          >
            Zpět
          </button>
          <button
            type="button"
            onClick={onAgree}
            className="flex-1 py-4 bg-orange-600 hover:bg-orange-500 text-teal-950 font-black rounded-xl uppercase tracking-widest text-sm transition-colors"
          >
            Souhlasím se všemi podmínkami
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [currentView, setCurrentView] = useState<'uvod' | 'registrace' | 'app'>('uvod');
  const [combinedAgreed, setCombinedAgreed] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const replyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextIdRef = useRef(1);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scanDone = progress >= 100;
  const name = regUsername.trim();
  const canStart = scanDone && combinedAgreed && name.length > 0;

  const stopScan = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startScan = () => {
    // Bez tohoto by opakované stisknutí spustilo několik intervalů najednou
    if (intervalRef.current || scanDone) return;
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + 5, 100);
        if (next >= 100) stopScan();
        return next;
      });
    }, 30);
  };

  // Úklid časovačů při opuštění stránky
  useEffect(() => {
    return () => {
      stopScan();
      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
    };
  }, [stopScan]);

  // Automatické posunutí chatu na poslední zprávu
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = (sender: Message['sender'], text: string) => {
    const id = nextIdRef.current++;
    setMessages((prev) => [...prev, { id, sender, text }]);
  };

  const startApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canStart) return;
    setMessages([]);
    addMessage('ai', `Ahoj ${name}, jsem Lucie. Jsem tvůj šifrovaný uzel. Jak se dnes máš?`);
    setCurrentView('app');
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const userMsg = input.trim();
    if (!userMsg || isTyping) return;

    addMessage('user', userMsg);
    setInput('');
    setIsTyping(true);

    replyTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      addMessage('ai', `Rozumím: "${userMsg}". Lucie potvrzuje příjem šifrovaného paketu.`);
    }, 1500);
  };

  const closeModal = useCallback(() => setShowLicenseModal(false), []);

  // Text pod tlačítkem, který řekne, co ještě chybí
  const missing: string[] = [];
  if (!name) missing.push('zadej identitu');
  if (!scanDone) missing.push('podrž zámek');
  if (!combinedAgreed) missing.push('potvrď podmínky');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-tr from-teal-950 via-teal-900 to-orange-900 text-white p-4">
      <LicenseModal
        isOpen={showLicenseModal}
        onClose={closeModal}
        onAgree={() => {
          setCombinedAgreed(true);
          setShowLicenseModal(false);
        }}
      />

      {currentView === 'uvod' && (
        <div className="text-center space-y-6">
          <h1 className="text-6xl sm:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-orange-500 pr-2">
            CONVO
          </h1>
          <p className="text-slate-300 max-w-sm mx-auto">
            Konec swipování. Začátek skutečných vztahů.
          </p>
          <button
            type="button"
            onClick={() => setCurrentView('registrace')}
            className="px-10 py-4 bg-orange-600 rounded-xl font-bold uppercase tracking-widest hover:scale-105 hover:bg-orange-500 transition-all"
          >
            Vstoupit do sítě
          </button>
          <p>
            <a
              href="https://convo-ruby.vercel.app"
              className="text-sm text-slate-400 hover:text-orange-400 transition-colors"
            >
              Co je CONVO? Zjistit víc →
            </a>
          </p>
        </div>
      )}

      {currentView === 'registrace' && (
        <div className="max-w-md w-full bg-teal-950/60 p-6 sm:p-8 rounded-3xl border border-orange-500/40 backdrop-blur-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-orange-400">INITIALIZE_NODE</h2>
          <form onSubmit={startApp} className="space-y-6">
            <div>
              <label htmlFor="identita" className="sr-only">
                Identita
              </label>
              <input
                id="identita"
                required
                maxLength={32}
                autoComplete="nickname"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="Identita (přezdívka)"
                className="w-full bg-teal-900/50 p-4 rounded-xl border border-orange-500/30 outline-none focus:border-orange-500 transition-colors placeholder:text-slate-400"
              />
            </div>

            <div className="text-center">
              <div
                role="button"
                tabIndex={0}
                aria-label={scanDone ? 'Ověření dokončeno' : 'Podrž pro ověření'}
                className={`relative w-24 h-24 rounded-full mx-auto flex items-center justify-center cursor-pointer select-none text-3xl transition-transform active:scale-95 ${
                  scanDone ? 'shadow-[0_0_25px_rgba(249,115,22,0.5)]' : ''
                }`}
                style={{
                  background: `conic-gradient(#f97316 ${progress * 3.6}deg, rgba(249,115,22,0.2) 0deg)`,
                }}
                onMouseDown={startScan}
                onMouseUp={stopScan}
                onMouseLeave={stopScan}
                onTouchStart={startScan}
                onTouchEnd={stopScan}
                onTouchCancel={stopScan}
                onContextMenu={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    startScan();
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') stopScan();
                }}
              >
                <span className="absolute inset-1.5 rounded-full bg-teal-950 flex items-center justify-center">
                  {scanDone ? '✅' : '🔒'}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {scanDone ? 'Ověřeno' : progress > 0 ? `Ověřuji… ${progress} %` : 'Podrž pro ověření'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowLicenseModal(true)}
              aria-pressed={combinedAgreed}
              className={`w-full p-4 rounded-xl border text-center transition-all ${
                combinedAgreed ? 'border-orange-500 bg-orange-950/30' : 'border-orange-500/50 hover:bg-orange-500/10'
              }`}
            >
              {combinedAgreed ? '✅' : '☐'} Souhlasím s podmínkami a potvrzuji věk 15+
            </button>

            <div>
              <button
                type="submit"
                disabled={!canStart}
                className="w-full py-4 bg-orange-600 rounded-xl font-bold hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-600"
              >
                SPUSTIT
              </button>
              {!canStart && (
                <p className="mt-2 text-xs text-center text-slate-400">
                  Ještě: {missing.join(', ')}
                </p>
              )}
            </div>
          </form>
        </div>
      )}

      {currentView === 'app' && (
        <div className="w-full max-w-lg h-[85vh] sm:h-[80vh] bg-teal-950/60 rounded-3xl border border-orange-500/40 backdrop-blur-md flex flex-col overflow-hidden">
          <div className="p-4 border-b border-orange-500/30 bg-teal-900/50 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse" />
            <h2 className="font-bold text-orange-400">Lucie</h2>
            <span className="ml-auto text-xs text-slate-400 truncate">@{name}</span>
          </div>
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4" aria-live="polite">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-2xl max-w-[80%] break-words whitespace-pre-wrap ${
                  m.sender === 'user' ? 'bg-orange-600 ml-auto rounded-br-md' : 'bg-teal-900 rounded-bl-md'
                }`}
              >
                {m.text}
              </div>
            ))}
            {isTyping && <p className="text-xs text-pink-400 animate-pulse">Lucie píše…</p>}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendMessage} className="p-3 border-t border-orange-500/30 bg-teal-900/50 flex gap-2">
            <label htmlFor="zprava" className="sr-only">
              Zpráva
            </label>
            <input
              id="zprava"
              autoFocus
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Zpráva…"
              className="flex-1 min-w-0 bg-transparent outline-none px-2 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-4 py-2 bg-orange-600 rounded-xl font-bold text-sm hover:bg-orange-500 transition-colors disabled:opacity-40"
            >
              Odeslat
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
