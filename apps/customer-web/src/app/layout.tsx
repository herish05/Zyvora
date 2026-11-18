import type { Metadata } from "next";
import { CustomerShell } from "./customer-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zyvora | Premium Shopping",
  description: "Zyvora premium storefront"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
        <CustomerShell>{children}</CustomerShell>
      </body>
    </html>
  );
}
