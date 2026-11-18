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
  title: 'ChemEng Studio — Interactive Chemical Engineering Virtual Laboratories',
  description:
    'Interactive chemical engineering learning platform and virtual laboratory workspace featuring a countercurrent heat exchanger simulator using the effectiveness-NTU method.',
  openGraph: {
    title: 'ChemEng Studio — Interactive Chemical Engineering Virtual Laboratories',
    description:
      'Interactive chemical engineering learning platform and virtual laboratory workspace featuring a countercurrent heat exchanger simulator using the effectiveness-NTU method.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChemEng Studio — Interactive Chemical Engineering Virtual Laboratories',
    description:
      'Interactive chemical engineering learning platform and virtual laboratory workspace featuring a countercurrent heat exchanger simulator using the effectiveness-NTU method.',
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
