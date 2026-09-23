import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "NovaSneak",
  description: "Catalogue de sneakers - commande directe via WhatsApp",
};

const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${spaceGrotesk.variable} font-sans antialiased`}>
        {children}
        {umamiWebsiteId && (
          <Script
            src={process.env.NEXT_PUBLIC_UMAMI_SRC || "http://localhost:3001/script.js"}
            data-website-id={umamiWebsiteId}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
