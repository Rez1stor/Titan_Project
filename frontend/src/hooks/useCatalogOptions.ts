import { useEffect, useMemo, useState } from 'react';
import { apiRoutes } from '../api/routes';
import type { BeerStyleFamilyEntry } from '../types';
import {
  FALLBACK_BEER_STYLE_OPTIONS,
  FALLBACK_WINE_AROMA_OPTIONS,
  FALLBACK_WINE_COLOR_OPTIONS,
  FALLBACK_WINE_STYLE_OPTIONS,
  FALLBACK_WINE_SWEETNESS_OPTIONS,
  type SelectOption,
} from '../utils/alcoholOptions';
import { fetchBeerFamilies, fetchWineCatalogEntries } from '../utils/catalogApi';

type CatalogEntry = { code?: string; name?: string; styles?: Array<{ code?: string }> };

function mapCatalogEntries(entries: unknown, labelKey: 'code' | 'name' = 'code'): SelectOption[] {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry: CatalogEntry) => ({
    label: String(entry[labelKey] ?? entry.code ?? entry),
    value: String(entry.code ?? entry.name ?? entry),
  }));
}

export default function useCatalogOptions(beerFamily: string) {
  const [beerStyleOptionsFromApi, setBeerStyleOptionsFromApi] = useState<SelectOption[]>([]);
  const [beerFamiliesFromApi, setBeerFamiliesFromApi] = useState<BeerStyleFamilyEntry[]>([]);
  const [beerFamilyOptionsFromApi, setBeerFamilyOptionsFromApi] = useState<SelectOption[]>([]);
  const [wineStyleOptionsFromApi, setWineStyleOptionsFromApi] = useState<SelectOption[]>([]);
  const [wineColorOptionsFromApi, setWineColorOptionsFromApi] = useState<SelectOption[]>([]);
  const [wineSweetnessOptionsFromApi, setWineSweetnessOptionsFromApi] = useState<SelectOption[]>([]);
  const [wineAromaOptionsFromApi, setWineAromaOptionsFromApi] = useState<SelectOption[]>([]);
  const [catalogsLoading, setCatalogsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadCatalogs = async () => {
      try {
        const [beerFamiliesList, wineStyles, wineColors, wineSweetness, wineAromas] = await Promise.all([
          fetchBeerFamilies(),
          fetchWineCatalogEntries(apiRoutes.wineCatalog.styles),
          fetchWineCatalogEntries(apiRoutes.wineCatalog.colors),
          fetchWineCatalogEntries(apiRoutes.wineCatalog.sweetness),
          fetchWineCatalogEntries(apiRoutes.wineCatalog.aromas),
        ]);

        if (!active) return;

        const beerStylesOpts = beerFamiliesList.flatMap((family) =>
          Array.isArray(family.styles)
            ? family.styles.map((style) => ({ label: style.code, value: style.code }))
            : [],
        );
        const beerFamilyOpts = beerFamiliesList.map((family) => ({
          label: family.description ?? family.code,
          value: family.code,
        }));

        setBeerStyleOptionsFromApi(beerStylesOpts.length > 0 ? beerStylesOpts : FALLBACK_BEER_STYLE_OPTIONS);
        setBeerFamiliesFromApi(beerFamiliesList);
        setBeerFamilyOptionsFromApi(beerFamilyOpts.length > 0 ? beerFamilyOpts : []);
        setWineStyleOptionsFromApi(
          mapCatalogEntries(wineStyles).length > 0 ? mapCatalogEntries(wineStyles) : FALLBACK_WINE_STYLE_OPTIONS,
        );
        setWineColorOptionsFromApi(
          mapCatalogEntries(wineColors).length > 0 ? mapCatalogEntries(wineColors) : FALLBACK_WINE_COLOR_OPTIONS,
        );
        setWineSweetnessOptionsFromApi(
          mapCatalogEntries(wineSweetness).length > 0 ? mapCatalogEntries(wineSweetness) : FALLBACK_WINE_SWEETNESS_OPTIONS,
        );
        setWineAromaOptionsFromApi(
          mapCatalogEntries(wineAromas).length > 0 ? mapCatalogEntries(wineAromas) : FALLBACK_WINE_AROMA_OPTIONS,
        );
      } finally {
        if (active) setCatalogsLoading(false);
      }
    };

    void loadCatalogs();

    return () => {
      active = false;
    };
  }, []);

  const visibleBeerStyleOptions = useMemo(() => {
    if (!beerFamily) return beerStyleOptionsFromApi;
    const family = beerFamiliesFromApi.find((entry) => entry.code === beerFamily);
    if (!family || !Array.isArray(family.styles)) return [];
    return family.styles.map((style) => ({ label: style.code, value: style.code }));
  }, [beerFamily, beerFamiliesFromApi, beerStyleOptionsFromApi]);

  const resolveFamilyForStyle = (style: string): string | null => {
    const found = beerFamiliesFromApi.find(
      (family) => Array.isArray(family.styles) && family.styles.some((entry) => entry.code === style),
    );
    return found?.code ?? null;
  };

  return {
    beerFamiliesFromApi,
    beerFamilyOptionsFromApi,
    beerStyleOptionsFromApi,
    wineStyleOptionsFromApi,
    wineColorOptionsFromApi,
    wineSweetnessOptionsFromApi,
    wineAromaOptionsFromApi,
    visibleBeerStyleOptions,
    catalogsLoading,
    resolveFamilyForStyle,
  };
}
