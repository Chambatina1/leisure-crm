import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

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
  title: "Ambitosmax LLC — Gas, Combustible y Envíos a Cuba",
  description:
    "Balas de gas, combustible en isotanques y tambores, electrodomésticos, motos y envíos a Cuba. Todo desde Ambitosmax LLC.",
  alternates: {
    canonical: "https://ambitosmax.com",
  },
  openGraph: {
    type: "website",
    url: "https://ambitosmax.com",
    siteName: "Ambitosmax LLC",
    title: "Ambitosmax LLC — Gas, Combustible y Envíos a Cuba",
    description: "Balas de gas, combustible en isotanques, tienda y envíos a Cuba.",
  },
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
    title: "Leisure",
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
