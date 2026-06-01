import { useEffect, useMemo, useState } from 'react';
import type { ProductFormDto } from '../types';
import { apiRoutes } from '../api/routes';
import { parseProductList } from '../utils/productApi';
import { apiFetch } from '../utils/api';

const NAME_SUGGESTION_LIMIT = 6;

type CatalogBeerSuggestionDto = {
  id: string;
  name: string;
  style?: string;
  abv?: number;
  ibu?: number;
  brewerName?: string;
  cbVerified?: boolean;
  source?: string;
  filledFields?: number;
};

type CatalogBeerAutofillResponse = {
  product?: ProductFormDto;
  missingFields?: string[];
};

type NameSuggestion = { id: string; name: string };

export default function useProductAutofill(
  name: string,
  onApply: (product: Partial<ProductFormDto>, missingFields: string[]) => void,
) {
  const [nameSuggestions, setNameSuggestions] = useState<NameSuggestion[]>([]);
  const [externalSuggestions, setExternalSuggestions] = useState<CatalogBeerSuggestionDto[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [autofillLoadingId, setAutofillLoadingId] = useState<string | null>(null);
  const [autofillMissingFields, setAutofillMissingFields] = useState<string[]>([]);
  const [nameSuggestionsOpen, setNameSuggestionsOpen] = useState(false);

  const normalizedName = name.trim().toLowerCase();

  const filteredNameSuggestions = useMemo(() => {
    if (normalizedName.length < 2) return [];

    return nameSuggestions
      .filter((item) => item.name.toLowerCase().includes(normalizedName))
      .filter((item) => item.name.toLowerCase() !== normalizedName)
      .slice(0, NAME_SUGGESTION_LIMIT);
  }, [nameSuggestions, normalizedName]);

  const exactNameExists = useMemo(() => {
    if (!normalizedName) return false;
    return nameSuggestions.some((item) => item.name.toLowerCase() === normalizedName);
  }, [nameSuggestions, normalizedName]);

  const hasAnySuggestions =
    nameSuggestionsOpen || filteredNameSuggestions.length > 0 || externalSuggestions.length > 0 || externalLoading;

  useEffect(() => {
    let active = true;

    const loadProductNames = async () => {
      try {
        const data = await apiFetch<unknown>(apiRoutes.products.list('page=1&pageSize=100'), { credentials: 'omit' });
        if (!active) return;

        const products = parseProductList<{ id?: number | string; name?: string }>(data).items;
        const uniqueNames = new Map<string, NameSuggestion>();

        for (const product of products) {
          const productName = String(product?.name ?? '').trim();
          if (!productName) continue;

          const key = productName.toLowerCase();
          if (!uniqueNames.has(key)) {
            uniqueNames.set(key, {
              id: String(product?.id ?? key),
              name: productName,
            });
          }
        }

        setNameSuggestions(Array.from(uniqueNames.values()).sort((left, right) => left.name.localeCompare(right.name)));
      } catch {
        if (active) setNameSuggestions([]);
      }
    };

    void loadProductNames();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const shouldCall = normalizedName.length >= 2 || nameSuggestionsOpen;
    if (!shouldCall) {
      setExternalSuggestions([]);
      setExternalLoading(false);
      return;
    }

    let active = true;
    if (nameSuggestionsOpen && normalizedName.length < 2) {
      setExternalLoading(true);
    }

    const timeoutId = window.setTimeout(async () => {
      setExternalLoading(true);
      try {
        const data = await apiFetch<CatalogBeerSuggestionDto[]>(
          apiRoutes.admin.catalogBeerSuggest(
            normalizedName.length >= 2 ? { q: name.trim(), count: 6 } : { count: 6 },
          ),
        );
        if (!active) return;
        setExternalSuggestions(Array.isArray(data) ? data : []);
      } catch {
        if (active) setExternalSuggestions([]);
      } finally {
        if (active) setExternalLoading(false);
      }
    }, 280);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [name, normalizedName, nameSuggestionsOpen]);

  const applyExternalAutofill = async (suggestion: CatalogBeerSuggestionDto) => {
    setAutofillLoadingId(suggestion.id);
    try {
      const data = await apiFetch<CatalogBeerAutofillResponse>(
        apiRoutes.admin.catalogBeerDetails(suggestion.id),
      );
      onApply(data?.product ?? {}, Array.isArray(data?.missingFields) ? data.missingFields : []);
      setAutofillMissingFields(Array.isArray(data?.missingFields) ? data.missingFields : []);
      setNameSuggestionsOpen(false);
    } catch {
      alert('Failed to apply auto-fill from external catalog.');
    } finally {
      setAutofillLoadingId(null);
    }
  };

  const clearAutofillMissingFields = () => setAutofillMissingFields([]);

  return {
    nameSuggestionsOpen,
    setNameSuggestionsOpen,
    filteredNameSuggestions,
    externalSuggestions,
    externalLoading,
    autofillLoadingId,
    autofillMissingFields,
    setAutofillMissingFields,
    clearAutofillMissingFields,
    exactNameExists,
    hasAnySuggestions,
    normalizedName,
    applyExternalAutofill,
  };
}

export type { CatalogBeerSuggestionDto };
