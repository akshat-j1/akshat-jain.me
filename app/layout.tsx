import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";
import "./field.css";

const instrumentSerif = localFont({
  src: [
    { path: "./fonts/instrument-serif-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/instrument-serif-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const inter = localFont({
  src: "./fonts/inter-normal.woff2",
  weight: "400 600",
  variable: "--font-inter",
  display: "swap",
});

const title = "Akshat Jain — Computer Science Student, Developer & Builder";
const description =
  "Akshat Jain is a computer science student, developer and builder. Explore his work through Lunar Field Log or browse the portfolio directly.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.akshat-jain.me"),
  title,
  description,
  authors: [{ name: "Akshat Jain" }],
  openGraph: {
    title,
    description,
    siteName: "Lunar Field Log",
    type: "website",
  },
  twitter: { card: "summary", title, description },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${inter.variable}`}>
      <body className="bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
