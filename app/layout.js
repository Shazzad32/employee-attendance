import "./globals.css";
import { Manrope } from "next/font/google";
import PWA from "@/components/PWA";

const font = Manrope({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "TimeTrack",
  description: "Clock in, clock out, and see every hour counted.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "TimeTrack", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport = { themeColor: "#0E1726", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.className}>
        <PWA />
        {children}
      </body>
    </html>
  );
}
