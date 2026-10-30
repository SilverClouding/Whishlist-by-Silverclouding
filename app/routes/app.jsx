import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import { currentUsage } from "../db.wishlist.server";
import { getPlanEntitlement, getMonthlyAddonSaves, monthKey } from "../billing.server";
import { resolveLocale, getAdminTranslations } from "../i18n.server";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const month = monthKey();
  const locale = resolveLocale(request, session);
  const t = getAdminTranslations(locale);

  const [entitlement, used, addonSaves] = await Promise.all([
    getPlanEntitlement(shop, month, admin),
    currentUsage(shop, month),
    getMonthlyAddonSaves(shop, month),
  ]);

  const limit = entitlement.planLimit;
  const effLimit = Number.isFinite(limit) ? limit + addonSaves : Infinity;
  const isLimitReached = Number.isFinite(effLimit) && used >= effLimit;
  const remaining = Number.isFinite(effLimit) ? Math.max(0, effLimit - used) : null;
  const isRunningLow = !isLimitReached && Number.isFinite(effLimit) && remaining <= 20;

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    locale,
    t,
    limitStatus: {
      isLimitReached,
      isRunningLow,
      used,
      limit: effLimit,
      remaining,
      planName: entitlement.planId,
    },
  };
};

export default function App() {
  const { apiKey, limitStatus, t } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      {/*
        s-app-nav: App Bridge component for the Shopify admin sidebar nav.
        rel="home" hides the link from the menu and sets it as the home route.
        Labels should be 1-2 words, noun-based per Shopify guidelines.
      */}
      <s-app-nav>
        <s-link href="/app" rel="home">{t?.nav?.dashboard || "Dashboard"}</s-link>
        <s-link href="/app/wishlist">{t?.nav?.activity || "Activity"}</s-link>
        <s-link href="/app/settings">{t?.nav?.design || "Design"}</s-link>
        <s-link href="/app/pricing">{t?.nav?.pricing || "Pricing"}</s-link>
        <s-link href="/app/how-to-use">{t?.nav?.setup || "Setup"}</s-link>
        <s-link href="/app/api-docs">{t?.nav?.developer_api || "Developer API"}</s-link>
      </s-app-nav>

      {limitStatus?.isLimitReached && (
        <div style={{ padding: "16px 16px 0 16px" }}>
          <s-banner tone="critical" heading={t?.alerts?.limit_reached_title || "Monthly Wishlist Limit Reached (100% Used)"}>
            {(t?.alerts?.limit_reached_desc || "Your store has used all {limit} saves for this month. Shoppers can no longer add items to their wishlist.").replace("{limit}", String(limitStatus.limit))}{" "}
            <s-link href="/app/pricing">{t?.alerts?.upgrade_now || "Upgrade your plan"}</s-link>
          </s-banner>
        </div>
      )}

      {limitStatus?.isRunningLow && (
        <div style={{ padding: "16px 16px 0 16px" }}>
          <s-banner tone="warning" heading={t?.alerts?.running_low_title || "Running Low on Wishlist Saves"}>
            {(t?.alerts?.running_low_desc || "Only {remaining} saves remaining out of {limit} this month.").replace("{remaining}", String(limitStatus.remaining)).replace("{limit}", String(limitStatus.limit))}{" "}
            <s-link href="/app/pricing">{t?.alerts?.upgrade_prompt || "Upgrade your plan to avoid hitting your limit."}</s-link>
          </s-banner>
        </div>
      )}

      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
