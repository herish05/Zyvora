import type { Metadata } from "next";
import { AdminShell } from "./admin-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zyvora Control Center",
  description: "Admin operations for Zyvora"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "var(--font-body)" }}>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
