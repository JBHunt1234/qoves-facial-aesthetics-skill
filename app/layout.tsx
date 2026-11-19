import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-serif-display" });

export const metadata: Metadata = {
  title: "FaceLab — Facial Aesthetics Analysis",
  description:
    "Upload a photo and get a personalised facial analysis: proportions, hairstyle, grooming, glasses and style recommendations, plus AI previews of how you'd look.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body className="min-h-screen">
        <header className="no-print sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2">
              <LogoMark />
              <span className="font-serif text-xl tracking-tight">FaceLab</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/#how" className="hidden rounded-full px-3 py-1.5 text-muted hover:text-ink sm:block">
                How it works
              </Link>
              <Link href="/#report" className="hidden rounded-full px-3 py-1.5 text-muted hover:text-ink sm:block">
                The report
              </Link>
              <Link href="/analyze" className="btn-primary !py-1.5">
                Start analysis
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="no-print mt-24 border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted sm:flex-row sm:justify-between sm:px-6">
            <p>Styling guidance, not medical advice. Photos are processed for your session and not stored.</p>
            <p>Knowledge base: looksmaxxing-skill (MIT). Not affiliated with QOVES Studio.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse cx="12" cy="12" rx="7.5" ry="10" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.5 9h15M4.5 15h15M12 2v20" stroke="currentColor" strokeWidth="1" opacity=".45" />
    </svg>
  );
}
