export const CLINIC = {
  name: "ChanlieVet",
  tagline: "Clínica veterinaria",
  address: "Av. Praderas del Norte 1250, Urb. Canto Grande",
  district: "San Juan de Lurigancho, Lima",
  phone: "+51 987 654 321",
  whatsapp: "51987654321",
  email: "hola@chanlievet.pe",
  hours: [
    { days: "Lunes a viernes", time: "8:00 a. m. – 8:00 p. m." },
    { days: "Sábados", time: "8:00 a. m. – 6:00 p. m." },
    { days: "Domingos y feriados", time: "9:00 a. m. – 2:00 p. m." },
  ],
} as const;

/**
 * Aviso que debe acompañar al sitio público: ChanlieVet es una demo de
 * portafolio y no una clínica real.
 */
export const PORTFOLIO_NOTICE = {
  title: "Proyecto de portafolio",
  footer:
    "ChanlieVet es una demostración de portafolio. La clínica, el equipo, los precios y los datos de contacto son ficticios: no es una veterinaria real ni atiende emergencias.",
  emergency:
    "Esta página es parte de una demostración de portafolio. ChanlieVet no es una clínica real y no atiende emergencias. Si tu mascota necesita ayuda urgente, acude a un centro veterinario real.",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/citas", label: "Agendar cita" },
  { href: "/sala-espera", label: "Sala de espera" },
  { href: "/seguimiento", label: "Seguimiento" },
  { href: "/emergencia", label: "Emergencia" },
] as const;
