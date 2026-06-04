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
  openGraph: {
    title: "Jade Compass — Strategic Intelligence for Business",
    description:
      "Get the same quality of strategic intelligence that large corporations pay millions for — without the consulting firm price tag.",
    type: "website",
    siteName: "Jade Compass",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <body className="min-h-screen bg-bg-dark">{children}</body>
    </html>
  );
}
