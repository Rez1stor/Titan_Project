import { apiRoutes } from '../api/routes';
import type { BeerCatalogResponse, BeerStyleFamilyEntry, WineCatalogResponse } from '../types';
import { apiFetch } from './api';

export async function fetchBeerFamilies(): Promise<BeerStyleFamilyEntry[]> {
  try {
    const data = await apiFetch<BeerStyleFamilyEntry[]>(apiRoutes.beerCatalog.families, {
      credentials: 'omit',
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchBeerCatalogLabels(): Promise<BeerCatalogResponse> {
  try {
    const [families, colors] = await Promise.all([
      apiFetch<BeerCatalogResponse['families']>(apiRoutes.beerCatalog.families, { credentials: 'omit' }),
      apiFetch<BeerCatalogResponse['colors']>(apiRoutes.beerCatalog.colors, { credentials: 'omit' }),
    ]);
    return {
      families: Array.isArray(families) ? families : [],
      colors: Array.isArray(colors) ? colors : [],
    };
  } catch {
    return { families: [], colors: [] };
  }
}

export async function fetchWineCatalogLabels(): Promise<WineCatalogResponse> {
  try {
    const [styles, colors] = await Promise.all([
      apiFetch<WineCatalogResponse['styles']>(apiRoutes.wineCatalog.styles, { credentials: 'omit' }),
      apiFetch<WineCatalogResponse['colors']>(apiRoutes.wineCatalog.colors, { credentials: 'omit' }),
    ]);
    return {
      styles: Array.isArray(styles) ? styles : [],
      colors: Array.isArray(colors) ? colors : [],
    };
  } catch {
    return { styles: [], colors: [] };
  }
}

export async function fetchWineCatalogEntries(endpoint: string): Promise<unknown[]> {
  try {
    const data = await apiFetch<unknown[]>(endpoint, { credentials: 'omit' });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
