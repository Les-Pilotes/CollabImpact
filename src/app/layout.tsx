import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Immersion — Les Pilotes",
    template: "%s | Les Pilotes",
  },
  description:
    "Découvre des entreprises, explore des métiers, prends le contrôle de ton avenir.",
  keywords: ["immersion", "métiers", "orientation", "jeunes", "entreprise", "Les Pilotes"],
  openGraph: {
    title: "Immersion — Les Pilotes",
    description: "Découvre des entreprises, explore des métiers, prends le contrôle de ton avenir.",
    locale: "fr_FR",
    type: "website",
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
      <body className="min-h-full flex flex-col bg-white text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
