// ---------------------------------------------------------------------------
// Contratos (DTO) compartidos entre REST y WebSockets.
// El frontend mantiene una copia de estos tipos en `apps/web/src/lib/types.ts`.
// ---------------------------------------------------------------------------

export type SpeciesValue = "DOG" | "CAT" | "OTHER";
export type ProductAudienceValue = "DOG" | "CAT" | "ALL";
export type StaffRoleValue = "ADMIN" | "VETERINARIAN";

export type AppointmentStatusValue =
  | "PENDING"
  | "CONFIRMED"
  | "WAITING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface OwnerDTO {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
}

export interface PetDTO {
  id: number;
  name: string;
  species: SpeciesValue;
  breed: string | null;
  photoUrl: string | null;
}

export interface ServiceDTO {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  durationMin: number;
}

export interface StaffDTO {
  id: number;
  fullName: string;
  email: string;
  role: StaffRoleValue;
  avatarUrl: string | null;
  active: boolean;
  specialty: string | null;
  bio: string | null;
}

/** Usuario de staff con métricas visibles solo en el panel de administración. */
export interface AdminStaffDTO extends StaffDTO {
  appointmentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicVeterinarianDTO {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  specialty: string | null;
  bio: string | null;
}

export interface AppointmentDTO {
  id: number;
  code: string;
  status: AppointmentStatusValue;
  scheduledAt: string;
  reason: string | null;
  notes: string | null;
  checkedInAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  queuePosition: number | null;
  /** Solo true si la cita es de hoy (Lima) y está dentro de la ventana. */
  canCheckIn: boolean;
  /** Inicio de la ventana de check-in (ISO) o null si no aplica. */
  checkInOpensAt: string | null;
  owner: OwnerDTO;
  pet: PetDTO;
  service: ServiceDTO;
  assignedVet: Pick<StaffDTO, "id" | "fullName" | "avatarUrl"> | null;
}

export interface CategoryDTO {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
}

export interface ProductDTO {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  audience: ProductAudienceValue;
  imageUrl: string | null;
  active: boolean;
  lowStock: boolean;
  createdAt: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface QueuePatientDTO {
  appointmentId: number;
  status: "WAITING" | "IN_PROGRESS";
  /** Posición 1-based dentro de la sala de espera; null si está en atención. */
  position: number | null;
  scheduledAt: string;
  checkedInAt: string | null;
  startedAt: string | null;
  pet: Pick<PetDTO, "name" | "species" | "photoUrl">;
  /**
   * Solo el nombre visible. La sala pública recibe el nombre parcial y el
   * panel del personal recibe el nombre completo, pero nunca el celular,
   * el correo ni el documento del dueño.
   */
  owner: { fullName: string };
  service: Pick<ServiceDTO, "name">;
  vet: { fullName: string; avatarUrl: string | null } | null;
}

export interface QueueSnapshotDTO {
  /** Día de Lima al que pertenece este snapshot (`YYYY-MM-DD`). */
  date: string;
  waiting: QueuePatientDTO[];
  inProgress: QueuePatientDTO[];
  waitingCount: number;
  inProgressCount: number;
  updatedAt: string;
}

export interface ActivityEventDTO {
  id: string;
  appointmentId: number;
  code: string;
  petName: string;
  ownerName: string;
  serviceName: string;
  status: AppointmentStatusValue;
  at: string;
  label: string;
  vetName: string | null;
}

export interface PatientPetDTO {
  id: number;
  name: string;
  species: SpeciesValue;
  breed: string | null;
  birthDate: string | null;
  photoUrl: string | null;
  notes: string | null;
  appointmentsCount: number;
  lastVisitAt: string | null;
}

export interface PatientOwnerDTO {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  documentId: string | null;
  createdAt: string;
  appointmentsCount: number;
  lastVisitAt: string | null;
  pets: PatientPetDTO[];
}

export interface AppointmentUpdateEventDTO {
  code: string;
  status: AppointmentStatusValue;
  queuePosition: number | null;
  updatedAt: string;
}

export interface AdminStatsDTO {
  appointmentsToday: number;
  pending: number;
  waiting: number;
  inProgress: number;
  completedToday: number;
  cancelledToday: number;
  lowStockCount: number;
  totals: {
    owners: number;
    pets: number;
    products: number;
    appointments: number;
  };
  upcoming: AppointmentDTO[];
  liveQueue: QueueSnapshotDTO;
  activity: ActivityEventDTO[];
  lowStockProducts: Array<{
    id: number;
    name: string;
    stock: number;
    category: string;
  }>;
}

export interface AuthResponseDTO {
  token: string;
  user: StaffDTO;
}

export interface HealthDTO {
  ok: boolean;
  service: string;
  environment: string;
  uptime: number;
  timestamp: string;
}
