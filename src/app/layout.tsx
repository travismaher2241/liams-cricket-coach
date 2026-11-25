import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liam's Cricket",
  description: "Personal cricket development companion",
  robots: { index: false, follow: false },
  applicationName: "Liam's Cricket",
  appleWebApp: { capable: true, title: "Cricket", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#0b1726", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
