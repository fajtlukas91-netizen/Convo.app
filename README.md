# CONVO – aplikace

Webová aplikace projektu **CONVO**: vztahový mentor pro autentickou komunikaci a hlubší lidská spojení. Uživatel projde krátkou registrací („INITIALIZE_NODE“) a pak si píše s **Lucií**, svým digitálním průvodcem.

Prezentační web projektu je v repozitáři [Convo](https://github.com/fajtlukas91-netizen/Convo).

## Technologie

- [Next.js 14](https://nextjs.org/) (App Router)
- React 18 + TypeScript
- Tailwind CSS

## Spuštění

```bash
npm install
npm run dev
```

Aplikace poběží na [http://localhost:3000](http://localhost:3000).

Produkční build:

```bash
npm run build
npm start
```

## Lucie a AI

Lucie odpovídá přes Claude (Anthropic API). Aby fungovala, musí mít server nastavený klíč:

| Proměnná | Povinná | Popis |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | ano | API klíč z https://console.anthropic.com |
| `ANTHROPIC_MODEL` | ne | Model, výchozí `claude-haiku-5-5` |

Na Vercelu: projekt **convo-app → Settings → Environment Variables**, pak znovu nasadit. Lokálně: soubor `.env.local` s řádkem `ANTHROPIC_API_KEY=...`.

Bez klíče aplikace funguje, jen Lucie místo odpovědi napíše, že ještě nemá zapnutý „mozek“.

Jak Lucie mluví a co smí, se nastavuje v `app/api/lucie/prompt.ts`.

## Struktura

| Soubor | Co obsahuje |
| --- | --- |
| `app/page.tsx` | Celá aplikace: úvod, registrace s ověřením a souhlasem s podmínkami, chat s Lucií |
| `app/api/lucie/route.ts` | Serverová část: posílá konverzaci AI a průběžně vrací odpověď, hlídá limity |
| `app/api/lucie/prompt.ts` | Osobnost a pravidla Lucie |
| `app/layout.tsx` | Název stránky, popis, font a jazyk |
| `app/globals.css` | Základní styly |

## Stav

Beta. Konverzace se ukládá jen v prohlížeči uživatele (localStorage). Zprávy se posílají k vytvoření odpovědi Anthropic API, jinam se neukládají.

## Nasazení

Aplikace je nasazená na Vercelu: https://convo-ruby.vercel.app
