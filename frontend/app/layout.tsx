import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Backend Discovery Tool',
  description: 'วิเคราะห์เว็บไซต์เพื่อค้นหา API Endpoint และ Backend URL',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${sarabun.variable}`}>
      <body className="font-body bg-bg text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
