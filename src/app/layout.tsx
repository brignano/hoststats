import type { Metadata, Viewport } from "next";
import { Geist, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

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

const TITLE = "HostStats – What Your Airbnb Really Earns";
const DESCRIPTION =
  "Profit after your costs, the empty nights between stays, pace against last year and tax-time totals — from your Airbnb exports, read in your browser.";
// The link-preview card (iMessage, Slack, etc.). Without one, iMessage draws
// an empty placeholder above the title. metadataBase makes the URL absolute.
const SOCIAL_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "HostStats: see what your Airbnb really earns",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "HostStats",
  manifest: "/manifest.webmanifest",
  // Relative to metadataBase; pages with their own address override it.
  alternates: { canonical: "/" },
  appleWebApp: {
    capable: true,
    title: "HostStats",
    statusBarStyle: "default",
  },
  // Listed explicitly: with an `icons` object here, Next does not also link
  // app/icon.svg, and the page shipped with no favicon at all.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "HostStats",
    title: TITLE,
    description: DESCRIPTION,
    images: [SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [SOCIAL_IMAGE],
  },
};

// Structured data for search results: WebSite gives Google the name to show
// above a result, WebApplication says what the site is. A plain <script>
// rather than next/script so it is in the exported HTML crawlers read.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", name: "HostStats", url: `${SITE_URL}/` },
    {
      "@type": "WebApplication",
      name: "HostStats",
      url: `${SITE_URL}/`,
      description: DESCRIPTION,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      image: `${SITE_URL}/og.png`,
    },
  ],
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
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        {children}
      </body>
    </html>
  );
}
