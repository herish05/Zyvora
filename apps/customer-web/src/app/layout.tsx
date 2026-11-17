import type { Metadata } from "next";
import { Cormorant_Garamond, Sora } from "next/font/google";
import { CustomerShell } from "./customer-shell";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display"
});

const body = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Zyvora | Premium Shopping",
  description: "Zyvora premium storefront"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
        <CustomerShell>{children}</CustomerShell>
      </body>
    </html>
  );
}
