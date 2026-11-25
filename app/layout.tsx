import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

// latin-ext obsahuje české znaky (č, ř, ž, ů…), bez něj se načítají ze záložního fontu
const inter = Inter({ subsets: ['latin', 'latin-ext'] })

export const metadata: Metadata = {
  title: 'CONVO | Lucie – tvůj vztahový mentor',
  description:
    'CONVO je vztahový mentor pro autentickou komunikaci a hlubší lidská spojení. Konec swipování, začátek skutečných vztahů.',
}

export const viewport: Viewport = {
  themeColor: '#042f2e',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
