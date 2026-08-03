import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '국비 공모 파인더 - GV Finder',
  description: 'AI 기반 맞춤형 정부/지자체 공모사업 매칭 서비스',
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
