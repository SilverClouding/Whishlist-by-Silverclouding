ALTER TABLE "WishlistItem"
ADD COLUMN "variantId" TEXT NOT NULL DEFAULT '',
ADD COLUMN "variantTitle" TEXT;

DROP INDEX "WishlistItem_shop_customerId_productId_key";

CREATE UNIQUE INDEX "WishlistItem_shop_customerId_productId_variantId_key"
ON "WishlistItem"("shop", "customerId", "productId", "variantId");