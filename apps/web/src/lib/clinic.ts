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
  emergencyNote: "Atención de emergencias dentro del horario de atención.",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/citas", label: "Agendar cita" },
  { href: "/sala-espera", label: "Sala de espera" },
  { href: "/seguimiento", label: "Seguimiento" },
] as const;
