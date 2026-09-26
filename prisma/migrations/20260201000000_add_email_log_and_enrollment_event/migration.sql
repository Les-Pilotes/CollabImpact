-- CreateEnum
CREATE TYPE "EmailKind" AS ENUM ('inscription_confirmation', 'j7_reminder', 'j2_reminder', 'feedback_invite', 'feedback_relance', 'droits_relance', 'admin_alert', 'admin_invitation', 'custom');

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('sent', 'failed');

-- CreateEnum
CREATE TYPE "EnrollmentEventType" AS ENUM ('enrolled', 'status_changed', 'email_sent', 'email_failed', 'checked_in', 'feedback_submitted', 'note_added');

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "kind" "EmailKind" NOT NULL,
    "to" TEXT NOT NULL,
    "status" "EmailDeliveryStatus" NOT NULL,
    "providerId" TEXT,
    "error" TEXT,
    "eventId" TEXT,
    "enrollmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentEvent" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "type" "EnrollmentEventType" NOT NULL,
    "label" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrollmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLog_organisationId_createdAt_idx" ON "EmailLog"("organisationId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_enrollmentId_idx" ON "EmailLog"("enrollmentId");

-- CreateIndex
CREATE INDEX "EmailLog_eventId_kind_idx" ON "EmailLog"("eventId", "kind");

-- CreateIndex
CREATE INDEX "EnrollmentEvent_enrollmentId_createdAt_idx" ON "EnrollmentEvent"("enrollmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentEvent" ADD CONSTRAINT "EnrollmentEvent_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

