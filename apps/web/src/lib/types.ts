// Contratos espejo de `apps/api/src/types/dto.ts`.

export type Species = "DOG" | "CAT" | "OTHER";
export type ProductAudience = "DOG" | "CAT" | "ALL";
export type StaffRole = "ADMIN" | "VETERINARIAN";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "WAITING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Owner {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
}

export interface Pet {
  id: number;
  name: string;
  species: Species;
  breed: string | null;
  photoUrl: string | null;
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  durationMin: number;
}

export interface StaffUser {
  id: number;
  fullName: string;
  email: string;
  role: StaffRole;
  avatarUrl: string | null;
  active: boolean;
  specialty: string | null;
  bio: string | null;
}

export interface PublicVeterinarian {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  specialty: string | null;
  bio: string | null;
}

export interface Appointment {
  id: number;
  code: string;
  status: AppointmentStatus;
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
  owner: Owner;
  pet: Pet;
  service: Service;
  assignedVet: Pick<StaffUser, "id" | "fullName" | "avatarUrl"> | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  audience: ProductAudience;
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

export interface QueuePatient {
  appointmentId: number;
  status: "WAITING" | "IN_PROGRESS";
  position: number | null;
  scheduledAt: string;
  checkedInAt: string | null;
  startedAt: string | null;
  pet: Pick<Pet, "name" | "species" | "photoUrl">;
  owner: { fullName: string };
  service: Pick<Service, "name">;
  vet: { fullName: string; avatarUrl: string | null } | null;
}

export interface QueueSnapshot {
  /** Día de Lima al que pertenece este snapshot (`YYYY-MM-DD`). */
  date: string;
  waiting: QueuePatient[];
  inProgress: QueuePatient[];
  waitingCount: number;
  inProgressCount: number;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  appointmentId: number;
  code: string;
  petName: string;
  ownerName: string;
  serviceName: string;
  status: AppointmentStatus;
  at: string;
  label: string;
  vetName: string | null;
}

export interface PatientPet {
  id: number;
  name: string;
  species: Species;
  breed: string | null;
  birthDate: string | null;
  photoUrl: string | null;
  notes: string | null;
  appointmentsCount: number;
  lastVisitAt: string | null;
}

export interface PatientOwner {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  createdAt: string;
  appointmentsCount: number;
  lastVisitAt: string | null;
  pets: PatientPet[];
}

export interface AppointmentUpdateEvent {
  code: string;
  status: AppointmentStatus;
  queuePosition: number | null;
  updatedAt: string;
}

export interface AdminStats {
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
  upcoming: Appointment[];
  liveQueue: QueueSnapshot;
  activity: ActivityEvent[];
  lowStockProducts: Array<{
    id: number;
    name: string;
    stock: number;
    category: string;
  }>;
}

export interface AuthResponse {
  token: string;
  user: StaffUser;
}

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  audience: ProductAudience;
  categorySlug: string;
  stock: number;
  quantity: number;
}
