import React from 'react';
import { ChevronDown, WandSparkles, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import SelectField from './alcohol/SelectField';
import RangeField from './alcohol/RangeField';
import useTypeToSearch from '../hooks/useTypeToSearch';
import { alcoholTypeOptions } from '../utils/catalogFilters';
import { countries } from '../utils/countries';

const FALLBACK_BEER_STYLE_OPTIONS: Array<{ label: string; value: string }> = [
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

const FALLBACK_BEER_COLOR_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Pale', value: 'Pale' },
  { label: 'Amber', value: 'Amber' },
  { label: 'Brown', value: 'Brown' },
  { label: 'Dark', value: 'Dark' },
];

const FALLBACK_WINE_STYLE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Still', value: 'Still' },
  { label: 'Sparkling', value: 'Sparkling' },
  { label: 'Fortified', value: 'Fortified' },
  { label: 'Dessert', value: 'Dessert' },
];

const FALLBACK_WINE_COLOR_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Red', value: 'Red' },
  { label: 'White', value: 'White' },
  { label: 'Rose', value: 'Rose' },
  { label: 'Orange', value: 'Orange' },
];

const FALLBACK_WINE_SWEETNESS_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Dry', value: 'Dry' },
  { label: 'SemiDry', value: 'SemiDry' },
  { label: 'SemiSweet', value: 'SemiSweet' },
  { label: 'Sweet', value: 'Sweet' },
];

const FALLBACK_WINE_AROMA_OPTIONS: Array<{ label: string; value: string }> = [
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

export type ProductDto = {
  id?: number | string;
  name?: string;
  categoryName?: string;
  description?: string;
  imageUrl?: string | null;
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
};

type CatalogBeerSuggestionDto = {
  id: string;
  name: string;
  style?: string;
  abv?: number;
  ibu?: number;
  brewerName?: string;
  cbVerified?: boolean;
  source?: string;
};

type CatalogBeerAutofillResponse = {
  product?: ProductDto;
  missingFields?: string[];
};

export default function ProductForm({
  initial = {},
  onSubmit,
  submitting = false,
}: {
  initial?: ProductDto;
  onSubmit: (payload: ProductDto) => Promise<void> | void;
  submitting?: boolean;
}) {
  const [name, setName] = React.useState(initial.name ?? '');
  const [nameSuggestions, setNameSuggestions] = React.useState<Array<{ id: string; name: string }>>([]);
  const [externalSuggestions, setExternalSuggestions] = React.useState<CatalogBeerSuggestionDto[]>([]);
  const [externalLoading, setExternalLoading] = React.useState(false);
  const [autofillLoadingId, setAutofillLoadingId] = React.useState<string | null>(null);
  const [autofillMissingFields, setAutofillMissingFields] = React.useState<string[]>([]);
  const [nameSuggestionsOpen, setNameSuggestionsOpen] = React.useState(false);
  const [category, setCategory] = React.useState(initial.categoryName && initial.categoryName !== 'All' ? initial.categoryName : 'Beer');
  const [description, setDescription] = React.useState(initial.description ?? '');
  const [basePrice, setBasePrice] = React.useState<number>(initial.basePrice ?? 0);
  const [strengthAbv, setStrengthAbv] = React.useState<number>(initial.strengthAbv ?? 0);
  const [country, setCountry] = React.useState(initial.country ?? '');
  const [beerStyle, setBeerStyle] = React.useState(initial.beerStyle ?? '');
  const [wineStyle, setWineStyle] = React.useState(initial.wineStyle ?? '');
  const [beerColor, setBeerColor] = React.useState(initial.beerColor ?? '');
  const [wineColor, setWineColor] = React.useState(initial.wineColor ?? '');
  const [wineSweetness, setWineSweetness] = React.useState(initial.wineSweetness ?? '');
  const [wineAromas, setWineAromas] = React.useState<string[]>(Array.isArray(initial.wineAromas) ? initial.wineAromas : (initial.wineAromas ? [String(initial.wineAromas)] : []));
  const [beerIbu, setBeerIbu] = React.useState<number>(initial.beerIbu ?? 40);
  const [beerSrm, setBeerSrm] = React.useState<number>(initial.beerSrm ?? 22);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(initial.imageUrl ?? null);

  const [beerStyleOptionsFromApi, setBeerStyleOptionsFromApi] = React.useState<Array<{ label: string; value: string }>>([]);
  const [beerColorOptionsFromApi, setBeerColorOptionsFromApi] = React.useState<Array<{ label: string; value: string }>>([]);
  const [beerFamiliesFromApi, setBeerFamiliesFromApi] = React.useState<any[]>([]);
  const [beerFamilyOptionsFromApi, setBeerFamilyOptionsFromApi] = React.useState<Array<{ label: string; value: string }>>([]);
  const [beerFamily, setBeerFamily] = React.useState<string>(initial.beerStyleFamily ?? '');
  const [wineStyleOptionsFromApi, setWineStyleOptionsFromApi] = React.useState<Array<{ label: string; value: string }>>([]);
  const [wineColorOptionsFromApi, setWineColorOptionsFromApi] = React.useState<Array<{ label: string; value: string }>>([]);
  const [wineSweetnessOptionsFromApi, setWineSweetnessOptionsFromApi] = React.useState<Array<{ label: string; value: string }>>([]);
  const [wineAromaOptionsFromApi, setWineAromaOptionsFromApi] = React.useState<Array<{ label: string; value: string }>>([]);
  const [catalogsLoading, setCatalogsLoading] = React.useState(true);

  // Validation rules
  const MAX_ABV = 96; // realistic max ABV
  const MAX_NAME = 120;
  const MAX_DESCRIPTION = 2000;
  const NAME_SUGGESTION_LIMIT = 6;

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const normalizedName = name.trim().toLowerCase();
  const filteredNameSuggestions = React.useMemo(() => {
    if (normalizedName.length < 2) return [];

    return nameSuggestions
      .filter((item) => item.name.toLowerCase().includes(normalizedName))
      .filter((item) => item.name.toLowerCase() !== normalizedName)
      .slice(0, NAME_SUGGESTION_LIMIT);
  }, [nameSuggestions, normalizedName]);

  const isAutofillMissingField = (field: string) => {
    if (!autofillMissingFields || autofillMissingFields.length === 0) return false;
    if (!autofillMissingFields.includes(field)) return false;

    switch (field) {
      case 'name':
        return !name || name.trim().length === 0;
      case 'description':
        return !description || description.trim().length === 0;
      case 'basePrice':
        return basePrice === null || basePrice === undefined || Number.isNaN(Number(basePrice));
      case 'strengthAbv':
        return strengthAbv === null || strengthAbv === undefined || Number.isNaN(Number(strengthAbv));
      case 'country':
        return !country || country.trim().length === 0;
      case 'beerStyle':
        return !beerStyle || beerStyle.trim().length === 0;
      case 'wineStyle':
        return !wineStyle || wineStyle.trim().length === 0;
      case 'beerColor':
        return !beerColor || beerColor.trim().length === 0;
      case 'wineColor':
        return !wineColor || wineColor.trim().length === 0;
      case 'wineSweetness':
        return !wineSweetness || wineSweetness.trim().length === 0;
      case 'wineAromas':
        return !wineAromas || wineAromas.length === 0;
      case 'beerIbu':
        return beerIbu === null || beerIbu === undefined || Number.isNaN(Number(beerIbu));
      case 'beerSrm':
        return beerSrm === null || beerSrm === undefined || Number.isNaN(Number(beerSrm));
      case 'imageUrl':
        return !imagePreview;
      default:
        return false;
    }
  };

  const exactNameExists = React.useMemo(() => {
    if (!normalizedName) return false;
    return nameSuggestions.some((item) => item.name.toLowerCase() === normalizedName);
  }, [nameSuggestions, normalizedName]);

  const hasAnySuggestions = nameSuggestionsOpen || filteredNameSuggestions.length > 0 || externalSuggestions.length > 0 || externalLoading;

  React.useEffect(() => {
    // create object URL when imageFile changes
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => { URL.revokeObjectURL(url); };
  }, [imageFile]);

  React.useEffect(() => {
    let active = true;

    const loadProductNames = async () => {
      try {
        const response = await fetch('/api/products');
        const data = response.ok ? await response.json() : [];
        if (!active) return;

        const products = Array.isArray(data) ? data : (Array.isArray(data?.value) ? data.value : []);
        const uniqueNames = new Map<string, { id: string; name: string }>();

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

  React.useEffect(() => {
    // Trigger suggestions either when the name is at least 2 chars, or when the suggestions dropdown is opened (show top local products).
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
        const url = normalizedName.length >= 2
          ? `/api/admin/catalog-beer/suggest?q=${encodeURIComponent(name.trim())}&count=6`
          : `/api/admin/catalog-beer/suggest?count=6`;

        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) {
          if (active) setExternalSuggestions([]);
          return;
        }

        const data = await response.json();
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
      const response = await fetch(`/api/admin/catalog-beer/details/${encodeURIComponent(suggestion.id)}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        alert('Failed to load product details from external catalog.');
        return;
      }

      const data = await response.json() as CatalogBeerAutofillResponse;
      const external = data?.product ?? {};

      if (external.name) setName(external.name);
      setCategory('Beer');
      if (external.description) setDescription(external.description);
      if (external.basePrice !== null && external.basePrice !== undefined) setBasePrice(Number(external.basePrice));
      if (external.strengthAbv !== null && external.strengthAbv !== undefined) setStrengthAbv(Number(external.strengthAbv));
      if (external.country) setCountry(external.country);
      if (external.beerStyle) setBeerStyle(external.beerStyle);
      if (external.beerColor) setBeerColor(external.beerColor);
      if (external.beerIbu !== null && external.beerIbu !== undefined) setBeerIbu(Number(external.beerIbu));
      if (external.beerSrm !== null && external.beerSrm !== undefined) setBeerSrm(Number(external.beerSrm));
      if (external.imageUrl) setImagePreview(external.imageUrl);

      setAutofillMissingFields(Array.isArray(data?.missingFields) ? data.missingFields : []);
      setNameSuggestionsOpen(false);
    } catch {
      alert('Failed to apply auto-fill from external catalog.');
    } finally {
      setAutofillLoadingId(null);
    }
  };

  React.useEffect(() => {
    let active = true;
    const loadCatalogs = async () => {
      try {
        const [beerFamilies, beerColors, wineStyles, wineColors, wineSweetness, wineAromas] = await Promise.all([
          fetch('/api/beer-catalog/families').then((r) => r.json()).catch(() => []),
          fetch('/api/beer-catalog/colors').then((r) => r.json()).catch(() => []),
          fetch('/api/wine-catalog/styles').then((r) => r.json()).catch(() => []),
          fetch('/api/wine-catalog/colors').then((r) => r.json()).catch(() => []),
          fetch('/api/wine-catalog/sweetness').then((r) => r.json()).catch(() => []),
          fetch('/api/wine-catalog/aromas').then((r) => r.json()).catch(() => []),
        ]);

        if (!active) return;

        const beerStylesOpts = Array.isArray(beerFamilies)
          ? beerFamilies.flatMap((f: any) => (Array.isArray(f.styles) ? f.styles.map((s: any) => ({ label: s.code ?? String(s), value: s.code ?? String(s) })) : []))
          : [];
        const beerFamiliesList = Array.isArray(beerFamilies) ? beerFamilies : [];
        const beerFamilyOpts = beerFamiliesList.map((f: any) => ({ label: f.name ?? f.code ?? String(f), value: f.code ?? f.name ?? String(f) }));
        const beerColorsOpts = Array.isArray(beerColors)
          ? beerColors.map((c: any) => ({ label: c.code ?? String(c), value: c.code ?? String(c) }))
          : [];
        const wineStylesOpts = Array.isArray(wineStyles)
          ? wineStyles.map((s: any) => ({ label: s.code ?? String(s), value: s.code ?? String(s) }))
          : [];
        const wineColorsOpts = Array.isArray(wineColors)
          ? wineColors.map((c: any) => ({ label: c.code ?? String(c), value: c.code ?? String(c) }))
          : [];
        const wineSweetnessOpts = Array.isArray(wineSweetness)
          ? wineSweetness.map((s: any) => ({ label: s.code ?? String(s), value: s.code ?? String(s) }))
          : [];
        const wineAromasOpts = Array.isArray(wineAromas)
          ? wineAromas.map((a: any) => ({ label: a.code ?? String(a), value: a.code ?? String(a) }))
          : [];

        setBeerStyleOptionsFromApi(beerStylesOpts.length > 0 ? beerStylesOpts : FALLBACK_BEER_STYLE_OPTIONS);
        setBeerColorOptionsFromApi(beerColorsOpts.length > 0 ? beerColorsOpts : FALLBACK_BEER_COLOR_OPTIONS);
        setBeerFamiliesFromApi(beerFamiliesList);
        setBeerFamilyOptionsFromApi(beerFamilyOpts.length > 0 ? beerFamilyOpts : []);
        setWineStyleOptionsFromApi(wineStylesOpts.length > 0 ? wineStylesOpts : FALLBACK_WINE_STYLE_OPTIONS);
        setWineColorOptionsFromApi(wineColorsOpts.length > 0 ? wineColorsOpts : FALLBACK_WINE_COLOR_OPTIONS);
        setWineSweetnessOptionsFromApi(wineSweetnessOpts.length > 0 ? wineSweetnessOpts : FALLBACK_WINE_SWEETNESS_OPTIONS);
        setWineAromaOptionsFromApi(wineAromasOpts.length > 0 ? wineAromasOpts : FALLBACK_WINE_AROMA_OPTIONS);
      } finally {
        if (active) setCatalogsLoading(false);
      }
    };

    void loadCatalogs();

    return () => { active = false; };
  }, []);

  const visibleBeerStyleOptions = React.useMemo(() => {
    if (!beerFamily) return beerStyleOptionsFromApi;
    const family = beerFamiliesFromApi.find((f: any) => (f.code ?? f.name ?? String(f)) === beerFamily);
    if (!family || !Array.isArray(family.styles)) return [];
    return family.styles.map((s: any) => ({ label: s.code ?? String(s), value: s.code ?? String(s) }));
  }, [beerFamily, beerFamiliesFromApi, beerStyleOptionsFromApi]);

  React.useEffect(() => {
    // when style is chosen, ensure family is set to the family that contains it
    if (!beerStyle) return;
    const found = beerFamiliesFromApi.find((f: any) => Array.isArray(f.styles) && f.styles.some((s: any) => (s.code ?? String(s)) === beerStyle));
    if (found) {
      const familyVal = found.code ?? found.name ?? String(found);
      if (beerFamily !== familyVal) setBeerFamily(familyVal);
    }
  }, [beerStyle, beerFamiliesFromApi, beerFamily]);

  React.useEffect(() => {
    // validate on field changes
    const next: Record<string, string> = {};
    if (!name || name.trim().length === 0) next.name = 'Name is required.';
    else if (name.length > MAX_NAME) next.name = `Name must be ≤ ${MAX_NAME} characters.`;

    if (description && description.length > MAX_DESCRIPTION) next.description = `Description must be ≤ ${MAX_DESCRIPTION} characters.`;

    if (strengthAbv !== null && strengthAbv !== undefined) {
      if (Number.isNaN(Number(strengthAbv))) next.strengthAbv = 'ABV must be a number.';
      else if (strengthAbv < 0) next.strengthAbv = 'ABV cannot be negative.';
      else if (strengthAbv > MAX_ABV) next.strengthAbv = `ABV must be ≤ ${MAX_ABV}%.`;
    }

    if (Number.isNaN(Number(basePrice)) || basePrice < 0) next.basePrice = 'Price must be a non-negative number.';

    setErrors(next);
  }, [name, description, strengthAbv, basePrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // prevent submit when client-side validation errors present
    if (Object.keys(errors).length > 0) {
      // focus first error
      const first = Object.keys(errors)[0];
      alert(errors[first]);
      return;
    }

    const payload: ProductDto = {
      name: name.trim(),
      categoryName: category,
      description: description.trim(),
      basePrice: Number(basePrice) || 0,
      strengthAbv: Number(strengthAbv) || 0,
      country: country.trim() || undefined,
      beerStyle: beerStyle || undefined,
      wineStyle: wineStyle || undefined,
      beerColor: beerColor || undefined,
      wineColor: wineColor || undefined,
      beerIbu: Number(beerIbu) || undefined,
      beerSrm: Number(beerSrm) || undefined,
      wineSweetness: category === 'Wine' ? wineSweetness || undefined : undefined,
      wineAromas: category === 'Wine' ? (wineAromas.length ? wineAromas : undefined) : undefined,
    };

    // include image preview URL if present
    if (imagePreview) {
      payload.imageUrl = imagePreview;
    }

    await onSubmit(payload);
  };

  const handleFileChange = (f?: File | null) => {
    if (!f) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    // basic image type check
    if (!f.type.startsWith('image/')) {
      setErrors((s) => ({ ...s, image: 'File must be an image.' }));
      return;
    }
    setErrors((s) => { const copy = { ...s }; delete copy.image; return copy; });
    setImageFile(f);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
      {/* Left: image preview + upload */}
      <div style={{ background: '#FAF9F6', borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 12, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {imagePreview ? (
            <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: '2.4rem' }}>🖼️</div>
              <div style={{ marginTop: 8, fontWeight: 700 }}>No image</div>
            </div>
          )}
        </div>

        <label style={{ display: 'inline-flex', width: '100%' }}>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : undefined)}
          />
          <span style={{ flex: 1 }} />
        </label>

        <div style={{ width: '100%', display: 'flex', gap: 8 }}>
          <label style={{ flex: 1 }}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : undefined)} />
            <button type="button" onClick={() => document.querySelector<HTMLInputElement>('input[type=file]')?.click()} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #E7D8C4', background: '#fff', cursor: 'pointer' }}>
              Upload image
            </button>
          </label>
          <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #E7D8C4', background: '#fff', cursor: 'pointer' }}>Remove</button>
        </div>

        {errors.image ? <div style={{ color: '#DC2626', fontSize: '0.9rem' }}>{errors.image}</div> : null}
      </div>

      {/* Right: form fields */}
      <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
              Name
              {isAutofillMissingField('name') ? (
                <AlertCircle size={16} color="#DC2626" style={{ marginLeft: 8, verticalAlign: 'middle' }} title="Missing value" />
              ) : null}
            </label>
              <div style={{ position: 'relative' }}>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setAutofillMissingFields([]);
                    setNameSuggestionsOpen(true);
                  }}
                  onFocus={() => setNameSuggestionsOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => setNameSuggestionsOpen(false), 120);
                  }}
                  required
                  autoComplete="off"
                  placeholder="Type an alcohol name"
                  style={{ width: '100%', padding: 12, borderRadius: 12, border: errors.name ? '1px solid #DC2626' : '1px solid #E7D8C4' }}
                />

                {nameSuggestionsOpen && hasAnySuggestions ? (
                  <div style={nameSuggestionsStyle}>
                    {filteredNameSuggestions.length > 0 ? (
                      <>
                        <div style={nameSuggestionsHeaderStyle}>
                          Suggested existing products
                        </div>
                        {filteredNameSuggestions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setName(item.name);
                              setAutofillMissingFields([]);
                              setNameSuggestionsOpen(false);
                            }}
                            style={nameSuggestionButtonStyle}
                          >
                            <span style={{ fontWeight: 700, color: '#2D2424' }}>{item.name}</span>
                            <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Use this existing name</span>
                          </button>
                        ))}
                      </>
                    ) : null}

                    <div style={{ ...nameSuggestionsHeaderStyle, marginTop: filteredNameSuggestions.length > 0 ? 4 : 0 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <WandSparkles size={14} />
                        Auto-fill from Catalog.beer API
                      </span>
                    </div>
                    {externalLoading ? (
                      <div style={{ padding: '8px 10px', color: '#6B7280', fontSize: '0.9rem' }}>Loading suggestions…</div>
                    ) : externalSuggestions.length === 0 ? (
                      <div style={{ padding: '8px 10px', color: '#9CA3AF', fontSize: '0.86rem' }}>No API recommendations yet.</div>
                    ) : (
                      externalSuggestions.map((item) => (
                        <button
                          key={`ext-${item.id}`}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            void applyExternalAutofill(item);
                          }}
                          style={nameSuggestionButtonStyle}
                          disabled={autofillLoadingId === item.id}
                        >
                          <span style={{ display: 'grid', gap: 2 }}>
                            <span style={{ fontWeight: 700, color: '#2D2424', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <WandSparkles size={14} color="#5D4037" /> {item.name}
                            </span>
                              <span style={{ color: '#9CA3AF', fontSize: '0.82rem' }}>
                              {item.style ? `${item.style} • ` : ''}
                              {item.abv !== null && item.abv !== undefined ? `${item.abv}% ABV` : 'ABV n/a'}
                              {item.ibu !== null && item.ibu !== undefined ? ` • ${item.ibu} IBU` : ''}
                            </span>
                          </span>
                            <span style={{ color: '#9CA3AF', fontSize: '0.82rem' }}>{autofillLoadingId === item.id ? 'Importing…' : `Auto-fill · ${('filledFields' in item) ? (item as any).filledFields + ' fields' : ''}`}</span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            {errors.name ? <div style={{ color: '#DC2626', marginTop: 6 }}>{errors.name}</div> : null}
              {!errors.name && normalizedName.length >= 2 && !exactNameExists ? (
                <div style={nameHintStyle}>
                  This name does not exist on the site yet. You can create it as a new product.
                </div>
              ) : null}
              {!errors.name && exactNameExists ? (
                <div style={nameExistsStyle}>
                  A product with this name already exists on the site.
                </div>
              ) : null}
              
          </div>

          <div style={{ width: 220 }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
              Category
            </label>
            <SelectField value={category} onChange={setCategory} options={[{ label: 'All', value: 'All' }, ...alcoholTypeOptions]} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
            Description
            {isAutofillMissingField('description') ? (
              <AlertCircle size={16} color="#DC2626" style={{ marginLeft: 8, verticalAlign: 'middle' }} title="Missing value" />
            ) : null}
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} style={{ width: '100%', padding: 12, borderRadius: 12, border: errors.description ? '1px solid #DC2626' : '1px solid #E7D8C4' }} />
          {errors.description ? <div style={{ color: '#DC2626', marginTop: 6 }}>{errors.description}</div> : null}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
              Price (PLN)
              {isAutofillMissingField('basePrice') ? (
                <AlertCircle size={16} color="#DC2626" style={{ marginLeft: 8, verticalAlign: 'middle' }} title="Missing value" />
              ) : null}
            </label>
            <input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} style={{ width: '100%', padding: 12, borderRadius: 12, border: errors.basePrice ? '1px solid #DC2626' : '1px solid #E7D8C4' }} />
            {errors.basePrice ? <div style={{ color: '#DC2626', marginTop: 6 }}>{errors.basePrice}</div> : null}
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
              ABV %
              {isAutofillMissingField('strengthAbv') ? (
                <AlertCircle size={16} color="#DC2626" style={{ marginLeft: 8, verticalAlign: 'middle' }} title="Missing value" />
              ) : null}
            </label>
            <input type="number" value={strengthAbv} onChange={(e) => setStrengthAbv(Number(e.target.value))} style={{ width: '100%', padding: 12, borderRadius: 12, border: errors.strengthAbv ? '1px solid #DC2626' : '1px solid #E7D8C4' }} />
            {errors.strengthAbv ? <div style={{ color: '#DC2626', marginTop: 6 }}>{errors.strengthAbv}</div> : null}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
            Country
            {isAutofillMissingField('country') ? (
              <AlertCircle size={16} color="#DC2626" style={{ marginLeft: 8, verticalAlign: 'middle' }} title="Missing value" />
            ) : null}
          </label>
              <SelectField
                options={countries.map((c) => ({ label: c, value: c }))}
                value={country}
                onChange={setCountry}
                placeholder="Select country of origin"
              />
        </div>

        {category === 'Beer' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
                Family
                {isAutofillMissingField('beerFamily') ? (
                  <AlertCircle size={16} color="#DC2626" style={{ marginLeft: 8, verticalAlign: 'middle' }} title="Missing value" />
                ) : null}
              </label>
              <SelectField
                value={beerFamily}
                onChange={(val: string) => {
                  setBeerFamily(val);
                  // clear style if it doesn't belong to new family
                  const family = beerFamiliesFromApi.find((f: any) => (f.code ?? f.name ?? String(f)) === val);
                  if (family && Array.isArray(family.styles)) {
                    const has = family.styles.some((s: any) => (s.code ?? String(s)) === beerStyle);
                    if (!has) setBeerStyle('');
                  }
                }}
                options={catalogsLoading || beerFamilyOptionsFromApi.length === 0 ? [{ label: 'Loading…', value: '' }] : beerFamilyOptionsFromApi}
                placeholder="Any family"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
                Style
                {isAutofillMissingField('beerStyle') ? (
                  <AlertCircle size={16} color="#DC2626" style={{ marginLeft: 8, verticalAlign: 'middle' }} title="Missing value" />
                ) : null}
              </label>
              <SelectField
                value={beerStyle}
                onChange={(val: string) => {
                  setBeerStyle(val);
                }}
                options={catalogsLoading || visibleBeerStyleOptions.length === 0 ? [{ label: 'Loading…', value: '' }] : visibleBeerStyleOptions}
                placeholder="Any style"
              />
            </div>
            <div>
              <RangeField label={<><span>IBU</span>{isAutofillMissingField('beerIbu') ? (<AlertCircle size={16} color="#DC2626" style={{ marginLeft: 8, verticalAlign: 'middle' }} title="Missing value" />) : null}</>} value={beerIbu} onChange={setBeerIbu} min={0} max={120} leftLabel="Smooth" rightLabel="Bitter" marks={[{ label: 'Low', value: 15 }, { label: 'Mid', value: 50 }, { label: 'High', value: 85 }]} helperText="Bitterness" />
            </div>
            <div>
              <RangeField
                label={<><span>SRM</span>{isAutofillMissingField('beerSrm') ? (<AlertCircle size={16} color="#DC2626" style={{ marginLeft: 8, verticalAlign: 'middle' }} title="Missing value" />) : null}</>}
                value={beerSrm}
                onChange={setBeerSrm}
                min={0}
                max={80}
                leftLabel="Pale"
                rightLabel="Dark"
                marks={[{ label: 'Pale', value: 12 }, { label: 'Amber', value: 38 }, { label: 'Brown', value: 65 }, { label: 'Dark', value: 88 }]}
                helperText="Color intensity"
                onClassSelect={(key, mid) => { setBeerSrm(mid); setBeerColor(key); }}
              />
            </div>
          </div>
        ) : null}

        {category === 'Wine' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
                Style
                {isAutofillMissingField('wineStyle') ? (
                  <AlertCircle size={16} color="#DC2626" style={{ marginLeft: 8, verticalAlign: 'middle' }} title="Missing value" />
                ) : null}
              </label>
              <SelectField
                value={wineStyle}
                onChange={setWineStyle}
                options={catalogsLoading || wineStyleOptionsFromApi.length === 0 ? [{ label: 'Loading…', value: '' }] : wineStyleOptionsFromApi}
                placeholder="Any style"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
                Color
                {isAutofillMissingField('wineColor') ? (
                  <AlertCircle size={16} color="#DC2626" style={{ marginLeft: 8, verticalAlign: 'middle' }} title="Missing value" />
                ) : null}
              </label>
              <SelectField
                value={wineColor}
                onChange={setWineColor}
                options={catalogsLoading || wineColorOptionsFromApi.length === 0 ? [{ label: 'Loading…', value: '' }] : wineColorOptionsFromApi}
                placeholder="Any color"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
                Sweetness
                {isAutofillMissingField('wineSweetness') ? (
                  <AlertCircle size={16} color="#DC2626" style={{ marginLeft: 8, verticalAlign: 'middle' }} title="Missing value" />
                ) : null}
              </label>
              <SelectField
                value={wineSweetness}
                onChange={setWineSweetness}
                options={catalogsLoading || wineSweetnessOptionsFromApi.length === 0 ? [{ label: 'Loading…', value: '' }] : wineSweetnessOptionsFromApi}
                placeholder="Any sweetness"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
                Aromas
                {isAutofillMissingField('wineAromas') ? (
                  <AlertCircle size={16} color="#DC2626" style={{ marginLeft: 8, verticalAlign: 'middle' }} title="Missing value" />
                ) : null}
              </label>
              <MultiSelectField
                value={wineAromas}
                onChange={setWineAromas}
                options={catalogsLoading || wineAromaOptionsFromApi.length === 0 ? [{ label: 'Loading…', value: '' }] : wineAromaOptionsFromApi}
                placeholder="Select aromas"
              />
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 18 }}>
          <button type="submit" disabled={submitting || Object.keys(errors).length > 0} style={{ padding: '12px 18px', borderRadius: 12, background: submitting || Object.keys(errors).length > 0 ? '#9CA3AF' : '#5D4037', color: '#FFF7ED', border: 'none', fontWeight: 800, cursor: submitting || Object.keys(errors).length > 0 ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Saving…' : 'Save product'}
          </button>
        </div>
      </div>
    </form>
  );
}

const nameSuggestionsStyle = {
  position: 'absolute' as const,
  top: 'calc(100% + 8px)',
  left: 0,
  right: 0,
  background: '#FFFDF9',
  border: '1px solid #E7D8C4',
  borderRadius: '16px',
  boxShadow: '0 18px 36px rgba(45, 36, 36, 0.12)',
  padding: '8px',
  zIndex: 30,
};

const nameSuggestionsHeaderStyle = {
  fontSize: '0.76rem',
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  color: '#A0522D',
  padding: '4px 8px 8px',
};

const nameSuggestionButtonStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  border: 'none',
  borderRadius: '12px',
  background: 'transparent',
  padding: '12px 10px',
  cursor: 'pointer',
  textAlign: 'left' as const,
};

const nameHintStyle = {
  marginTop: 6,
  color: '#6B7280',
  fontSize: '0.92rem',
};

const nameExistsStyle = {
  marginTop: 6,
  color: '#92400E',
  fontSize: '0.92rem',
  fontWeight: 700,
};

const autofillMissingFieldsStyle = {
  marginTop: 8,
  borderRadius: 12,
  border: '1px solid #FED7AA',
  background: '#FFF7ED',
  padding: '8px 10px',
};

const fieldLabels: Record<string, string> = {
  description: 'Description',
  strengthAbv: 'ABV',
  beerIbu: 'IBU',
  beerStyle: 'Beer style',
  beerColor: 'Beer class',
  basePrice: 'Price',
  beerSrm: 'SRM',
  country: 'Country',
  imageUrl: 'Image URL',
};

const dropdownStyles = `
  .titan-select-field__button:hover {
    transform: translateY(-1px);
    border-color: #CCB79D;
    box-shadow: 0 10px 22px rgba(93, 64, 55, 0.08);
  }

  .titan-select-field__button:focus-visible {
    outline: 2px solid #5D4037;
    outline-offset: 2px;
  }

  .titan-select-field__label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .titan-select-field__icon {
    flex-shrink: 0;
    transition: transform 220ms ease;
  }

  .titan-select-field[data-open='true'] .titan-select-field__icon {
    transform: rotate(180deg);
  }

  .titan-select-field[data-open='true'] {
    z-index: 50;
  }

  .titan-select-field__menu {
    position: fixed;
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow-x: hidden;
    overflow-y: auto;
    background: #FFFDF9;
    border: 1px solid #E7D8C4;
    box-shadow: 0 18px 36px rgba(45, 36, 36, 0.12);
    border-radius: 18px;
    padding: 8px;
    transition: opacity 180ms ease, transform 180ms ease, max-height 220ms ease;
    margin-top: 0;
    will-change: transform, opacity;
  }

  .titan-select-field__option {
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
    border-radius: 12px;
    padding: 12px 14px;
    color: #2D2424;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 160ms ease, color 160ms ease, transform 160ms ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .titan-select-field__option-label {
    min-width: 0;
  }

  .titan-select-field__option:hover,
  .titan-select-field__option:focus-visible {
    background: #2D2424;
    color: #FFF7ED;
    transform: translateX(2px);
    outline: none;
  }
`;

function MultiSelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  options: Array<{ label: string; value: string; hint?: string }>;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (rootRef.current && !rootRef.current.contains(target) && menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  React.useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      return;
    }

    const updateMenuPosition = () => {
      if (!rootRef.current) {
        return;
      }

      const rect = rootRef.current.getBoundingClientRect();
      const gap = 10;
      const preferredHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const placeAbove = spaceBelow < preferredHeight && spaceAbove > spaceBelow;
      const maxHeight = Math.max(160, Math.min(preferredHeight, placeAbove ? spaceAbove : spaceBelow));

      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
        top: placeAbove ? undefined : rect.bottom + gap,
        bottom: placeAbove ? window.innerHeight - rect.top + gap : undefined,
        maxHeight,
      });
    };

    updateMenuPosition();

    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open]);

  React.useLayoutEffect(() => {
    if (open) {
      try {
        menuRef.current?.focus();
      } catch {}
    }
  }, [open]);

  const { onKeyDown } = useTypeToSearch(
    options.map((o) => ({ label: o.label })),
    optionRefs,
  );

  const selectedLabels = options.filter((option) => value.includes(option.value)).map((option) => option.label);
  const buttonLabel = selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder ?? 'Select options';

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%' }} data-open={open ? 'true' : 'false'}>
      <style>{dropdownStyles}</style>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="titan-select-field__button"
        style={{
          width: '100%',
          border: '1px solid #E7D8C4',
          background: '#F7F1E8',
          color: '#2D2424',
          padding: '16px 48px 16px 18px',
          borderRadius: '16px',
          fontSize: '1rem',
          fontWeight: 800,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease, background 180ms ease',
          textAlign: 'left',
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="titan-select-field__label">{buttonLabel}</span>
        <ChevronDown size={18} color="#5D4037" className="titan-select-field__icon" />
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              className="titan-select-field__menu"
              style={{
                ...menuStyle,
                opacity: open ? 1 : 0,
                transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.98)',
                pointerEvents: open ? 'auto' : 'none',
                transition: 'opacity 180ms ease, transform 180ms ease, max-height 220ms ease',
              }}
              role="listbox"
              aria-multiselectable="true"
              tabIndex={-1}
              onKeyDown={onKeyDown}
            >
              {options.map((option, idx) => {
                const checked = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    className="titan-select-field__option"
                    ref={(el) => {
                      optionRefs.current[idx] = el;
                    }}
                    onClick={() => {
                      onChange(checked ? value.filter((item) => item !== option.value) : [...value, option.value]);
                    }}
                    aria-pressed={checked}
                  >
                    <span className="titan-select-field__option-label">{option.label}</span>
                    <span style={{ width: 18, height: 18, borderRadius: 999, border: '1px solid #CCB79D', background: checked ? '#5D4037' : '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#FFF7ED', fontSize: 12, fontWeight: 900 }}>
                      {checked ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
