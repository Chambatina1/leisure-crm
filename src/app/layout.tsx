import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vuela Cargo · CRM",
  description: "Sistema CRM de paquetería, agencias y logística del Vuela Cargo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
