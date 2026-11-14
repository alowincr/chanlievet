import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const sansFont = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});


export const metadata: Metadata = {
  title: {
    default: "ChanlieVet · Clínica veterinaria en San Juan de Lurigancho",
    template: "%s · ChanlieVet",
  },
  description:
    "Consultas, vacunas, baños y una tienda de productos para perros y gatos en San Juan de Lurigancho. Agenda tu cita sin registro y sigue tu turno en vivo.",
  metadataBase: new URL("https://chanlievet.pe"),
  openGraph: {
    title: "ChanlieVet · Clínica veterinaria",
    description:
      "Cuidamos a tu mascota con atención cercana y transparente en San Juan de Lurigancho.",
    locale: "es_PE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${sansFont.variable} ${displayFont.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
