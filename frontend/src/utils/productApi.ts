export type ProductListResponse<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ProductQueryOptions = {
  category?: string;
  priceBand?: string;
  search?: string;
  country?: string;
  beerStyle?: string;
  beerColor?: string;
  maxIbu?: number;
  maxSrm?: number;
  wineStyle?: string;
  wineColor?: string;
  wineSweetness?: string;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
};

export function parseProductList<T>(payload: unknown): ProductListResponse<T> {
  if (Array.isArray(payload)) {
    return {
      items: payload as T[],
      totalCount: payload.length,
      page: 1,
      pageSize: payload.length,
      totalPages: 1,
    };
  }

  const data = payload as Partial<ProductListResponse<T>> & { value?: T[] };
  const items = data.items ?? data.value ?? [];

  return {
    items,
    totalCount: data.totalCount ?? items.length,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? items.length,
    totalPages: data.totalPages ?? 1,
  };
}

export function buildProductsApiQuery(options: ProductQueryOptions) {
  const params = new URLSearchParams();

  if (options.category && options.category !== 'All') {
    params.set('category', options.category);
  }

  if (options.priceBand && options.priceBand !== 'Any') {
    params.set('priceBand', options.priceBand);
  }

  if (options.search?.trim()) {
    params.set('search', options.search.trim());
  }

  if (options.country?.trim()) {
    params.set('country', options.country.trim());
  }

  if (options.beerStyle?.trim()) {
    params.set('beerStyle', options.beerStyle.trim());
  }

  if (options.beerColor?.trim()) {
    params.set('beerColor', options.beerColor.trim());
  }

  if (options.maxIbu !== undefined) {
    params.set('maxIbu', String(options.maxIbu));
  }

  if (options.maxSrm !== undefined) {
    params.set('maxSrm', String(options.maxSrm));
  }

  if (options.wineStyle?.trim()) {
    params.set('wineStyle', options.wineStyle.trim());
  }

  if (options.wineColor?.trim()) {
    params.set('wineColor', options.wineColor.trim());
  }

  if (options.wineSweetness?.trim()) {
    params.set('wineSweetness', options.wineSweetness.trim());
  }

  if (options.sortBy) {
    params.set('sortBy', options.sortBy);
  }

  if (options.sortDir) {
    params.set('sortDir', options.sortDir);
  }

  params.set('page', String(options.page ?? 1));
  params.set('pageSize', String(options.pageSize ?? 20));

  return params.toString();
}
