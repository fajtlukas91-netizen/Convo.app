import { LUCIE_SYSTEM_PROMPT } from './prompt';

// Odpověď se posílá průběžně, proto potřebujeme víc času než výchozích 10 s
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
const MAX_HISTORY = 20; // kolik posledních zpráv posíláme AI
const MAX_MESSAGE_CHARS = 2000;
const MAX_OUTPUT_TOKENS = 700;

// Jednoduchá ochrana proti zahlcení: max. 30 zpráv za 10 minut z jedné IP.
// Paměť je jen v rámci jedné běžící instance, takže to není neprůstřelné,
// ale zastaví to obyčejné zneužití a hlídá to účet za AI.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 30;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT;
}

type InMessage = { sender: 'ai' | 'user'; text: string };
type ApiMessage = { role: 'user' | 'assistant'; content: string };

function toApiMessages(history: InMessage[]): ApiMessage[] {
  const out: ApiMessage[] = [];
  for (const m of history.slice(-MAX_HISTORY)) {
    const role = m.sender === 'user' ? 'user' : 'assistant';
    const content = String(m.text || '').slice(0, MAX_MESSAGE_CHARS).trim();
    if (!content) continue;
    // Konverzace pro AI musí začínat zprávou uživatele
    if (out.length === 0 && role === 'assistant') continue;
    const last = out[out.length - 1];
    if (last && last.role === role) {
      last.content += '\n\n' + content; // AI vyžaduje střídání rolí
    } else {
      out.push({ role, content });
    }
  }
  return out;
}

function textResponse(text: string, status = 200) {
  return new Response(text, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return textResponse(
      'Lucie se teď ještě učí mluvit. Zatím nemá zapnutý svůj „mozek“ (chybí nastavení na serveru), zkus to prosím později.',
      503
    );
  }

  const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) {
    return textResponse('Píšeš hodně rychle. Dej mi chvilku vydechnout a zkus to za pár minut znovu.', 429);
  }

  let body: { messages?: InMessage[]; name?: string };
  try {
    body = await req.json();
  } catch {
    return textResponse('Neplatný požadavek.', 400);
  }

  const messages = toApiMessages(Array.isArray(body.messages) ? body.messages : []);
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return textResponse('Chybí zpráva.', 400);
  }

  const name = String(body.name || '').slice(0, 32).replace(/[\r\n<>{}`]/g, '').trim();
  const system = name ? `${LUCIE_SYSTEM_PROMPT}\n\nUživatel se v aplikaci představil přezdívkou: ${name}` : LUCIE_SYSTEM_PROMPT;

  let upstream: Response;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system,
        messages,
        stream: true,
      }),
    });
  } catch (err) {
    console.error('Lucie: spojení s AI selhalo', err);
    return textResponse('Nepodařilo se mi spojit. Zkus to prosím znovu.', 502);
  }

  if (!upstream.ok || !upstream.body) {
    console.error('Lucie: AI vrátila chybu', upstream.status, await upstream.text().catch(() => ''));
    return textResponse('Teď mi to trochu drhne. Zkus to prosím za chvilku znovu.', 502);
  }

  // Z proudu událostí (SSE) od AI vytáhneme jen text a posíláme ho dál
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (!data) continue;
            try {
              const event = JSON.parse(data);
              if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                controller.enqueue(encoder.encode(event.delta.text));
              } else if (event.type === 'error') {
                console.error('Lucie: chyba během odpovědi', event.error);
                controller.enqueue(encoder.encode('\n\n(Odpověď se přerušila, zkus to prosím znovu.)'));
              }
            } catch {
              // neúplný nebo neznámý řádek přeskočíme
            }
          }
        }
      } catch (err) {
        console.error('Lucie: čtení odpovědi selhalo', err);
      } finally {
        controller.close();
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
