"use client";

import { useState, useRef, useEffect, useCallback } from 'react';

type Message = { id: number; sender: 'ai' | 'user'; text: string; error?: boolean };

const STORAGE_KEY = 'convo-lucie-v1';
const MAX_INPUT = 2000;
const SUGGESTIONS = [
  'Nevím, jak napsat první zprávu',
  'Byl/a jsem na rande a nevím, co dál',
  'Chci si ujasnit, co ve vztahu hledám',
  'Pojďme si nanečisto zkusit rozhovor',
];

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
          className="text-xl sm:text-2xl font-black text-orange-400 mb-2 uppercase tracking-widest text-center"
        >
          Podmínky používání CONVO
        </h2>
        <p className="text-center text-xs text-slate-400 mb-6 border-b border-orange-500/20 pb-4">Beta verze · stručně a srozumitelně</p>
        <div className="text-sm text-slate-300 space-y-4 leading-relaxed">
          <p><span className="font-bold text-emerald-300">1. Co je CONVO.</span> CONVO je projekt ve vývoji (beta). Lucie je umělá inteligence, která ti pomáhá s komunikací a vztahy. Není to člověk, terapeut ani lékař a její rady jsou jen orientační. Rozhodnutí jsou vždy na tobě.</p>
          <p><span className="font-bold text-cyan-300">2. Věk.</span> CONVO můžeš používat, pokud je ti alespoň 15 let.</p>
          <p><span className="font-bold text-emerald-300">3. Tvoje data.</span> Konverzace s Lucií se ukládá jen v tomto prohlížeči. Aby ti Lucie mohla odpovědět, posílají se tvoje zprávy ke zpracování poskytovateli AI (Anthropic). Tvoje data neprodáváme. Do chatu nepiš citlivé údaje jako adresu, telefon, hesla nebo čísla karet.</p>
          <p><span className="font-bold text-orange-400">4. Férové chování.</span> Nezkoušej aplikaci zneužívat, přetěžovat ani narušovat. Při zneužití můžeme omezit nebo zablokovat přístup.</p>
          <p><span className="font-bold text-teal-300">5. Autorská práva.</span> Aplikace, její kód, design a značka CONVO patří autorovi. Bez jeho svolení je nekopíruj ani dál nešiř.</p>
          <p><span className="font-bold text-orange-400">6. Odpovědnost.</span> Aplikace je v betě a poskytuje se tak, jak je. Může obsahovat chyby nebo být dočasně nedostupná.</p>
          <p><span className="font-bold text-cyan-300">7. Změny a odvolání souhlasu.</span> Podmínky se můžou během bety měnit, o podstatných změnách tě budeme informovat v aplikaci. Souhlas můžeš kdykoli odvolat tlačítkem „Odejít“, tím se zároveň smaže konverzace v tomto prohlížeči.</p>
          <p><span className="font-bold text-teal-300">8. Právo.</span> Tyto podmínky se řídí právem České republiky.</p>
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
  const [isTyping, setIsTyping] = useState(false); // Lucie přemýšlí nebo píše
  const [progress, setProgress] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const nextIdRef = useRef(1);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

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

  // Obnovení předchozí konverzace z tohoto prohlížeče
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved.name === 'string' && Array.isArray(saved.messages) && saved.messages.length > 0) {
        const restored: Message[] = saved.messages
          .filter((m: Message) => m && (m.sender === 'ai' || m.sender === 'user') && typeof m.text === 'string')
          .map((m: Message, i: number) => ({ id: i + 1, sender: m.sender, text: m.text }));
        nextIdRef.current = restored.length + 1;
        setRegUsername(saved.name);
        setMessages(restored);
        setCombinedAgreed(true);
        setProgress(100);
        setCurrentView('app');
      }
    } catch {
      // poškozená nebo nedostupná paměť prohlížeče, začneme znovu
    }
  }, []);

  // Uložení konverzace (jen v tomto prohlížeči, nikam se neodesílá)
  useEffect(() => {
    if (currentView !== 'app' || isTyping) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ name, messages: messages.slice(-60).map(({ sender, text }) => ({ sender, text })) })
      );
    } catch {
      // paměť prohlížeče není dostupná, nevadí
    }
  }, [messages, currentView, isTyping, name]);

  // Úklid při opuštění stránky
  useEffect(() => {
    return () => {
      stopScan();
      abortRef.current?.abort();
    };
  }, [stopScan]);

  // Automatické posunutí chatu na poslední zprávu
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  const greeting = (): Message => ({
    id: nextIdRef.current++,
    sender: 'ai',
    text: 'Ahoj, já jsem Lucie. Pomůžu ti najít slova, ujasnit si, co ve vztahu hledáš, nebo si nanečisto vyzkoušet rozhovor, ze kterého máš trému. Co tě sem dnes přivádí?',
  });

  const startApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canStart) return;
    setMessages([greeting()]);
    setCurrentView('app');
  };

  const newConversation = () => {
    abortRef.current?.abort();
    setIsTyping(false);
    setMessages([greeting()]);
    inputRef.current?.focus();
  };

  const leave = () => {
    abortRef.current?.abort();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setIsTyping(false);
    setMessages([]);
    setRegUsername('');
    setCombinedAgreed(false);
    setProgress(0);
    setCurrentView('uvod');
  };

  const send = async (text: string) => {
    const userMsg = text.trim().slice(0, MAX_INPUT);
    if (!userMsg || isTyping) return;

    const userMessage: Message = { id: nextIdRef.current++, sender: 'user', text: userMsg };
    const history = [...messages, userMessage];
    const replyId = nextIdRef.current++;
    setMessages(history);
    setInput('');
    setIsTyping(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let reply = '';

    try {
      const res = await fetch('/api/lucie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, messages: history.map(({ sender, text }) => ({ sender, text })) }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errText = (await res.text().catch(() => '')) || 'Teď mi to trochu drhne. Zkus to prosím za chvilku znovu.';
        setMessages((prev) => [...prev, { id: replyId, sender: 'ai', text: errText, error: true }]);
        return;
      }

      // Odpověď přichází postupně, zobrazujeme ji, jak se píše
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      setMessages((prev) => [...prev, { id: replyId, sender: 'ai', text: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        const current = reply;
        setMessages((prev) => prev.map((m) => (m.id === replyId ? { ...m, text: current } : m)));
      }
      if (!reply.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId ? { ...m, text: 'Promiň, nějak mi došla slova. Zkusíš to napsat znovu?', error: true } : m
          )
        );
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setMessages((prev) => {
        const without = prev.filter((m) => m.id !== replyId || reply.trim());
        return [
          ...without,
          { id: nextIdRef.current++, sender: 'ai', text: 'Nepodařilo se mi spojit. Zkontroluj připojení a zkus to znovu.', error: true },
        ];
      });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsTyping(false);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
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
        <div className="w-full max-w-lg h-[88dvh] sm:h-[80vh] bg-teal-950/60 rounded-3xl border border-orange-500/40 backdrop-blur-md flex flex-col overflow-hidden">
          <div className="p-4 border-b border-orange-500/30 bg-teal-900/50 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full bg-pink-500 ${isTyping ? 'animate-pulse' : ''}`} />
            <div className="min-w-0">
              <h2 className="font-bold text-orange-400 leading-tight">Lucie</h2>
              <p className="text-[11px] text-slate-400 truncate">vztahová mentorka · @{name}</p>
            </div>
            <div className="ml-auto flex gap-1 shrink-0">
              <button
                type="button"
                onClick={newConversation}
                className="text-xs px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-white/10 transition-colors"
              >
                Nový rozhovor
              </button>
              <button
                type="button"
                onClick={leave}
                className="text-xs px-2.5 py-1.5 rounded-lg text-slate-400 hover:bg-white/10 transition-colors"
              >
                Odejít
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4" aria-live="polite">
            {messages
              .filter((m) => m.text)
              .map((m) => (
                <div
                  key={m.id}
                  className={`px-4 py-3 rounded-2xl max-w-[85%] break-words whitespace-pre-wrap leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-orange-600 ml-auto rounded-br-md'
                      : m.error
                        ? 'bg-teal-900/60 border border-pink-500/40 text-slate-200 rounded-bl-md'
                        : 'bg-teal-900 rounded-bl-md'
                  }`}
                >
                  {m.text}
                </div>
              ))}

            {isTyping && !(messages.length && messages[messages.length - 1].sender === 'ai' && messages[messages.length - 1].text) && (
              <div className="bg-teal-900 rounded-2xl rounded-bl-md px-4 py-3 w-16 flex gap-1 justify-center" aria-label="Lucie píše">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:300ms]" />
              </div>
            )}

            {!isTyping && messages.length === 1 && messages[0].sender === 'ai' && (
              <div className="flex flex-wrap gap-2 pt-2">
                {SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => send(sug)}
                    className="text-sm px-3 py-2 rounded-xl border border-orange-500/40 text-orange-200 hover:bg-orange-500/10 transition-colors text-left"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-3 border-t border-orange-500/30 bg-teal-900/50">
            <div className="flex gap-2 items-end">
              <label htmlFor="zprava" className="sr-only">
                Zpráva
              </label>
              <textarea
                id="zprava"
                ref={inputRef}
                autoFocus
                rows={1}
                maxLength={MAX_INPUT}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                }}
                onKeyDown={(e) => {
                  // Enter odešle, Shift+Enter udělá nový řádek
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(input);
                    e.currentTarget.style.height = 'auto';
                  }
                }}
                placeholder="Napiš Lucii…"
                className="flex-1 min-w-0 resize-none bg-transparent outline-none px-2 py-2 max-h-32 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="px-4 py-2 bg-orange-600 rounded-xl font-bold text-sm hover:bg-orange-500 transition-colors disabled:opacity-40"
              >
                Odeslat
              </button>
            </div>
            <p className="mt-2 px-2 text-[10px] text-slate-500 leading-snug">
              Lucie je AI a může se mýlit. Nenahrazuje odborníka. Když je ti opravdu zle, volej Linku první psychické pomoci 116 123.
            </p>
          </form>
        </div>
      )}
    </main>
  );
}
