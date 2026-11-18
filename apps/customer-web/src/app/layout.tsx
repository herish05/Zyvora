import type { Metadata } from "next";
import { CustomerShell } from "./customer-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zyvora | Find your kind of beautiful",
  description: "A thoughtful edit of bags, shoes and clothes to make everyday dressing feel a little more like you."
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
