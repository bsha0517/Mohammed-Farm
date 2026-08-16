import QRCode from "qrcode";
import { headers } from "next/headers";

/** Builds the absolute URL to a goat's profile from the current request's host. */
export function getGoatProfileUrl(goatId: string) {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}/herd/${goatId}`;
}

/** Returns a data: URL PNG of the QR code — safe to drop straight into an <img src>. */
export async function generateGoatQrDataUrl(goatId: string) {
  const url = getGoatProfileUrl(goatId);
  return QRCode.toDataURL(url, { margin: 1, width: 300, color: { dark: "#2B2419", light: "#FFFFFF" } });
}
