import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StoryForge AI',
  description: 'Instant, rich stories powered by Generative AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-amber-200">{children}</body>
    </html>
  );
}
