import { AlcoholCategoryOptions } from '../types/generatedEnums';

export type AlcoholCategory = 'All' | typeof AlcoholCategoryOptions[number];
export type PriceBand = 'Any' | 'Budget' | 'Classic' | 'Premium' | 'Luxury';

export type AlcoholProfile = {
  categories: AlcoholCategory[];
  primaryChoices: string[];
  secondaryChoices: string[];
  color: number;
  bitterness: number;
  strength: number;
  priceBands: PriceBand[];
};

export type ProductLike = {
  id: number | string;
  name: string;
  categoryName: string;
  description?: string;
  avgRating?: number | string;
  reviewsCount?: number;
  basePrice?: number;
  strengthAbv?: number;
  beerStyle?: string;
  wineStyle?: string;
  beerColor?: string;
  wineColor?: string;
};

export type ControlOption = { label: string; value: string };

export type CategoryControl =
  | {
      kind: 'select';
      id: string;
      label: string;
      valueKey: 'primaryChoices' | 'secondaryChoices' | 'priceBands';
      options: ControlOption[];
      helperText?: string;
    }
  | {
      kind: 'range';
      id: string;
      label: string;
      valueKey: 'color' | 'bitterness' | 'strength';
      min: number;
      max: number;
      step?: number;
      leftLabel: string;
      rightLabel: string;
      marks: Array<{ label: string; value: number }>;
      valueSuffix?: string;
      helperText?: string;
    };

export type CategoryDefinition = {
  id: AlcoholCategory;
  title: string;
  description: string;
  controls: CategoryControl[];
  supported: boolean;
};

export const STORAGE_KEY = 'titan-alcohol-profile';

export const alcoholCategories: AlcoholCategory[] = ['All', ...AlcoholCategoryOptions];

export const priceBands: Array<{ label: string; value: PriceBand; hint: string }> = [
  { label: 'Any', value: 'Any', hint: 'show everything' },
  { label: 'Budget', value: 'Budget', hint: 'up to 25 PLN' },
  { label: 'Classic', value: 'Classic', hint: '26-40 PLN' },
  { label: 'Premium', value: 'Premium', hint: '41-70 PLN' },
  { label: 'Luxury', value: 'Luxury', hint: '70+ PLN' },
];

export const defaultAlcoholProfile: AlcoholProfile = {
  categories: ['All'],
  primaryChoices: [],
  secondaryChoices: [],
  color: 22,
  bitterness: 40,
  strength: 5,
  priceBands: ['Any'],
};

import {
  BEER_CLASS_OPTIONS,
  BEER_STYLE_FAMILIES,
  WINE_COLOR_OPTIONS,
  WINE_STYLE_OPTIONS,
} from './alcoholOptions';

export const categoryDefinitions: Record<AlcoholCategory, CategoryDefinition> = {
  All: {
    id: 'All',
    title: 'All alcohol',
    description: 'Filter across the full catalog and keep category-specific controls hidden until they matter.',
    supported: true,
    controls: [],
  },
  Beer: {
    id: 'Beer',
    title: 'Beer',
    description: 'Beer-specific controls: style family, class, SRM and IBU.',
    supported: true,
    controls: [
      {
        kind: 'select',
        id: 'primaryChoice',
        label: 'Style family',
        valueKey: 'primaryChoices',
        options: BEER_STYLE_FAMILIES,
        helperText: 'Choose the beer family first.',
      },
      {
        kind: 'select',
        id: 'secondaryChoice',
        label: 'Class',
        valueKey: 'secondaryChoices',
        options: BEER_CLASS_OPTIONS,
        helperText: 'Pick the color class you want to see.',
      },
      {
        kind: 'range',
        id: 'color',
        label: 'SRM',
        valueKey: 'color',
        min: 0,
        max: 100,
        step: 1,
        leftLabel: 'Pale',
        rightLabel: 'Dark',
        marks: [
          { label: 'Pale', value: 12 },
          { label: 'Amber', value: 38 },
          { label: 'Brown', value: 65 },
          { label: 'Dark', value: 88 },
        ],
        helperText: 'Beer color and body.',
      },
      {
        kind: 'range',
        id: 'bitterness',
        label: 'IBU',
        valueKey: 'bitterness',
        min: 0,
        max: 100,
        step: 1,
        leftLabel: 'Smooth',
        rightLabel: 'Bitter',
        marks: [
          { label: 'Low', value: 15 },
          { label: 'Mid', value: 50 },
          { label: 'High', value: 85 },
        ],
        helperText: 'Beer bitterness only.',
      },
    ],
  },
  Wine: {
    id: 'Wine',
    title: 'Wine',
    description: 'Wine-specific controls: style, color and sweetness.',
    supported: true,
    controls: [
      {
        kind: 'select',
        id: 'primaryChoice',
        label: 'Style',
        valueKey: 'primaryChoices',
        options: WINE_STYLE_OPTIONS,
        helperText: 'Pick the wine style.',
      },
      {
        kind: 'select',
        id: 'secondaryChoice',
        label: 'Color',
        valueKey: 'secondaryChoices',
        options: WINE_COLOR_OPTIONS,
        helperText: 'Pick the wine color.',
      },
      {
        kind: 'range',
        id: 'strength',
        label: 'Sweetness',
        valueKey: 'strength',
        min: 0,
        max: 100,
        step: 1,
        leftLabel: 'Dry',
        rightLabel: 'Sweet',
        marks: [
          { label: 'Dry', value: 20 },
          { label: 'Balanced', value: 50 },
          { label: 'Sweet', value: 80 },
        ],
        helperText: 'Choose wine sweetness direction.',
      },
    ],
  },
};

export const categoryOrder: AlcoholCategory[] = ['Beer', 'Wine'];

export function getCategoryDefinition(category: AlcoholCategory) {
  return categoryDefinitions[category];
}

export function describeProfile(profile: AlcoholProfile) {
  const cats = profile.categories.length ? profile.categories.join(', ') : 'All';
  const prices = profile.priceBands.length ? profile.priceBands.join(', ') : 'Any';
  const prims = profile.primaryChoices.length ? profile.primaryChoices.join(', ') : 'any style';
  const secs = profile.secondaryChoices.length ? profile.secondaryChoices.join(', ') : 'any class';
  return `${cats} • ${prices} • ${prims} • ${secs}`;
}

export function isSupportedCategory(category: AlcoholCategory) {
  return categoryDefinitions[category].supported;
}

export function normalizeCategoryName(value?: string | null): AlcoholCategory | null {
  const normalized = (value ?? '').trim().toLowerCase();

  if (normalized === 'beer') return 'Beer';
  if (normalized === 'wine') return 'Wine';
  if (normalized === 'all') return 'All';
  return null;
}

export function matchesCategory(product: ProductLike, categories: AlcoholCategory[]) {
  if (categories.length === 0 || categories.includes('All')) {
    return true;
  }

  return categories.some((c) => product.categoryName.toLowerCase() === c.toLowerCase());
}

export function matchesPrice(price: number | undefined, bands: PriceBand[]) {
  if (bands.length === 0 || bands.includes('Any') || price === undefined || price === null) {
    return true;
  }

  return bands.some((band) => {
    if (band === 'Budget') return price <= 25;
    if (band === 'Classic') return price > 25 && price <= 40;
    if (band === 'Premium') return price > 40 && price <= 70;
    return price > 70;
  });
}

export function matchesTaste(product: ProductLike, profile: AlcoholProfile) {
  const metrics = getProductMetrics(product);
  const category = product.categoryName.toLowerCase();
  const detailMatch = matchesCategoryDetail(product, profile, category);

  return (
    detailMatch &&
    Math.abs(metrics.color - profile.color) <= 30 &&
    Math.abs(metrics.bitterness - profile.bitterness) <= 32 &&
    Math.abs(metrics.strength - profile.strength) <= 3.5
  );
}

export function scoreProduct(product: ProductLike, profile: AlcoholProfile) {
  const metrics = getProductMetrics(product);
  const categoryBonus = matchesCategory(product, profile.categories) ? 60 : 0;
  const priceScore = profile.priceBands.includes('Any') ? 15 : matchesPrice(product.basePrice, profile.priceBands) ? 30 : -20;
  const detailBonus = matchesTasteDetail(product, profile) ? 20 : -15;

  return (
    categoryBonus +
    priceScore +
    detailBonus -
    Math.abs(metrics.color - profile.color) -
    Math.abs(metrics.bitterness - profile.bitterness) -
    Math.abs(metrics.strength - profile.strength) * 4
  );
}

export function getProductMetrics(product: ProductLike) {
  const text = `${product.name ?? ''} ${product.description ?? ''} ${product.beerStyle ?? ''} ${product.wineStyle ?? ''} ${product.beerColor ?? ''} ${product.wineColor ?? ''}`.toLowerCase();

  const color = getColorScore(text);
  const bitterness = getBitternessScore(text);
  const strength = typeof product.strengthAbv === 'number' ? product.strengthAbv : color / 20 + (bitterness / 30);

  return { color, bitterness, strength };
}

function matchesCategoryDetail(product: ProductLike, profile: AlcoholProfile, category: string) {
  if (category === 'beer') {
    const text = `${product.beerStyle ?? ''} ${product.name ?? ''} ${product.beerColor ?? ''}`.toLowerCase();
    const primary = profile.primaryChoices.length > 0 ? profile.primaryChoices.some((c) => text.includes(c.toLowerCase())) : true;
    const secondary = profile.secondaryChoices.length > 0 ? profile.secondaryChoices.some((c) => text.includes(c.toLowerCase())) : true;
    return primary && secondary;
  }

  if (category === 'wine') {
    const text = `${product.wineStyle ?? ''} ${product.name ?? ''} ${product.wineColor ?? ''}`.toLowerCase();
    const primary = profile.primaryChoices.length > 0 ? profile.primaryChoices.some((c) => text.includes(c.toLowerCase())) : true;
    const secondary = profile.secondaryChoices.length > 0 ? profile.secondaryChoices.some((c) => text.includes(c.toLowerCase())) : true;
    return primary && secondary;
  }

  return true;
}

function matchesTasteDetail(product: ProductLike, profile: AlcoholProfile) {
  const category = product.categoryName.toLowerCase();
  if (category === 'beer') {
    const text = `${product.beerStyle ?? ''} ${product.beerColor ?? ''}`.toLowerCase();
    return (profile.primaryChoices.length === 0 || profile.primaryChoices.some((c) => text.includes(c.toLowerCase()))) && 
           (profile.secondaryChoices.length === 0 || profile.secondaryChoices.some((c) => text.includes(c.toLowerCase())));
  }

  if (category === 'wine') {
    const text = `${product.wineStyle ?? ''} ${product.wineColor ?? ''}`.toLowerCase();
    return (profile.primaryChoices.length === 0 || profile.primaryChoices.some((c) => text.includes(c.toLowerCase()))) && 
           (profile.secondaryChoices.length === 0 || profile.secondaryChoices.some((c) => text.includes(c.toLowerCase())));
  }

  return true;
}

function getColorScore(text: string) {
  if (text.includes('dark') || text.includes('stout') || text.includes('porter')) return 90;
  if (text.includes('brown') || text.includes('dunkel') || text.includes('bock')) return 70;
  if (text.includes('amber') || text.includes('ale') || text.includes('ipa')) return 45;
  if (text.includes('wine')) return 28;
  return 18;
}

function getBitternessScore(text: string) {
  if (text.includes('ipa')) return 88;
  if (text.includes('sour') || text.includes('gose') || text.includes('berliner')) return 14;
  if (text.includes('stout') || text.includes('porter')) return 42;
  if (text.includes('pilsner') || text.includes('pale ale')) return 52;
  if (text.includes('wine')) return 20;
  return 30;
}
