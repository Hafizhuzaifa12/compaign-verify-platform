import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>

        {/* 🔥 Toast UI */}
        <Toaster position="top-right" />

        {/* Navbar */}
        <nav
          style={{
            padding: "15px",
            background: "white",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ color: "#0F172A" }}>Campaign Verify</h2>
          <div style={{ color: "#475569" }}>Login | Register</div>
        </nav>

        {/* Page */}
        <div style={{ padding: "20px" }}>{children}</div>

      </body>
    </html>
  );
}