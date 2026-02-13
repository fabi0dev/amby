-- CreateTable
CREATE TABLE "system_stats_logs" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "documentsCount" INTEGER NOT NULL,
    "usersCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_stats_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_stats_logs_date_key" ON "system_stats_logs"("date");
