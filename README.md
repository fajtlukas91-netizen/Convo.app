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

## Struktura

| Soubor | Co obsahuje |
| --- | --- |
| `app/page.tsx` | Celá aplikace: úvod, registrace s ověřením a souhlasem s podmínkami, chat s Lucií |
| `app/layout.tsx` | Název stránky, popis, font a jazyk |
| `app/globals.css` | Základní styly |

## Stav

Beta. Odpovědi Lucie jsou zatím simulované přímo v prohlížeči a zprávy se nikam neukládají ani neodesílají.

## Nasazení

Aplikace je nasazená na Vercelu: https://convo-ruby.vercel.app
