import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const title = "NovaSneak - Vente de sneakers et baskets a Cotonou, Calavi (Benin)";
const description =
  "NovaSneak, boutique en ligne de sneakers et baskets au Benin : Nike, Adidas, New Balance, Jordan, Puma, Converse. Livraison a Cotonou et Calavi, commande rapide via WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | NovaSneak",
  },
  description,
  keywords: [
    "NovaSneak",
    "sneakers Benin",
    "vente de baskets Cotonou",
    "sneakers Cotonou",
    "sneakers Calavi",
    "basket Benin",
    "chaussures Cotonou",
    "boutique sneakers Benin",
    "sneakers Missebo",
    "sneakers Akpakpa",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "NovaSneak",
    title,
    description,
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "NovaSneak" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

// Tells Google this is a local business serving Cotonou/Calavi, not just a
// generic site - feeds the local "map pack" and rich-result eligibility.
// Online sales + delivery is the primary pitch (areaServed), the two
// physical pickup points are secondary signals for local search, not the
// headline - kept as neighborhood-level "location" entries since we only
// have quartier names (Missebo, Akpakpa), not street addresses.
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "NovaSneak",
  url: siteUrl,
  image: `${siteUrl}/icon.png`,
  description,
  areaServed: [
    { "@type": "City", name: "Cotonou" },
    { "@type": "City", name: "Calavi" },
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Cotonou",
    addressCountry: "BJ",
  },
  location: [
    {
      "@type": "Place",
      name: "NovaSneak - Point de retrait Missebo",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Missebo, Cotonou",
        addressCountry: "BJ",
      },
    },
    {
      "@type": "Place",
      name: "NovaSneak - Point de retrait Akpakpa",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Akpakpa, Cotonou",
        addressCountry: "BJ",
      },
    },
  ],
  sameAs: [
    "https://www.instagram.com/novasneak.shop.bj",
    "https://www.tiktok.com/@novasneak.shop.bj",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${spaceGrotesk.variable} font-sans antialiased`}>
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
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
