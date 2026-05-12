import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Verit — Campaign Verification Platform",
    template: "%s · Verit",
  },
  description:
    "AI + blockchain campaign authenticity verification. Detect deepfakes, score authenticity, and publish immutable proofs for every campaign you run.",
  keywords: [
    "campaign verification",
    "deepfake detection",
    "blockchain attestation",
    "ad authenticity",
    "marketing trust",
  ],
  openGraph: {
    title: "Verit — Campaign Verification Platform",
    description:
      "Proof of authentic campaigns. Powered by AI + Blockchain.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
