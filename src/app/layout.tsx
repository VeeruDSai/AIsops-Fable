import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "AIsop's Fables",
  description: 'Instant, rich fables powered by Generative AI',
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
