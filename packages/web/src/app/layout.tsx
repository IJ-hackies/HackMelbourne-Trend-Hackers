import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Git Gud — Competitive Git",
  description: "Gamify your Git workflow with esports-style roasts and rankings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-white min-h-screen">
        <nav className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-black tracking-tight hover:text-emerald-400 transition">
              Git Gud
            </Link>
            <div className="flex gap-6 text-sm font-medium">
              <Link href="/profile" className="text-neutral-400 hover:text-white transition">Profile</Link>
              <Link href="/leaderboard" className="text-neutral-400 hover:text-white transition">Leaderboard</Link>
              <Link href="/wrapped" className="text-neutral-400 hover:text-white transition">Wrapped</Link>
              <Link href="/roast-card" className="text-neutral-400 hover:text-white transition">Roast Cards</Link>
            </div>
          </div>
        </nav>
        {children}
        <footer className="border-t border-neutral-800 mt-20 py-8 text-center text-sm text-neutral-500">
          <p>Git Gud — Competitive Git for dangerously overconfident developers.</p>
        </footer>
      </body>
    </html>
  );
}
