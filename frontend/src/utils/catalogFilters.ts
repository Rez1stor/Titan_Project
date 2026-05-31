export type CatalogCategory = 'All' | 'Beer' | 'Wine' | 'Other';

export type PriceBand = 'Any' | 'Budget' | 'Classic' | 'Premium' | 'Luxury';

export const alcoholTypeOptions: Array<{ label: string; value: Exclude<CatalogCategory, 'All'> }> = [
  { label: 'Beer', value: 'Beer' },
  { label: 'Wine', value: 'Wine' },
  { label: 'Other', value: 'Other' },
];

export const priceBandOptions: Array<{ label: string; value: PriceBand; hint: string }> = [
  { label: 'Any', value: 'Any', hint: 'show everything' },
  { label: 'Budget', value: 'Budget', hint: 'below the category average' },
  { label: 'Classic', value: 'Classic', hint: 'close to the category average' },
  { label: 'Premium', value: 'Premium', hint: 'above the category average' },
  { label: 'Luxury', value: 'Luxury', hint: 'top tier by category average' },
];

export function normalizeCatalogCategory(value?: string | null): CatalogCategory {
  const normalized = (value ?? '').trim().toLowerCase();

  if (normalized === 'beer') return 'Beer';
  if (normalized === 'wine') return 'Wine';
  if (normalized === 'other') return 'Other';
  return 'All';
}

export function normalizePriceBand(value?: string | null): PriceBand {
  const normalized = (value ?? '').trim().toLowerCase();

  if (normalized === 'budget') return 'Budget';
  if (normalized === 'classic') return 'Classic';
  if (normalized === 'premium') return 'Premium';
  if (normalized === 'luxury') return 'Luxury';
  return 'Any';
}

export function buildCatalogQuery(category: CatalogCategory, priceBand: PriceBand) {
  const params = new URLSearchParams();

  if (category !== 'All') {
    params.set('type', category);
  }

  if (priceBand !== 'Any') {
    params.set('price', priceBand);
  }

  return params.toString();
}

export function getCategoryAveragePrice(products: Array<{ categoryName?: string; basePrice?: number | null }>, category: CatalogCategory) {
  const relevantProducts = category === 'All'
    ? products
    : products.filter((product) => (product.categoryName ?? '').toLowerCase() === category.toLowerCase());

  const prices = relevantProducts
    .map((product) => Number(product.basePrice ?? 0))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (prices.length === 0) {
    return 0;
  }

  return prices.reduce((total, price) => total + price, 0) / prices.length;
}

export function getPriceBandForProduct(price: number | null | undefined, categoryAverage: number): PriceBand {
  if (price === null || price === undefined || categoryAverage <= 0) {
    return 'Any';
  }

  const ratio = price / categoryAverage;

  if (ratio < 0.85) return 'Budget';
  if (ratio <= 1.05) return 'Classic';
  if (ratio <= 1.3) return 'Premium';
  return 'Luxury';
}

export function matchesPriceBand(price: number | null | undefined, categoryAverage: number, selectedBand: PriceBand) {
  if (selectedBand === 'Any') {
    return true;
  }

  return getPriceBandForProduct(price, categoryAverage) === selectedBand;
}
