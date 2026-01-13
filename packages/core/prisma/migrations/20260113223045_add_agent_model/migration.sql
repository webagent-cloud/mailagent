-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL DEFAULT 'TRIGGER_MANUALLY',
    "prompt" TEXT NOT NULL,
    "responseFormat" TEXT NOT NULL DEFAULT 'STRING',
    "jsonSchema" TEXT,
    "webhookUrl" TEXT,
    "shouldExtractFiles" BOOLEAN NOT NULL DEFAULT false,
    "extractFileConfig" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gpt-4',
    "modelProvider" TEXT NOT NULL DEFAULT 'openai',
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE INDEX "Agent_triggerType_idx" ON "Agent"("triggerType");

-- CreateIndex
CREATE INDEX "Agent_isActive_idx" ON "Agent"("isActive");
