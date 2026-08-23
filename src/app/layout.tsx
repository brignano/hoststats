import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoststats.brignano.io";
const TITLE = "HostStats – Your Airbnb at a Glance";
const DESCRIPTION =
  "Upload your Airbnb CSV exports and instantly see how your hosting is going. Everything is processed in your browser — nothing is uploaded.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "HostStats",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "HostStats",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "HostStats",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    // Private family tool sitting behind Cloudflare Access — keep it unindexed.
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#FF385C",
  width: "device-width",
  initialScale: 1,
  // Let people pinch-zoom; a lot of hosts read this on a phone.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
