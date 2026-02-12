-- AlterTable
ALTER TABLE "document_versions" ADD COLUMN     "event" TEXT,
ADD COLUMN     "metadata" JSONB;
