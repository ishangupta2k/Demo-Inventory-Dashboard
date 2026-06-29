import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Nav from "./nav";
import ThemeToggle from "./theme-toggle";
import AssistantWidget from "./assistant-widget";
import { BRAND, TAGLINE } from "@/lib/brand";
import "./globals.css";

const instrumentSans = Instrument_Sans({ variable: "--font-instrument-sans", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({ variable: "--font-instrument-serif", weight: "400", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${BRAND} — ${TAGLINE}`,
  description:
    "A sanitized interactive demo of a private retail operations platform that converts POS inventory and sales exports into vendor purchase orders. All data is synthetic.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSans.variable} ${instrumentSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="top-banner">
          Demo only — all products, vendors, scan codes, inventory, and sales shown are{" "}
          <strong>synthetic</strong>. No real business data.
        </div>

        <header className="app-header">
          <div className="app-shell header-inner">
            <div className="header-left">
              <Link href="/" className="brand">
                <span className="brand-mark">R</span>
                <span>
                  <span className="brand-name">{BRAND}</span>
                  <span className="brand-tagline">{TAGLINE}</span>
                </span>
              </Link>
              <ThemeToggle />
            </div>
            <Nav />
          </div>
        </header>

        <main className="app-shell py-8 sm:py-10">
          {children}
        </main>

        <AssistantWidget />
      </body>
    </html>
  );
}
