-- CreateTable
CREATE TABLE "AgentEmailAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "agentId" TEXT NOT NULL,
    "emailAccountId" TEXT NOT NULL,
    CONSTRAINT "AgentEmailAccount_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgentEmailAccount_emailAccountId_fkey" FOREIGN KEY ("emailAccountId") REFERENCES "EmailAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AgentEmailAccount_agentId_idx" ON "AgentEmailAccount"("agentId");

-- CreateIndex
CREATE INDEX "AgentEmailAccount_emailAccountId_idx" ON "AgentEmailAccount"("emailAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentEmailAccount_agentId_emailAccountId_key" ON "AgentEmailAccount"("agentId", "emailAccountId");
