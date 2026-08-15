import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "8-4L Teddy Farm — Goat Management",
  description: "Simple goat farm management for Pakistani Teddy goat breeders",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4B6B3A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
