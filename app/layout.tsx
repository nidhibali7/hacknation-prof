import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ProfAI - The Video That Watches You Back',
  description: '60-second AI lessons that adapt to your confusion in real-time',
  keywords: 'adaptive learning, AI education, personalized lessons, face tracking, voice commands',
  authors: [{ name: 'MIT Hackathon Team' }],
  openGraph: {
    title: 'ProfAI - The Video That Watches You Back',
    description: '60-second AI lessons that adapt to your confusion in real-time',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}