import "./globals.css";
import type { Metadata } from "next";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";

export const metadata: Metadata = {
  title: "Mohammed Farms — Goat Management",
  description: "Goat farm management for Mohammed Farms — Teddy Goats, Okara, Pakistan",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-small.png",
    apple: "/icon-192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4B6B3A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
