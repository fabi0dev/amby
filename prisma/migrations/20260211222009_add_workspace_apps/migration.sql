-- CreateTable
CREATE TABLE "workspace_apps" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_apps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workspace_apps_workspaceId_idx" ON "workspace_apps"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_apps_workspaceId_appId_key" ON "workspace_apps"("workspaceId", "appId");

-- AddForeignKey
ALTER TABLE "workspace_apps" ADD CONSTRAINT "workspace_apps_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
