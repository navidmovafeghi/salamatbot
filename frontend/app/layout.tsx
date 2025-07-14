import type { Metadata } from 'next'
import './globals.css'
import './styles/tmp_rovodev_new-header.css'
import './styles/tmp_rovodev_cta-section.css'

export const metadata: Metadata = {
  title: 'چت‌بات پزشکی',
  description: 'چت‌بات پزشکی برای پاسخ به سوالات بهداشتی',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}