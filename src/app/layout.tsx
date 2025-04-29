import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans'; // Import Geist Sans
import { GeistMono } from 'geist/font/mono'; // Import Geist Mono
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster


export const metadata: Metadata = {
  title: 'MotoGuardian App', // Updated Title
  description: 'Your Ride Safety Companion', // Updated Description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      {/* Apply font variables and dark class. No whitespace allowed between <html> and <body> */}
      <body className={`antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        {children}
        <Toaster /> {/* Add Toaster component */}
      </body>
    </html>
  );
}
