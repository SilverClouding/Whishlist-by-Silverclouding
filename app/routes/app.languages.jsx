import { useState } from "react";
import { Form, useActionData, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// Bundled base translations per locale
const DEFAULT_TRANSLATIONS = {
  en: {
    name: "English",
    flag: "🇺🇸",
    values: {
      add_to_cart: "Add to cart",
      add_to_wishlist: "Add to wishlist",
      saved: "Saved",
      remove: "Remove",
      share_wishlist: "Share wishlist",
      clear_all: "Clear all",
      heading: "My wishlist",
      empty_message: "You have not saved any products yet.",
      shared_wishlist_heading: "Shared wishlist",
      sold_out: "Sold out",
      added_to_cart: "Added to cart",
      added_to_wishlist: "Added to wishlist",
      removed_from_wishlist: "Removed from wishlist",
      wishlist_cleared: "Wishlist cleared",
      share_copied: "Link copied!",
    },
  },
  es: {
    name: "Spanish (Español)",
    flag: "🇪🇸",
    values: {
      add_to_cart: "Añadir al carrito",
      add_to_wishlist: "Añadir a la lista de deseos",
      saved: "Guardado",
      remove: "Eliminar",
      share_wishlist: "Compartir lista de deseos",
      clear_all: "Borrar todo",
      heading: "Mi lista de deseos",
      empty_message: "Aún no has guardado ningún producto.",
      shared_wishlist_heading: "Lista de deseos compartida",
      sold_out: "Agotado",
      added_to_cart: "Añadido al carrito",
      added_to_wishlist: "Añadido a la lista de deseos",
      removed_from_wishlist: "Eliminado de la lista de deseos",
      wishlist_cleared: "Lista de deseos vaciada",
      share_copied: "¡Enlace copiado!",
    },
  },
  fr: {
    name: "French (Français)",
    flag: "🇫🇷",
    values: {
      add_to_cart: "Ajouter au panier",
      add_to_wishlist: "Ajouter à la liste d'envies",
      saved: "Enregistré",
      remove: "Supprimer",
      share_wishlist: "Partager la liste d'envies",
      clear_all: "Tout effacer",
      heading: "Ma liste d'envies",
      empty_message: "Vous n'avez pas encore enregistré de produits.",
      shared_wishlist_heading: "Liste d'envies partagée",
      sold_out: "Épuisé",
      added_to_cart: "Ajouté au panier",
      added_to_wishlist: "Ajouté à la liste d'envies",
      removed_from_wishlist: "Retiré de la liste d'envies",
      wishlist_cleared: "Liste d'envies effacée",
      share_copied: "Lien copié !",
    },
  },
  de: {
    name: "German (Deutsch)",
    flag: "🇩🇪",
    values: {
      add_to_cart: "In den Warenkorb",
      add_to_wishlist: "Zur Wunschliste hinzufügen",
      saved: "Gespeichert",
      remove: "Entfernen",
      share_wishlist: "Wunschliste teilen",
      clear_all: "Alles löschen",
      heading: "Meine Wunschliste",
      empty_message: "Du hast noch keine Produkte gespeichert.",
      shared_wishlist_heading: "Geteilte Wunschliste",
      sold_out: "Ausverkauft",
      added_to_cart: "In den Warenkorb gelegt",
      added_to_wishlist: "Zur Wunschliste hinzugefügt",
      removed_from_wishlist: "Von der Wunschliste entfernt",
      wishlist_cleared: "Wunschliste gelöscht",
      share_copied: "Link kopiert!",
    },
  },
  it: {
    name: "Italian (Italiano)",
    flag: "🇮🇹",
    values: {
      add_to_cart: "Aggiungi al carrello",
      add_to_wishlist: "Aggiungi alla lista dei desideri",
      saved: "Salvato",
      remove: "Rimuovi",
      share_wishlist: "Condividi lista dei desideri",
      clear_all: "Cancella tutto",
      heading: "La mia lista dei desideri",
      empty_message: "Non hai ancora salvato alcun prodotto.",
      shared_wishlist_heading: "Lista dei desideri condivisa",
      sold_out: "Esaurito",
      added_to_cart: "Aggiunto al carrello",
      added_to_wishlist: "Aggiunto alla lista dei desideri",
      removed_from_wishlist: "Rimosso dalla lista dei desideri",
      wishlist_cleared: "Lista dei desideri svuotata",
      share_copied: "Link copiato!",
    },
  },
  "pt-BR": {
    name: "Portuguese (Português)",
    flag: "🇧🇷",
    values: {
      add_to_cart: "Adicionar ao carrinho",
      add_to_wishlist: "Adicionar à lista de desejos",
      saved: "Salvo",
      remove: "Remover",
      share_wishlist: "Compartilhar lista de desejos",
      clear_all: "Limpar tudo",
      heading: "Minha lista de desejos",
      empty_message: "Você ainda não salvou nenhum produto.",
      shared_wishlist_heading: "Lista de desejos compartilhada",
      sold_out: "Esgotado",
      added_to_cart: "Adicionado ao carrinho",
      added_to_wishlist: "Adicionado à lista de desejos",
      removed_from_wishlist: "Removido da lista de desejos",
      wishlist_cleared: "Lista de desejos limpa",
      share_copied: "Link copiado!",
    },
  },
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await prisma.wishlistSettings.findUnique({
    where: { shop: session.shop },
  });

  let savedTranslations = {};
  try {
    savedTranslations = settings?.translations ? JSON.parse(settings.translations) : {};
  } catch {
    savedTranslations = {};
  }

  const url = new URL(request.url);
  const initialLocale = url.searchParams.get("locale") || "en";

  return {
    savedTranslations,
    initialLocale: DEFAULT_TRANSLATIONS[initialLocale] ? initialLocale : "en",
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const locale = String(formData.get("locale") || "en").trim();

  const settings = await prisma.wishlistSettings.findUnique({
    where: { shop: session.shop },
  });

  let allTranslations = {};
  try {
    allTranslations = settings?.translations ? JSON.parse(settings.translations) : {};
  } catch {
    allTranslations = {};
  }

  const fields = [
    "add_to_cart",
    "add_to_wishlist",
    "saved",
    "remove",
    "share_wishlist",
    "clear_all",
    "heading",
    "empty_message",
    "shared_wishlist_heading",
    "sold_out",
    "added_to_cart",
    "added_to_wishlist",
    "removed_from_wishlist",
    "wishlist_cleared",
    "share_copied",
  ];

  const localeOverrides = {};
  for (const field of fields) {
    const val = formData.get(field);
    if (typeof val === "string" && val.trim() !== "") {
      localeOverrides[field] = val.trim();
    }
  }

  allTranslations[locale] = localeOverrides;

  await prisma.wishlistSettings.upsert({
    where: { shop: session.shop },
    create: {
      shop: session.shop,
      translations: JSON.stringify(allTranslations),
    },
    update: {
      translations: JSON.stringify(allTranslations),
    },
  });

  return { saved: true, savedLocale: locale };
};

export default function LanguagesPage() {
  const { savedTranslations, initialLocale } = useLoaderData();
  const actionData = useActionData();

  const [currentLocale, setCurrentLocale] = useState(
    actionData?.savedLocale || initialLocale || "en"
  );

  const activeDefaults = DEFAULT_TRANSLATIONS[currentLocale]?.values || DEFAULT_TRANSLATIONS.en.values;
  const activeCustom = savedTranslations[currentLocale] || {};

  return (
    <s-page heading="Language & Translations">
      <s-stack direction="block" gap="large">

        {/* Back Link to Settings */}
        <s-box>
          <s-link href="/app/settings">← Back to Settings</s-link>
        </s-box>

        {/* Introduction */}
        <s-section heading="Language Customizations">
          <s-box border="base" borderRadius="base" padding="base" background="subdued">
            <s-grid gap="small">
              <s-heading>Customize wording per language</s-heading>
              <s-paragraph>
                Tailor buttons, headings, and notification messages for each language your store supports.
                For example, you can keep <em>&quot;Add to cart&quot;</em> in English, but use a shorter <em>&quot;Añadir&quot;</em> in Spanish or <em>&quot;Ajouter&quot;</em> in French.
              </s-paragraph>
            </s-grid>
          </s-box>
        </s-section>

        {/* Language Switcher Tabs */}
        <s-section heading="Select language to edit">
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {Object.entries(DEFAULT_TRANSLATIONS).map(([code, lang]) => {
              const isSelected = currentLocale === code;
              const hasCustom = Object.keys(savedTranslations[code] || {}).length > 0;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrentLocale(code)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: isSelected ? "2px solid #008060" : "1px solid #c9cccf",
                    background: isSelected ? "#f1f8f5" : "#ffffff",
                    color: isSelected ? "#008060" : "#202223",
                    fontWeight: isSelected ? "600" : "400",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                  {hasCustom && (
                    <span
                      style={{
                        fontSize: "10px",
                        background: isSelected ? "#008060" : "#8c9196",
                        color: "#ffffff",
                        padding: "2px 6px",
                        borderRadius: "999px",
                      }}
                    >
                      Custom
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </s-section>

        {/* Form for selected language */}
        <Form method="post" key={currentLocale}>
          <input type="hidden" name="locale" value={currentLocale} />

          <s-stack direction="block" gap="large">

            {/* Buttons Section */}
            <s-section heading={`Buttons (${DEFAULT_TRANSLATIONS[currentLocale]?.name})`}>
              <s-box border="base" borderRadius="base" padding="base">
                <s-grid gap="base">
                  <s-text-field
                    label="Add to cart button label"
                    name="add_to_cart"
                    value={activeCustom.add_to_cart ?? activeDefaults.add_to_cart}
                    helpText={`Shown on the wishlist page. Default: "${activeDefaults.add_to_cart}"`}
                  />

                  <s-text-field
                    label="Add to wishlist button label (not saved)"
                    name="add_to_wishlist"
                    value={activeCustom.add_to_wishlist ?? activeDefaults.add_to_wishlist}
                    helpText={`Shown on product & collection cards. Default: "${activeDefaults.add_to_wishlist}"`}
                  />

                  <s-text-field
                    label="Saved button label"
                    name="saved"
                    value={activeCustom.saved ?? activeDefaults.saved}
                    helpText={`Shown when an item is already in the wishlist. Default: "${activeDefaults.saved}"`}
                  />

                  <s-text-field
                    label="Remove button label"
                    name="remove"
                    value={activeCustom.remove ?? activeDefaults.remove}
                    helpText={`Shown on each wishlist card. Default: "${activeDefaults.remove}"`}
                  />

                  <s-text-field
                    label="Share wishlist button label"
                    name="share_wishlist"
                    value={activeCustom.share_wishlist ?? activeDefaults.share_wishlist}
                    helpText={`Top header button on the wishlist page. Default: "${activeDefaults.share_wishlist}"`}
                  />

                  <s-text-field
                    label="Clear all button label"
                    name="clear_all"
                    value={activeCustom.clear_all ?? activeDefaults.clear_all}
                    helpText={`Clears all saved products. Default: "${activeDefaults.clear_all}"`}
                  />
                </s-grid>
              </s-box>
            </s-section>

            {/* Page Headings & Labels Section */}
            <s-section heading={`Headings & text (${DEFAULT_TRANSLATIONS[currentLocale]?.name})`}>
              <s-box border="base" borderRadius="base" padding="base">
                <s-grid gap="base">
                  <s-text-field
                    label="Wishlist page heading"
                    name="heading"
                    value={activeCustom.heading ?? activeDefaults.heading}
                    helpText={`Title at the top of the wishlist page. Default: "${activeDefaults.heading}"`}
                  />

                  <s-text-field
                    label="Empty wishlist message"
                    name="empty_message"
                    value={activeCustom.empty_message ?? activeDefaults.empty_message}
                    helpText={`Shown when customer has no saved items. Default: "${activeDefaults.empty_message}"`}
                  />

                  <s-text-field
                    label="Shared wishlist heading"
                    name="shared_wishlist_heading"
                    value={activeCustom.shared_wishlist_heading ?? activeDefaults.shared_wishlist_heading}
                    helpText={`Shown when viewing a friend's shared wishlist. Default: "${activeDefaults.shared_wishlist_heading}"`}
                  />

                  <s-text-field
                    label="Sold out label"
                    name="sold_out"
                    value={activeCustom.sold_out ?? activeDefaults.sold_out}
                    helpText={`Replaces Add to cart when variant is unavailable. Default: "${activeDefaults.sold_out}"`}
                  />
                </s-grid>
              </s-box>
            </s-section>

            {/* Popups & Notifications Section */}
            <s-section heading={`Notification messages (${DEFAULT_TRANSLATIONS[currentLocale]?.name})`}>
              <s-box border="base" borderRadius="base" padding="base">
                <s-grid gap="base">
                  <s-text-field
                    label="Item added to wishlist toast"
                    name="added_to_wishlist"
                    value={activeCustom.added_to_wishlist ?? activeDefaults.added_to_wishlist}
                    helpText={`Toast message on save. Default: "${activeDefaults.added_to_wishlist}"`}
                  />

                  <s-text-field
                    label="Item removed from wishlist toast"
                    name="removed_from_wishlist"
                    value={activeCustom.removed_from_wishlist ?? activeDefaults.removed_from_wishlist}
                    helpText={`Toast message on remove. Default: "${activeDefaults.removed_from_wishlist}"`}
                  />

                  <s-text-field
                    label="Wishlist cleared toast"
                    name="wishlist_cleared"
                    value={activeCustom.wishlist_cleared ?? activeDefaults.wishlist_cleared}
                    helpText={`Toast message on clear-all. Default: "${activeDefaults.wishlist_cleared}"`}
                  />

                  <s-text-field
                    label="Item added to cart toast"
                    name="added_to_cart"
                    value={activeCustom.added_to_cart ?? activeDefaults.added_to_cart}
                    helpText={`Toast message on add-to-cart. Default: "${activeDefaults.added_to_cart}"`}
                  />

                  <s-text-field
                    label="Link copied notification"
                    name="share_copied"
                    value={activeCustom.share_copied ?? activeDefaults.share_copied}
                    helpText={`Temporary button text on share click. Default: "${activeDefaults.share_copied}"`}
                  />
                </s-grid>
              </s-box>
            </s-section>

            {/* Save Feedback */}
            {actionData?.saved && actionData.savedLocale === currentLocale && (
              <s-banner tone="success" heading="Translations saved">
                Translations for {DEFAULT_TRANSLATIONS[currentLocale]?.name} have been updated successfully!
              </s-banner>
            )}

            {/* Submit Button */}
            <s-section>
              <s-button type="submit" variant="primary">
                Save {DEFAULT_TRANSLATIONS[currentLocale]?.name} translations
              </s-button>
            </s-section>

          </s-stack>
        </Form>

      </s-stack>
    </s-page>
  );
}

