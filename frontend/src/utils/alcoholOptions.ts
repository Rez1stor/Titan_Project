/**
 * Centralized option arrays for beer and wine selects.
 * Used by CatalogBrowse, AlcoholFinder, ProductFormComposition, and alcoholProfiles.
 * These serve as fallbacks when the API returns empty data.
 */

export type SelectOption = { label: string; value: string; hint?: string };

// ─── Beer ─────────────────────────────────────────────────────────────────────

export const BEER_STYLE_FAMILIES: SelectOption[] = [
  { label: 'Lager', value: 'Lager' },
  { label: 'Ale', value: 'Ale' },
  { label: 'Wheat', value: 'Wheat' },
  { label: 'Sour', value: 'Sour' },
  { label: 'Belgian', value: 'Belgian' },
];

export const BEER_CLASS_OPTIONS: SelectOption[] = [
  { label: 'Pale', value: 'Pale' },
  { label: 'Amber', value: 'Amber' },
  { label: 'Brown', value: 'Brown' },
  { label: 'Dark', value: 'Dark' },
];

/** Detailed beer styles (fallback when API is unavailable). */
export const FALLBACK_BEER_STYLE_OPTIONS: SelectOption[] = [
  { label: 'Pilsner', value: 'Pilsner' },
  { label: 'Helles', value: 'Helles' },
  { label: 'Dunkel', value: 'Dunkel' },
  { label: 'Bock', value: 'Bock' },
  { label: 'IPA', value: 'IPA' },
  { label: 'PaleAle', value: 'PaleAle' },
  { label: 'Stout', value: 'Stout' },
  { label: 'Porter', value: 'Porter' },
  { label: 'Saison', value: 'Saison' },
  { label: 'Witbier', value: 'Witbier' },
  { label: 'Hefeweizen', value: 'Hefeweizen' },
  { label: 'BerlinerWeisse', value: 'BerlinerWeisse' },
  { label: 'Gose', value: 'Gose' },
  { label: 'Lambic', value: 'Lambic' },
  { label: 'BelgianTripel', value: 'BelgianTripel' },
];

// ─── Wine ─────────────────────────────────────────────────────────────────────

export const WINE_STYLE_OPTIONS: SelectOption[] = [
  { label: 'Still', value: 'Still' },
  { label: 'Sparkling', value: 'Sparkling' },
  { label: 'Fortified', value: 'Fortified' },
  { label: 'Dessert', value: 'Dessert' },
  { label: 'Other', value: 'Other' },
];

/** Alias kept for fallback usage (same data). */
export const FALLBACK_WINE_STYLE_OPTIONS = WINE_STYLE_OPTIONS;

export const WINE_COLOR_OPTIONS: SelectOption[] = [
  { label: 'Red', value: 'Red' },
  { label: 'White', value: 'White' },
  { label: 'Rose', value: 'Rose' },
  { label: 'Orange', value: 'Orange' },
];

export const FALLBACK_WINE_COLOR_OPTIONS = WINE_COLOR_OPTIONS;

export const WINE_SWEETNESS_OPTIONS: SelectOption[] = [
  { label: 'Dry', value: 'Dry' },
  { label: 'Semi-dry', value: 'SemiDry' },
  { label: 'Semi-sweet', value: 'SemiSweet' },
  { label: 'Sweet', value: 'Sweet' },
  { label: 'Dessert', value: 'Dessert' },
  { label: 'Other', value: 'Other' },
];

export const FALLBACK_WINE_SWEETNESS_OPTIONS = WINE_SWEETNESS_OPTIONS;

export const WINE_AROMA_OPTIONS: SelectOption[] = [
  { label: 'Fruity', value: 'Fruity' },
  { label: 'Berry', value: 'Berry' },
  { label: 'Citrus', value: 'Citrus' },
  { label: 'Floral', value: 'Floral' },
  { label: 'Spicy', value: 'Spicy' },
  { label: 'Herbal', value: 'Herbal' },
  { label: 'Oak', value: 'Oak' },
  { label: 'Chocolate', value: 'Chocolate' },
  { label: 'Vanilla', value: 'Vanilla' },
  { label: 'Other', value: 'Other' },
];

export const FALLBACK_WINE_AROMA_OPTIONS = WINE_AROMA_OPTIONS;
