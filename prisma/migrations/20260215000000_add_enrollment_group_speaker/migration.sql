-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "groupSpeakerId" TEXT;

-- CreateIndex
CREATE INDEX "Enrollment_groupSpeakerId_idx" ON "Enrollment"("groupSpeakerId");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_groupSpeakerId_fkey" FOREIGN KEY ("groupSpeakerId") REFERENCES "Speaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

