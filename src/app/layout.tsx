import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'HUConnect',
    template: '%s · HUConnect',
  },
  description:
    'Elections, concerns and proposals for your campus — in one clear, private place.',
  applicationName: 'HUConnect',
  keywords: [
    'college governance',
    'student elections',
    'anonymous voting',
    'campus democracy',
    'CR election',
    'proposal management',
  ],
  openGraph: {
    title: 'HUConnect',
    description:
      'Your campus. Your voice. Elections, concerns and proposals in one clear, private place.',
    type: 'website',
    siteName: 'HUConnect',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <body className="font-sans">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
