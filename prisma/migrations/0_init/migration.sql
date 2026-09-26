-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('FEMININ', 'IMMERSION', 'ATELIER', 'IMPULSION');

-- CreateEnum
CREATE TYPE "ImmersionStatus" AS ENUM ('brouillon', 'publie', 'complet', 'en_cours', 'termine', 'archive');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('inscrit', 'contactee', 'confirmee_j7', 'confirmee_j2', 'presente', 'absente', 'desistement', 'feedback_recu');

-- CreateEnum
CREATE TYPE "EnrollmentMode" AS ENUM ('individuel', 'via_referent');

-- CreateEnum
CREATE TYPE "DroitsImageStatus" AS ENUM ('pending', 'accepted', 'refused', 'minor_parental_pending');

-- CreateEnum
CREATE TYPE "TaskPhase" AS ENUM ('PREPARATION', 'WORKSHOP', 'POST_EVENT');

-- CreateEnum
CREATE TYPE "SpeakerStatus" AS ENUM ('invitee', 'brief_envoye', 'confirmee');

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "supabaseAuthId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" DATE,
    "gender" TEXT,
    "city" TEXT,
    "source" TEXT,
    "reliabilityScore" INTEGER NOT NULL DEFAULT 0,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "niveauScolaire" TEXT,
    "niveauScolaireAutre" TEXT,
    "etablissement" TEXT,
    "region" TEXT,
    "projetPro" TEXT,
    "motivation" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "motivationDetail" TEXT,
    "commentConnu" TEXT,
    "orientationUpdatedAt" TIMESTAMP(3),
    "droitsImageStatus" "DroitsImageStatus",
    "droitsImageSignedAt" TIMESTAMP(3),
    "droitsImageSignature" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Immersion" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "type" "EventType" NOT NULL DEFAULT 'FEMININ',
    "name" TEXT NOT NULL,
    "status" "ImmersionStatus" NOT NULL DEFAULT 'brouillon',
    "address" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "replyToEmail" TEXT,
    "emailSignature" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notificationConfig" JSONB,

    CONSTRAINT "Immersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "immersionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'inscrit',
    "mode" "EnrollmentMode" NOT NULL DEFAULT 'individuel',
    "referentName" TEXT,
    "source" TEXT,
    "attendedAt" TIMESTAMP(3),
    "noShow" BOOLEAN NOT NULL DEFAULT false,
    "j7SentAt" TIMESTAMP(3),
    "j2SentAt" TIMESTAMP(3),
    "feedbackToken" TEXT,
    "feedbackSentAt" TIMESTAMP(3),
    "droitsImageStatus" "DroitsImageStatus" NOT NULL DEFAULT 'pending',
    "droitsImageSignedAt" TIMESTAMP(3),
    "droitsImageSignature" TEXT,
    "regime" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accessibilite" TEXT,
    "accompagnateur" BOOLEAN NOT NULL DEFAULT false,
    "commentaire" TEXT,
    "internalNote" TEXT,
    "deletedAt" TIMESTAMP(3),
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "overallRating" INTEGER,
    "orgRating" INTEGER,
    "favoriteMoment" TEXT,
    "changedVision" BOOLEAN,
    "improvements" TEXT,
    "verbatim" TEXT,
    "answers" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "phase" "TaskPhase" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "doneByEmail" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Speaker" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "jobTitle" TEXT,
    "company" TEXT,
    "domain" TEXT,
    "bio" TEXT,
    "photoUrl" TEXT,
    "status" "SpeakerStatus" NOT NULL DEFAULT 'invitee',
    "profileToken" TEXT NOT NULL,
    "feedbackToken" TEXT NOT NULL,
    "profileSubmittedAt" TIMESTAMP(3),
    "feedbackSubmittedAt" TIMESTAMP(3),
    "feedbackAnswers" JSONB,
    "eventId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Speaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "speakerId" TEXT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormConfig" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "phoneEnabled" BOOLEAN NOT NULL DEFAULT true,
    "birthDateEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cityEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sourceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "niveauScolaireEnabled" BOOLEAN NOT NULL DEFAULT true,
    "regionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "projetProEnabled" BOOLEAN NOT NULL DEFAULT true,
    "motivationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "droitsImageEnabled" BOOLEAN NOT NULL DEFAULT true,
    "regimeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "accessibiliteEnabled" BOOLEAN NOT NULL DEFAULT true,
    "commentaireEnabled" BOOLEAN NOT NULL DEFAULT true,
    "customFields" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackConfig" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "satisfactionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "highlightsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "favoriteSpeakerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "recommendEnabled" BOOLEAN NOT NULL DEFAULT true,
    "customFields" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailConfig" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "confirmationSubject" TEXT,
    "confirmationBody" TEXT,
    "confirmationNote" TEXT,
    "j7Subject" TEXT,
    "j7Body" TEXT,
    "j7Note" TEXT,
    "j2Subject" TEXT,
    "j2Body" TEXT,
    "j2Note" TEXT,
    "feedbackSubject" TEXT,
    "feedbackBody" TEXT,
    "feedbackNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "eventId" TEXT,
    "enrollmentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRead" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_organisationId_idx" ON "Admin"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseAuthId_key" ON "User"("supabaseAuthId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organisationId_idx" ON "User"("organisationId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Immersion_organisationId_idx" ON "Immersion"("organisationId");

-- CreateIndex
CREATE INDEX "Immersion_date_idx" ON "Immersion"("date");

-- CreateIndex
CREATE INDEX "Immersion_status_idx" ON "Immersion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_feedbackToken_key" ON "Enrollment"("feedbackToken");

-- CreateIndex
CREATE INDEX "Enrollment_organisationId_idx" ON "Enrollment"("organisationId");

-- CreateIndex
CREATE INDEX "Enrollment_immersionId_idx" ON "Enrollment"("immersionId");

-- CreateIndex
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");

-- CreateIndex
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_immersionId_userId_key" ON "Enrollment"("immersionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_enrollmentId_key" ON "Feedback"("enrollmentId");

-- CreateIndex
CREATE INDEX "Feedback_submittedAt_idx" ON "Feedback"("submittedAt");

-- CreateIndex
CREATE INDEX "Task_eventId_phase_idx" ON "Task"("eventId", "phase");

-- CreateIndex
CREATE UNIQUE INDEX "Speaker_profileToken_key" ON "Speaker"("profileToken");

-- CreateIndex
CREATE UNIQUE INDEX "Speaker_feedbackToken_key" ON "Speaker"("feedbackToken");

-- CreateIndex
CREATE INDEX "Speaker_organisationId_idx" ON "Speaker"("organisationId");

-- CreateIndex
CREATE INDEX "Speaker_eventId_idx" ON "Speaker"("eventId");

-- CreateIndex
CREATE INDEX "Speaker_status_idx" ON "Speaker"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Group_speakerId_key" ON "Group"("speakerId");

-- CreateIndex
CREATE INDEX "Group_eventId_idx" ON "Group"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "FormConfig_eventId_key" ON "FormConfig"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackConfig_eventId_key" ON "FeedbackConfig"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailConfig_eventId_key" ON "EmailConfig"("eventId");

-- CreateIndex
CREATE INDEX "Notification_organisationId_createdAt_idx" ON "Notification"("organisationId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_eventId_type_idx" ON "Notification"("eventId", "type");

-- CreateIndex
CREATE INDEX "NotificationRead_adminId_idx" ON "NotificationRead"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRead_notificationId_adminId_key" ON "NotificationRead"("notificationId", "adminId");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Immersion" ADD CONSTRAINT "Immersion_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_immersionId_fkey" FOREIGN KEY ("immersionId") REFERENCES "Immersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Immersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Speaker" ADD CONSTRAINT "Speaker_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Speaker" ADD CONSTRAINT "Speaker_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Immersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Immersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Speaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormConfig" ADD CONSTRAINT "FormConfig_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Immersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackConfig" ADD CONSTRAINT "FeedbackConfig_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Immersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailConfig" ADD CONSTRAINT "EmailConfig_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Immersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

