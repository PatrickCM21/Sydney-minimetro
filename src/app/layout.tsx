import type { Metadata } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trackle — Sydney Shortest Path Quiz',
  description: 'Guess the shortest path between two Sydney train stations. A daily puzzle game for rail enthusiasts.',
  keywords: ['sydney trains', 'quiz', 'puzzle', 'metro', 'pathfinding', 'transport', 'trackle'],
  icons: {
    icon: '/trackle_logo.png',
  },
  openGraph: {
    title: 'Trackle',
    description: 'Can you find the shortest path between Sydney stations?',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                const t = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                if (t === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="overflow-hidden h-dvh w-full">
        {children}
      </body>
    </html>
  );
}
