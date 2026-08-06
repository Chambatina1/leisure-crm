import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leisure Exporting LLC · CRM",
  description: "Sistema CRM de paquetería, agencias y contabilidad para Leisure Exporting LLC.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
