import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { getAppUrl } from "@/lib/app-url";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const APP_URL = getAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Workshop 100% Féminin · Les Pilotes",
    template: "%s · Les Pilotes",
  },
  description:
    "Workshop 100% Féminin by Les Pilotes — suivi des participantes, groupes et mesure d'impact.",
  applicationName: "Les Pilotes — Workshop",
  keywords: ["workshop", "100% féminin", "orientation", "jeunes", "Les Pilotes"],
  authors: [{ name: "Les Pilotes" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Workshop 100% Féminin · Les Pilotes",
    description: "Workshop 100% Féminin by Les Pilotes.",
    url: APP_URL,
    siteName: "Les Pilotes",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Workshop 100% Féminin · Les Pilotes",
    description: "Workshop 100% Féminin by Les Pilotes.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff914d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${dmSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
