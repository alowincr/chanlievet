-- Prioridad de emergencia, triaje y cancelación con marca de tiempo.

CREATE TYPE "AppointmentPriority" AS ENUM ('NORMAL', 'EMERGENCY');
CREATE TYPE "TriageSeverity" AS ENUM ('CRITICAL', 'URGENT', 'MODERATE');

ALTER TABLE "appointments"
  ADD COLUMN "priority" "AppointmentPriority" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "triageSeverity" "TriageSeverity",
  ADD COLUMN "triageSymptoms" TEXT,
  ADD COLUMN "cancelledAt" TIMESTAMP(3);

CREATE INDEX "appointments_priority_status_scheduledAt_idx"
  ON "appointments"("priority", "status", "scheduledAt");
