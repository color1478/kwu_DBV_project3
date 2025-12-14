import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SD (Ddarungi) Insight',
  description: 'Seoul Public Bike Rental Station Visualization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}

