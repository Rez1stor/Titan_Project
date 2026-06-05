import {
  BeerStyleFamilyOptions,
  BeerColorOptions,
  BeerStyleOptions,
  WineStyleOptions,
  WineColorOptions,
  WineSweetnessOptions,
  WineAromaOptions
} from '../types/generatedEnums';

/**
 * Centralized option arrays for beer and wine selects.
 * Used by CatalogBrowse, AlcoholFinder, ProductFormComposition, and alcoholProfiles.
 * These serve as fallbacks when the API returns empty data.
 */

export type SelectOption = { label: string; value: string; hint?: string };

const toSelectOption = (value: string): SelectOption => {
  // Add spaces before capital letters for a nicer label (e.g. PaleAle -> Pale Ale)
  const label = value.replace(/([a-z])([A-Z])/g, '$1 $2');
  return { label, value };
};

// ─── Beer ─────────────────────────────────────────────────────────────────────

export const BEER_STYLE_FAMILIES: SelectOption[] = BeerStyleFamilyOptions.map(toSelectOption);

export const BEER_CLASS_OPTIONS: SelectOption[] = BeerColorOptions.map(toSelectOption);

/** Detailed beer styles (fallback when API is unavailable). */
export const FALLBACK_BEER_STYLE_OPTIONS: SelectOption[] = BeerStyleOptions.map(toSelectOption);

// ─── Wine ─────────────────────────────────────────────────────────────────────

export const WINE_STYLE_OPTIONS: SelectOption[] = WineStyleOptions.map(toSelectOption);

/** Alias kept for fallback usage (same data). */
export const FALLBACK_WINE_STYLE_OPTIONS = WINE_STYLE_OPTIONS;

export const WINE_COLOR_OPTIONS: SelectOption[] = WineColorOptions.map(toSelectOption);

export const FALLBACK_WINE_COLOR_OPTIONS = WINE_COLOR_OPTIONS;

export const WINE_SWEETNESS_OPTIONS: SelectOption[] = WineSweetnessOptions.map(toSelectOption);

export const FALLBACK_WINE_SWEETNESS_OPTIONS = WINE_SWEETNESS_OPTIONS;

export const WINE_AROMA_OPTIONS: SelectOption[] = WineAromaOptions.map(toSelectOption);

export const FALLBACK_WINE_AROMA_OPTIONS = WINE_AROMA_OPTIONS;
