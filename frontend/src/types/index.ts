// ─── Auth ─────────────────────────────────────────────────────────────────────

export type AuthUserDto = {
  userId: number;
  username: string;
  email: string;
  country?: string | null;
  role?: string | null;
};

// ─── Products ─────────────────────────────────────────────────────────────────

/** Lightweight DTO used in card listings and recommendations. */
export type ProductDto = {
  id: number | string;
  name: string;
  categoryName: string;
  description?: string;
  imageUrl?: string | null;
  avgRating?: number | string;
  reviewsCount?: number;
  basePrice?: number;
  strengthAbv?: number;
  beerStyle?: string;
  wineStyle?: string;
  beerColor?: string;
  wineColor?: string;
  wineSweetness?: string;
  wineAromas?: string[];
  beerIbu?: number;
  beerSrm?: number;
  similarityScore?: number;
};

/** Extended DTO used in the product detail view. */
export type ProductDetailsDto = ProductDto & {
  country?: string;
  avgRating?: number;
};

/** DTO used by the product create/edit form. */
export type ProductFormDto = {
  id?: number | string;
  name?: string;
  categoryName?: string;
  description?: string;
  imageUrl?: string | null;
  imageFile?: File | null;
  basePrice?: number;
  strengthAbv?: number;
  country?: string;
  beerStyle?: string;
  wineStyle?: string;
  beerColor?: string;
  wineColor?: string;
  wineSweetness?: string;
  wineAromas?: string[];
  beerIbu?: number;
  beerSrm?: number;
  beerStyleFamily?: string;
};

// ─── Catalog API types ────────────────────────────────────────────────────────

export type BeerStyleEntry = { code: string; description: string };
export type BeerColorEntry = { code: string; description: string };
export type BeerStyleFamilyEntry = {
  code: string;
  description?: string;
  styles: BeerStyleEntry[];
};
export type WineStyleEntry = { code: string; description: string };
export type WineColorEntry = { code: string; description: string };

export type BeerCatalogResponse = {
  families: BeerStyleFamilyEntry[];
  colors: BeerColorEntry[];
};

export type WineCatalogResponse = {
  styles: WineStyleEntry[];
  colors: WineColorEntry[];
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export type ReviewDto = {
  id: number | string;
  userId?: number;
  username?: string;
  comment?: string;
  createdAt: string;
  rating: number | string;
};

export type ReviewFeedback = {
  kind: 'success' | 'error';
  message: string;
} | null;

// ─── Favorites ────────────────────────────────────────────────────────────────

export type FavoriteDto = {
  id: number | string;
};

// ─── Recommendations / library ────────────────────────────────────────────────

export type UserPreferences = {
  targetAbv?: number | null;
  abvTolerance?: number | null;
  maxPrice?: number | null;
  preferredTags?: string[];
};

export type LibraryResponse = {
  favorites?: ProductDto[];
  preferences?: UserPreferences;
};

// ─── Users ────────────────────────────────────────────────────────────────────

export type PublicUserProfileDto = {
  userId: number;
  username: string;
  email: string;
  country?: string | null;
  role?: string | null;
  createdAt?: string;
  reviewsCount?: number;
};

// ─── Roles ────────────────────────────────────────────────────────────────────

export const ADMIN_ROLES = ['Admin', 'Moderator'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role?: string | null): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}
