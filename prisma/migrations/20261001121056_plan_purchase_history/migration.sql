-- CreateTable
CREATE TABLE "PlanPurchaseHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "purchaseType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "eventKey" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "billingPeriodEnd" DATETIME,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanPurchaseHistory_eventKey_key" ON "PlanPurchaseHistory"("eventKey");

-- CreateIndex
CREATE INDEX "PlanPurchaseHistory_shop_occurredAt_idx" ON "PlanPurchaseHistory"("shop", "occurredAt");

-- CreateIndex
CREATE INDEX "PlanPurchaseHistory_shop_subscriptionId_idx" ON "PlanPurchaseHistory"("shop", "subscriptionId");
