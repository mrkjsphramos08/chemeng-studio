import type {Metadata} from 'next';
import {Plus_Jakarta_Sans, IBM_Plex_Mono} from 'next/font/google';
import './globals.css';
import 'katex/dist/katex.min.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Entrolume — Explore. Simulate. Understand. | Chemical Engineering Virtual Laboratories',
  description:
    'Entrolume is an interactive chemical engineering learning platform featuring virtual laboratories for heat transfer, fluid mechanics, reaction engineering, distillation, thermodynamics, and process control.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/branding/entrolume-icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/branding/entrolume-icon.svg',
  },
  openGraph: {
    title: 'Entrolume — Explore. Simulate. Understand.',
    description:
      'Learn complex chemical engineering principles through interactive virtual laboratories, real-time scientific calculations, and guided experiments.',
    type: 'website',
    images: [
      {
        url: '/branding/entrolume-logo.svg',
        width: 1236,
        height: 242,
        alt: 'entrolume — Explore. Simulate. Understand.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Entrolume — Explore. Simulate. Understand.',
    description:
      'Interactive chemical engineering virtual laboratories with real-time scientific solvers and guided student inquiry.',
    images: ['/branding/entrolume-logo.svg'],
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${ibmPlexMono.variable}`}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased selection:bg-teal-700 selection:text-white font-sans"
      >
        {children}
      </body>
    </html>
  );
}
