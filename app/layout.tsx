import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Ashtavakra Hostel Gym - Slot Booking & Attendance System',
  description: 'Official slot reservation, attendance tracking, and gym management platform for Ashtavakra Hostel residents.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {children}
        </main>
        <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-400 bg-slate-900/50 mb-14 md:mb-0">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 Ashtavakra Hostel Gym Management System.</span>
            <span>All rights reserved.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
