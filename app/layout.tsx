import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse — Smart Market Watchlist | Know what changed.",
  description: "An intelligent stock watchlist that monitors price movements, volume spikes, and 52-week extremes. Pulse tells you what meaningfully changed since your last visit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink selection:bg-amber-surface selection:text-amber-dark">
        {children}
      </body>
    </html>
  );
}
