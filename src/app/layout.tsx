import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-merriweather",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jade Compass — Strategic Intelligence for Business",
  description:
    "Market research and competitive analysis for business owners who need clarity, not guesswork. Get actionable intelligence reports tailored to your business.",
  metadataBase: new URL("https://compassjade.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Jade Compass — Strategic Intelligence for Business",
    description:
      "Get the same quality of strategic intelligence that large corporations pay millions for — without the consulting firm price tag.",
    type: "website",
    siteName: "Jade Compass",
    url: "https://compassjade.app",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jade Compass — Strategic Intelligence for Business",
    description:
      "Market research and competitive analysis for business owners who need clarity, not guesswork.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Jade Compass",
    description: "Strategic intelligence and market research for business decision-makers.",
    url: "https://compassjade.app",
    foundingDate: "2026",
    areaServed: "US",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Intelligence Reports",
      itemListElement: [
        { "@type": "Offer", name: "Business Scan", price: "97", priceCurrency: "USD" },
        { "@type": "Offer", name: "Intelligence Briefing", price: "197", priceCurrency: "USD" },
        { "@type": "Offer", name: "Deep Dive", price: "497", priceCurrency: "USD" },
      ],
    },
  };

  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-bg-dark">{children}</body>
    </html>
  );
}
