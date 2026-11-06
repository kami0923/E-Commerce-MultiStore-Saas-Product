import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Meridian Commerce",
    template: "%s · Meridian Commerce",
  },
  description: "Multi-store commerce infrastructure for modern retail brands.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
