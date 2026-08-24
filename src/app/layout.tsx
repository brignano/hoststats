import type { Metadata, Viewport } from "next";
import { Geist, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// The design system's --sans / --mono name these faces. next/font self-hosts
// them at build time, so there is no runtime request to a font CDN — which
// also keeps the CSP in public/_headers tight.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

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
  // The one place a literal is unavoidable: <meta name="theme-color"> is read
  // by the browser chrome before any CSS is parsed, so it cannot reference a
  // custom property. These mirror --bg per theme (--n-25 / --n-0) and must be
  // kept in step with tokens.css by hand.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0f" },
  ],
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
    <html lang="en" className={`${geist.variable} ${plexMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
