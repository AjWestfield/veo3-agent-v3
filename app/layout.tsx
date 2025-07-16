import type { Metadata } from 'next'
import './globals.css'
import { SettingsProvider } from '@/contexts/settings-context'
import { ImagesProvider } from '@/contexts/images-context'

export const metadata: Metadata = {
  title: 'VEO3 Agent',
  description: 'AI-powered video processing and chat application',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <SettingsProvider>
          <ImagesProvider>
            {children}
          </ImagesProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}
