import type { Metadata } from "next";

// The tool needs its own metadata because src/app/app/page.tsx is a client
// component, and a "use client" page cannot export `metadata`. Without this the
// root layout's `canonical: "/"` would be inherited here, and /app/ would tell
// search engines it was really the landing page.
export const metadata: Metadata = {
  title: "HostStats – your dashboard",
  description:
    "Drop in your Airbnb exports and see profit after costs, gap nights, pace against last year and tax-time totals. Read in your browser; nothing is uploaded.",
  alternates: { canonical: "/app/" },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
