-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAppState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAppState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "UserSettings_userId_lastSyncAt_idx" ON "UserSettings"("userId", "lastSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserAppState_userId_key" ON "UserAppState"("userId");

-- CreateIndex
CREATE INDEX "UserAppState_userId_lastSyncAt_idx" ON "UserAppState"("userId", "lastSyncAt");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAppState" ADD CONSTRAINT "UserAppState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
