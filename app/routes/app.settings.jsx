import { Form, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { resolveLocale, getAdminTranslations } from "../i18n.server";

const defaults = {
  heading:        "My wishlist",
  emptyMessage:   "You have not saved any products yet.",
  columns:        4,
  showPrices:     true,
  showRemove:     true,
  buttonLabel:    "Remove",
  cardClass:      "silv-wishlist-page__item",
  customCss:      "",
  toastBg:        "#1a1a1a",
  toastColor:     "#ffffff",
  toastPosition:  "top-left",
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await prisma.wishlistSettings.findUnique({
    where: { shop: session.shop },
  });
  const locale = resolveLocale(request, session);
  const t = getAdminTranslations(locale).settings;

  return {
    shop: session.shop,
    settings: settings || defaults,
    t,
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const settings = {
    heading: String(formData.get("heading") || defaults.heading).trim(),
    emptyMessage: String(
      formData.get("emptyMessage") || defaults.emptyMessage
    ).trim(),
    columns: Math.min(
      6,
      Math.max(2, Number(formData.get("columns")) || 4)
    ),
    showPrices: formData.get("showPrices") === "on",
    showRemove: formData.get("showRemove") === "on",
    buttonLabel: String(
      formData.get("buttonLabel") || defaults.buttonLabel
    ).trim(),
    cardClass:
      String(formData.get("cardClass") || defaults.cardClass)
        .trim()
        .split(/\s+/)
        .filter((v) => /^[a-zA-Z0-9_-]+$/.test(v))
        .join(" ") || defaults.cardClass,
    customCss: String(formData.get("customCss") || "").slice(0, 5000),
    toastBg: String(
      formData.get("toastBg") || defaults.toastBg
    ).trim(),
    toastColor: String(
      formData.get("toastColor") || defaults.toastColor
    ).trim(),
    toastPosition: [
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ].includes(formData.get("toastPosition"))
      ? String(formData.get("toastPosition"))
      : defaults.toastPosition,
  };

  await prisma.wishlistSettings.upsert({
    where: { shop: session.shop },
    create: { shop: session.shop, ...settings },
    update: settings,
  });

  return { saved: true };
};

export default function WishlistSettingsPage() {
  const { shop, settings, t } = useLoaderData();
  const actionData = useActionData();

  return (
    <s-page heading={t?.heading || "Settings"}>
      <Form method="post">
        <s-stack direction="block" gap="large">

          {/* Theme Editor Banner - Extension First */}
          <s-section heading={t?.theme_design_heading || "Theme Extension Design"}>
            <s-box border="base" borderRadius="base" padding="base" background="subdued">
              <s-grid gap="small">
                <s-stack direction="inline" gap="small-200" alignItems="center">
                  <s-heading>{t?.storefront_design_title || "Storefront design is managed in Theme Editor"}</s-heading>
                  <s-badge tone="success">{t?.recommended_badge || "Recommended"}</s-badge>
                </s-stack>
                <s-text>
                  {t?.theme_design_desc || "Your wishlist buttons, colors, headings, empty messages, grid columns, and Add to cart button are configured directly inside your theme extension blocks for real-time preview and theme alignment."}
                </s-text>
                <s-stack direction="inline" gap="small" alignItems="center">
                  <s-button
                    variant="primary"
                    href={`https://${shop}/admin/themes/current/editor`}
                    target="_blank"
                  >
                    {t?.btn_open_theme_editor || "Open Theme Editor"}
                  </s-button>
                  <s-button
                    variant="secondary"
                    href="/app/how-to-use"
                  >
                    {t?.btn_view_setup_guide || "View setup guide"}
                  </s-button>
                </s-stack>
              </s-grid>
            </s-box>
          </s-section>

          {/* Language & Translations Link */}
          <s-section heading={t?.lang_section_heading || "Language & Translations"}>
            <s-box border="base" borderRadius="base" padding="base">
              <s-grid gap="small">
                <s-stack direction="inline" gap="small-200" alignItems="center">
                  <s-heading>{t?.lang_title || "Multi-language text customization"}</s-heading>
                  <s-badge tone="info">{t?.multilingual_badge || "Multilingual"}</s-badge>
                </s-stack>
                <s-text>
                  {t?.lang_desc || "Customize button labels, page headings, and notification messages for every language individually."}
                </s-text>
                <div>
                  <s-button
                    variant="secondary"
                    href="/app/languages"
                  >
                    {t?.btn_manage_translations || "Manage language translations →"}
                  </s-button>
                </div>
              </s-grid>
            </s-box>
          </s-section>

          {/* Toast Notification Settings (App-level) */}
          <s-section heading={t?.toast_heading || "Toast notifications"}>
            <s-stack direction="block" gap="base">
              <s-text>
                {t?.toast_desc || "Configure the notification popup displayed when shoppers add or remove wishlist items."}
              </s-text>

              <s-text-field
                label={t?.label_toast_bg || "Background color"}
                name="toastBg"
                value={settings.toastBg}
                helpText={t?.help_toast_bg || "Hex or CSS color, e.g. #1a1a1a"}
              />

              <s-text-field
                label={t?.label_toast_color || "Text color"}
                name="toastColor"
                value={settings.toastColor}
                helpText={t?.help_toast_color || "Hex or CSS color, e.g. #ffffff"}
              />

              <s-select
                label={t?.label_toast_position || "Screen position"}
                name="toastPosition"
                value={settings.toastPosition}
              >
                <s-option value="top-left">{t?.pos_top_left || "Top left"}</s-option>
                <s-option value="top-right">{t?.pos_top_right || "Top right"}</s-option>
                <s-option value="bottom-left">{t?.pos_bottom_left || "Bottom left"}</s-option>
                <s-option value="bottom-right">{t?.pos_bottom_right || "Bottom right"}</s-option>
              </s-select>
            </s-stack>
          </s-section>

          {/* Custom CSS (App-level styling) */}
          <s-section heading={t?.custom_css_heading || "Custom styling & CSS"}>
            <s-stack direction="block" gap="base">
              <s-text-field
                label={t?.label_card_class || "Custom product card class"}
                name="cardClass"
                value={settings.cardClass}
                helpText={t?.help_card_class || "Optional CSS class name to inherit product card styles from your theme."}
              />

              <s-text-area
                label={t?.label_custom_css || "Custom CSS overrides"}
                name="customCss"
                value={settings.customCss}
                rows={5}
                helpText={t?.custom_css_help || "Injected directly on the wishlist page. Maximum 5,000 characters."}
              />
            </s-stack>
          </s-section>

          {/* Fallback Defaults (Optional override if block settings are unconfigured) */}
          <s-section heading={t?.fallback_heading || "Fallback page defaults"}>
            <s-box border="base" borderRadius="base" padding="base">
              <s-stack direction="block" gap="base">
                <s-text tone="subdued">
                  {t?.fallback_desc || "These values serve as fallback defaults if the wishlist theme block settings are not explicitly set in the Theme Editor."}
                </s-text>

                <s-text-field
                  label={t?.label_default_heading || "Default heading"}
                  name="heading"
                  value={settings.heading}
                />

                <s-text-field
                  label={t?.label_empty_message || "Default empty state message"}
                  name="emptyMessage"
                  value={settings.emptyMessage}
                />

                <s-select
                  label={t?.label_grid_columns || "Default grid columns"}
                  name="columns"
                  value={String(settings.columns)}
                >
                  {[2, 3, 4, 5, 6].map((n) => (
                    <s-option key={n} value={String(n)}>
                      {n}
                    </s-option>
                  ))}
                </s-select>

                <s-checkbox
                  label={t?.label_show_prices || "Show product prices by default"}
                  name="showPrices"
                  checked={settings.showPrices}
                />

                <s-checkbox
                  label={t?.label_show_remove || "Show remove button by default"}
                  name="showRemove"
                  checked={settings.showRemove}
                />

                <s-text-field
                  label={t?.label_remove_button || "Remove button label"}
                  name="buttonLabel"
                  value={settings.buttonLabel}
                />
              </s-stack>
            </s-box>
          </s-section>

          {/* Save feedback */}
          {actionData?.saved && (
            <s-banner
              tone="success"
              heading={t?.saved_banner || "Settings saved"}
            >
              {t?.saved_banner || "Your app settings have been saved successfully."}
            </s-banner>
          )}

          {/* Actions */}
          <s-section>
            <s-button type="submit" variant="primary">
              {t?.btn_save || "Save settings"}
            </s-button>
          </s-section>

        </s-stack>
      </Form>
    </s-page>
  );
}
