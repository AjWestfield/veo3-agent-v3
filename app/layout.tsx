import type { Metadata } from 'next'
import './globals.css'
import { SettingsProvider } from '@/contexts/settings-context'
import { ImagesProvider } from '@/contexts/images-context'
import { VideosProvider } from '@/contexts/videos-context'
import { AudiosProvider } from '@/contexts/audios-context'
import { ChatSessionsProvider } from '@/contexts/chat-sessions-context'

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
          <ChatSessionsProvider>
            <ImagesProvider>
              <VideosProvider>
                <AudiosProvider>
                  {children}
                </AudiosProvider>
              </VideosProvider>
            </ImagesProvider>
          </ChatSessionsProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}
