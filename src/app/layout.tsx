import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HostStats – Your Airbnb at a Glance",
  description:
    "Upload your Airbnb CSV exports and instantly see how your hosting is going.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
