import Providers from '@/providers/Providers'
import { ThemeProvider } from 'next-themes'
import { Geist, Geist_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  weight: ['400', '500', '600', '700'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  weight: ['400', '500', '600', '700'],
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const cookiesData: Record<string, string> = {}
  cookieStore.getAll().forEach(cookie => {
    cookiesData[cookie.name] = cookie.value
  })

  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
          themes={['light', 'dark']}
          disableTransitionOnChange
        >
          <Providers cookiesData={cookiesData}>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
