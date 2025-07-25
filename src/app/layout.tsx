import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Control de Rendimiento Físico",
  description:
    "Herramienta sencilla y rápida para jugadores de fútbol. Completa el formulario TQR antes de cada sesión y el RPE al terminar para que el cuerpo técnico pueda monitorizar tu bienestar, adaptar las cargas y prevenir lesiones.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
