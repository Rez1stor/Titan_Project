/** Centralized API route paths (ASP.NET routes are case-insensitive). */

export const apiRoutes = {
  auth: {
    me: '/api/auth/me',
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
  },
  products: {
    list: (query?: string) => `/api/products${query ? `?${query}` : ''}`,
    byId: (id: number | string) => `/api/products/${id}`,
    byName: (name: string) => `/api/products/by-name/${encodeURIComponent(name)}`,
  },
  admin: {
    products: '/api/admin/products',
    productById: (id: number | string) => `/api/admin/products/${id}`,
    catalogBeerSuggest: (params?: { q?: string; count?: number }) => {
      const search = new URLSearchParams();
      if (params?.q?.trim()) search.set('q', params.q.trim());
      search.set('count', String(params?.count ?? 6));
      return `/api/admin/catalog-beer/suggest?${search}`;
    },
    catalogBeerDetails: (externalId: string) =>
      `/api/admin/catalog-beer/details/${encodeURIComponent(externalId)}`,
  },
  favorites: {
    list: '/api/favorites',
    byProductId: (productId: number | string) => `/api/favorites/${productId}`,
  },
  reviews: {
    list: '/api/reviews',
    byProductId: (productId: number | string) => `/api/reviews/product/${productId}`,
    byId: (reviewId: number | string) => `/api/reviews/${reviewId}`,
  },
  recommendations: {
    forProduct: (productId: number | string) => `/api/recommendations/${productId}`,
    forUser: '/api/recommendations/for-user',
  },
  library: '/api/library',
  users: {
    byId: (userId: number | string) => `/api/users/${userId}`,
  },
  beerCatalog: {
    families: '/api/beer-catalog/families',
    colors: '/api/beer-catalog/colors',
  },
  wineCatalog: {
    styles: '/api/wine-catalog/styles',
    colors: '/api/wine-catalog/colors',
    sweetness: '/api/wine-catalog/sweetness',
    aromas: '/api/wine-catalog/aromas',
  },
} as const;

export const AUTH_CHANGED_EVENT = 'auth-changed';

export function notifyAuthChanged() {
  try {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch {
    // ignore in non-browser environments
  }
}
