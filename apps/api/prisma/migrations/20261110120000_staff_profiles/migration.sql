-- Perfil público del equipo veterinario
ALTER TABLE "staff_users"
  ADD COLUMN "specialty" TEXT,
  ADD COLUMN "bio" TEXT;
