import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const base = `${protocol}://${host}`;
  const title = "MYTM Digital Experience Centre";
  const description = "Explore MYTM's fintech, banking, lending, payments, AI and enterprise technology ecosystem.";
  return {
    title,
    description,
    icons: { icon: "/mytm-registered-logo.png", shortcut: "/mytm-registered-logo.png" },
    openGraph: { title, description, type: "website", images: [{ url: `${base}/og.png`, width: 1536, height: 1024, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [`${base}/og.png`] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
