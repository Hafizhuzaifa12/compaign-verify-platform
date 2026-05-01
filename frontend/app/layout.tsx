import "./globals.css";
import { DM_Sans, Sora } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${sora.variable}`}>
      <body className={`${dmSans.className} flex min-h-screen flex-col antialiased`}>
        <Toaster position="top-right" />

        <SiteHeader />

        <div className="animate-page-in flex-1">{children}</div>

        <SiteFooter />
      </body>
    </html>
  );
}
