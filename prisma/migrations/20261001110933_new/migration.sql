-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" DATETIME
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productHandle" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "productImage" TEXT,
    "productPrice" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WishlistAnalytics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "adds" INTEGER NOT NULL DEFAULT 0,
    "removes" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WishlistSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "heading" TEXT NOT NULL DEFAULT 'My wishlist',
    "emptyMessage" TEXT NOT NULL DEFAULT 'You have not saved any products yet.',
    "columns" INTEGER NOT NULL DEFAULT 4,
    "showPrices" BOOLEAN NOT NULL DEFAULT true,
    "showRemove" BOOLEAN NOT NULL DEFAULT true,
    "buttonLabel" TEXT NOT NULL DEFAULT 'Remove',
    "showAddToCart" BOOLEAN NOT NULL DEFAULT false,
    "addToCartLabel" TEXT NOT NULL DEFAULT 'Add to cart',
    "cardClass" TEXT NOT NULL DEFAULT 'sai-wishlist-page__item',
    "customCss" TEXT NOT NULL DEFAULT '',
    "toastBg" TEXT NOT NULL DEFAULT '#1a1a1a',
    "toastColor" TEXT NOT NULL DEFAULT '#ffffff',
    "toastPosition" TEXT NOT NULL DEFAULT 'top-left',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ActiveSubscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "planId" TEXT NOT NULL DEFAULT 'free',
    "subscriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "trialEndsOn" DATETIME,
    "currentPeriodEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MonthlyPlanPurchase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "purchaseType" TEXT NOT NULL DEFAULT 'base',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ScheduledPlanChange" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "previousPlanId" TEXT NOT NULL,
    "effectiveMonth" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AddonPurchase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "saves" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "chargeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "WishlistItem_shop_customerId_idx" ON "WishlistItem"("shop", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_shop_customerId_productId_key" ON "WishlistItem"("shop", "customerId", "productId");

-- CreateIndex
CREATE INDEX "WishlistAnalytics_shop_month_idx" ON "WishlistAnalytics"("shop", "month");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistAnalytics_shop_day_key" ON "WishlistAnalytics"("shop", "day");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistSettings_shop_key" ON "WishlistSettings"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveSubscription_shop_key" ON "ActiveSubscription"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyPlanPurchase_subscriptionId_key" ON "MonthlyPlanPurchase"("subscriptionId");

-- CreateIndex
CREATE INDEX "MonthlyPlanPurchase_shop_month_idx" ON "MonthlyPlanPurchase"("shop", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledPlanChange_shop_key" ON "ScheduledPlanChange"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledPlanChange_subscriptionId_key" ON "ScheduledPlanChange"("subscriptionId");

-- CreateIndex
CREATE INDEX "AddonPurchase_shop_month_idx" ON "AddonPurchase"("shop", "month");
