import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ORGANIZACION_JSONLD } from "@/lib/seo-paginas";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ambitosmax.com"),
  title: {
    default: "Ambitosmax — Balitas de gas, diésel y gasolina en Cuba",
    template: "%s | Ambitosmax",
  },
  description:
    "Balitas de gas en Cuba por $85 (sin entregar el vacío), diésel y gasolina en Cuba, electrodomésticos, motos y envíos a Cuba. Compra desde EE.UU. y tu familia recibe en Cuba.",
  keywords: [
    "balitas de gas en Cuba", "balita de gas Cuba", "diésel y gasolina en Cuba", "gasolina en Cuba", "diésel en Cuba", "cilindro de gas La Habana", "gas licuado Cuba", "comprar gas para Cuba",
    "combustible Cuba", "diésel Cuba", "gasolina Cuba", "envíos a Cuba", "tienda online Cuba",
    "electrodomésticos para Cuba", "motos eléctricas Cuba", "plantas eléctricas Cuba", "Ambitosmax",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Ambitosmax",
    locale: "es_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Ambitosmax" }],
    title: "Ambitosmax — Balitas de gas, diésel y gasolina en Cuba",
    description: "Balitas de gas en Cuba por $85, diésel y gasolina en Cuba, tienda online y envíos a Cuba.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ambitosmax — Balitas de gas, diésel y gasolina en Cuba",
    description: "Balitas de gas en Cuba, diésel y gasolina en Cuba, tienda y envíos.",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  category: "shopping",
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  applicationName: "Ambitosmax",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ambitosmax",
  },
};

export const viewport: Viewport = {
  themeColor: "#071a46",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Ambitosmax" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([ORGANIZACION_JSONLD, { "@context": "https://schema.org", "@type": "WebSite", name: "Ambitosmax", url: "https://ambitosmax.com", inLanguage: "es" }]) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
