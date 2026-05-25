import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sydney MiniMetro — Shortest Path Quiz',
  description: 'Guess the shortest path between two Sydney train stations. A daily puzzle game for rail enthusiasts.',
  keywords: ['sydney trains', 'quiz', 'puzzle', 'metro', 'pathfinding', 'transport'],
  openGraph: {
    title: 'Sydney MiniMetro',
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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-game-bg text-white overflow-hidden h-screen w-screen">
        {children}
      </body>
    </html>
  );
}
