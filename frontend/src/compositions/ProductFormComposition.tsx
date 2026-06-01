import React from 'react';
import { WandSparkles, AlertCircle } from 'lucide-react';
import SelectField from '../components/alcohol/SelectField';
import MultiSelectField from '../components/alcohol/MultiSelectField';
import RangeField from '../components/alcohol/RangeField';
import useProductFormValidation from '../hooks/useProductFormValidation';
import useCatalogOptions from '../hooks/useCatalogOptions';
import useProductAutofill from '../hooks/useProductAutofill';
import { alcoholTypeOptions } from '../utils/catalogFilters';
import { countries } from '../utils/countries';
import type { ProductFormDto } from '../types';

export default function ProductFormComposition({
  initial = {},
  onSubmit,
  submitting = false,
}: {
  initial?: ProductFormDto;
  onSubmit: (payload: ProductFormDto) => Promise<void> | void;
  submitting?: boolean;
}) {
  const [name, setName] = React.useState(initial.name ?? '');
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
  const [wineAromas, setWineAromas] = React.useState<string[]>(
    Array.isArray(initial.wineAromas) ? initial.wineAromas : initial.wineAromas ? [String(initial.wineAromas)] : [],
  );
  const [beerIbu, setBeerIbu] = React.useState<number>(initial.beerIbu ?? 40);
  const [beerSrm, setBeerSrm] = React.useState<number>(initial.beerSrm ?? 22);
  const [beerFamily, setBeerFamily] = React.useState<string>(initial.beerStyleFamily ?? '');
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(initial.imageUrl ?? null);

  const { errors, setErrors } = useProductFormValidation({ name, description, strengthAbv, basePrice });

  const {
    beerFamiliesFromApi,
    beerFamilyOptionsFromApi,
    wineStyleOptionsFromApi,
    wineColorOptionsFromApi,
    wineSweetnessOptionsFromApi,
    wineAromaOptionsFromApi,
    visibleBeerStyleOptions,
    catalogsLoading,
    resolveFamilyForStyle,
  } = useCatalogOptions(beerFamily);

  const applyAutofillProduct = React.useCallback((external: Partial<ProductFormDto>, missingFields: string[]) => {
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
    void missingFields;
  }, []);

  const {
    nameSuggestionsOpen,
    setNameSuggestionsOpen,
    filteredNameSuggestions,
    externalSuggestions,
    externalLoading,
    autofillLoadingId,
    autofillMissingFields,
    clearAutofillMissingFields,
    exactNameExists,
    hasAnySuggestions,
    normalizedName,
    applyExternalAutofill,
  } = useProductAutofill(name, applyAutofillProduct);

  React.useEffect(() => {
    if (!beerStyle) return;
    const family = resolveFamilyForStyle(beerStyle);
    if (family && beerFamily !== family) setBeerFamily(family);
  }, [beerStyle, beerFamily, resolveFamilyForStyle]);

  React.useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      const first = Object.keys(errors)[0];
      alert(errors[first]);
      return;
    }

    const payload: ProductFormDto = {
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
      imageFile: imageFile ?? undefined,
    };

    if (!imageFile && imagePreview) {
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
    if (!f.type.startsWith('image/')) {
      setErrors((state) => ({ ...state, image: 'File must be an image.' }));
      return;
    }
    setErrors((state) => {
      const copy = { ...state };
      delete copy.image;
      return copy;
    });
    setImageFile(f);
  };

  const renderMissingLabel = (text: string, isMissing: boolean) => (
    <span className="inline-flex items-center gap-2">
      <span>{text}</span>
      {isMissing && (
        <span title="Missing value" className="inline-flex items-center">
          <AlertCircle size={16} className="text-red-600" />
        </span>
      )}
    </span>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-[320px_1fr] gap-5">
      <div className="bg-[#FAF9F6] rounded-2xl p-3.5 flex flex-col gap-3 items-center self-start">
        <div className="w-full aspect-[4/3] rounded-xl bg-white flex items-center justify-center overflow-hidden">
          {imagePreview ? (
            <img src={imagePreview} alt="preview" className="w-full h-full object-contain" />
          ) : (
            <div className="text-center text-gray-400">
              <div className="text-[2.4rem]">🖼️</div>
              <div className="mt-2 font-bold">No image</div>
            </div>
          )}
        </div>

        <div className="w-full flex gap-2">
          <label className="flex-1">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : undefined)} />
            <button type="button" onClick={() => document.querySelector<HTMLInputElement>('input[type=file]')?.click()} className="w-full py-2.5 px-3 rounded-xl border border-[#E7D8C4] bg-white cursor-pointer hover:bg-gray-50 transition-colors font-bold">
              Upload image
            </button>
          </label>
          <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="py-2.5 px-3 rounded-xl border border-[#E7D8C4] bg-white cursor-pointer hover:bg-gray-50 transition-colors font-bold text-red-600">Remove</button>
        </div>

        {errors.image && <div className="text-red-600 text-sm font-semibold">{errors.image}</div>}
      </div>

      <div>
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="flex-1">
            <label className="block font-bold mb-2 text-text-main">{renderMissingLabel('Name', isAutofillMissingField('name'))}</label>
            <div className="relative">
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearAutofillMissingFields();
                  setNameSuggestionsOpen(true);
                }}
                onFocus={() => setNameSuggestionsOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setNameSuggestionsOpen(false), 120);
                }}
                required
                autoComplete="off"
                placeholder="Type an alcohol name"
                className={`w-full p-3 rounded-xl border bg-white focus:outline-none focus:ring-1 focus:ring-brand-color transition-colors ${errors.name ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : 'border-[#E7D8C4] focus:border-brand-color'}`}
              />

              {nameSuggestionsOpen && hasAnySuggestions && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#FFFDF9] border border-[#E7D8C4] rounded-2xl shadow-[0_18px_36px_rgba(45,36,36,0.12)] p-2 z-30">
                  {filteredNameSuggestions.length > 0 && (
                    <>
                      <div className="text-[0.76rem] font-extrabold tracking-[0.06em] uppercase text-amber-700 px-2 pt-1 pb-2">
                        Suggested existing products
                      </div>
                      {filteredNameSuggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setName(item.name);
                            clearAutofillMissingFields();
                            setNameSuggestionsOpen(false);
                          }}
                          className="w-full flex items-center justify-between gap-3 border-none rounded-xl bg-transparent p-3 cursor-pointer text-left hover:bg-gray-100 transition-colors"
                        >
                          <span className="font-bold text-text-main">{item.name}</span>
                          <span className="text-gray-400 text-[0.85rem]">Use this existing name</span>
                        </button>
                      ))}
                    </>
                  )}

                  <div className={`text-[0.76rem] font-extrabold tracking-[0.06em] uppercase text-amber-700 px-2 pt-1 pb-2 ${filteredNameSuggestions.length > 0 ? 'mt-1' : 'mt-0'}`}>
                    <span className="inline-flex items-center gap-1.5">
                      <WandSparkles size={14} />
                      Auto-fill from Catalog.beer API
                    </span>
                  </div>
                  {externalLoading ? (
                    <div className="px-2.5 py-2 text-gray-500 text-[0.9rem]">Loading suggestions…</div>
                  ) : externalSuggestions.length === 0 ? (
                    <div className="px-2.5 py-2 text-gray-400 text-[0.86rem]">No API recommendations yet.</div>
                  ) : (
                    externalSuggestions.map((item) => (
                      <button
                        key={`ext-${item.id}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          void applyExternalAutofill(item);
                        }}
                        className="w-full flex items-center justify-between gap-3 border-none rounded-xl bg-transparent p-3 cursor-pointer text-left hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={autofillLoadingId === item.id}
                      >
                        <span className="grid gap-0.5">
                          <span className="font-bold text-text-main inline-flex items-center gap-1.5">
                            <WandSparkles size={14} className="text-brand-color" /> {item.name}
                          </span>
                          <span className="text-gray-400 text-[0.82rem]">
                            {item.style ? `${item.style} • ` : ''}
                            {item.abv !== null && item.abv !== undefined ? `${item.abv}% ABV` : 'ABV n/a'}
                            {item.ibu !== null && item.ibu !== undefined ? ` • ${item.ibu} IBU` : ''}
                          </span>
                        </span>
                        <span className="text-gray-400 text-[0.82rem]">
                          {autofillLoadingId === item.id ? 'Importing…' : item.filledFields != null ? `Auto-fill · ${item.filledFields} fields` : 'Auto-fill'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {errors.name && <div className="text-red-600 mt-1.5 text-sm font-semibold">{errors.name}</div>}
            {!errors.name && normalizedName.length >= 2 && !exactNameExists && (
              <div className="mt-1.5 text-gray-500 text-[0.92rem]">
                This name does not exist on the site yet. You can create it as a new product.
              </div>
            )}
            {!errors.name && exactNameExists && (
              <div className="mt-1.5 text-amber-800 text-[0.92rem] font-bold">
                A product with this name already exists on the site.
              </div>
            )}
          </div>

          <div className="w-full sm:w-[220px]">
            <label className="block font-bold mb-2 text-text-main">Category</label>
            <SelectField value={category} onChange={setCategory} options={[{ label: 'All', value: 'All' }, ...alcoholTypeOptions]} />
          </div>
        </div>

        <div className="mb-3">
          <label className="block font-bold mb-2 text-text-main">{renderMissingLabel('Description', isAutofillMissingField('description'))}</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`w-full p-3 rounded-xl border bg-white focus:outline-none focus:ring-1 focus:ring-brand-color transition-colors resize-y ${errors.description ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : 'border-[#E7D8C4] focus:border-brand-color'}`} />
          {errors.description && <div className="text-red-600 mt-1.5 text-sm font-semibold">{errors.description}</div>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold mb-2 text-text-main">{renderMissingLabel('Price (PLN)', isAutofillMissingField('basePrice'))}</label>
            <input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} className={`w-full p-3 rounded-xl border bg-white focus:outline-none focus:ring-1 focus:ring-brand-color transition-colors ${errors.basePrice ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : 'border-[#E7D8C4] focus:border-brand-color'}`} />
            {errors.basePrice && <div className="text-red-600 mt-1.5 text-sm font-semibold">{errors.basePrice}</div>}
          </div>
          <div>
            <label className="block font-bold mb-2 text-text-main">{renderMissingLabel('ABV %', isAutofillMissingField('strengthAbv'))}</label>
            <input type="number" value={strengthAbv} onChange={(e) => setStrengthAbv(Number(e.target.value))} className={`w-full p-3 rounded-xl border bg-white focus:outline-none focus:ring-1 focus:ring-brand-color transition-colors ${errors.strengthAbv ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : 'border-[#E7D8C4] focus:border-brand-color'}`} />
            {errors.strengthAbv && <div className="text-red-600 mt-1.5 text-sm font-semibold">{errors.strengthAbv}</div>}
          </div>
        </div>

        <div className="mt-3">
          <label className="block font-bold mb-2 text-text-main">{renderMissingLabel('Country', isAutofillMissingField('country'))}</label>
          <SelectField
            options={countries.map((c) => ({ label: c, value: c }))}
            value={country}
            onChange={setCountry}
            placeholder="Select country of origin"
          />
        </div>

        {category === 'Beer' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block font-bold mb-2 text-text-main">Family</label>
              <SelectField
                value={beerFamily}
                onChange={(val: string) => {
                  setBeerFamily(val);
                  const family = beerFamiliesFromApi.find((entry) => entry.code === val);
                  if (family && Array.isArray(family.styles)) {
                    const has = family.styles.some((style) => style.code === beerStyle);
                    if (!has) setBeerStyle('');
                  }
                }}
                options={catalogsLoading || beerFamilyOptionsFromApi.length === 0 ? [{ label: 'Loading…', value: '' }] : beerFamilyOptionsFromApi}
                placeholder="Any family"
              />
            </div>
            <div>
              <label className="block font-bold mb-2 text-text-main">{renderMissingLabel('Style', isAutofillMissingField('beerStyle'))}</label>
              <SelectField
                value={beerStyle}
                onChange={setBeerStyle}
                options={catalogsLoading || visibleBeerStyleOptions.length === 0 ? [{ label: 'Loading…', value: '' }] : visibleBeerStyleOptions}
                placeholder="Any style"
              />
            </div>
            <div>
              <RangeField label={renderMissingLabel('IBU', isAutofillMissingField('beerIbu'))} value={beerIbu} onChange={setBeerIbu} min={0} max={120} leftLabel="Smooth" rightLabel="Bitter" marks={[{ label: 'Low', value: 15 }, { label: 'Mid', value: 50 }, { label: 'High', value: 85 }]} helperText="Bitterness" />
            </div>
            <div>
              <RangeField
                label={renderMissingLabel('SRM', isAutofillMissingField('beerSrm'))}
                value={beerSrm}
                onChange={setBeerSrm}
                min={0}
                max={80}
                leftLabel="Pale"
                rightLabel="Dark"
                marks={[{ label: 'Pale', value: 12 }, { label: 'Amber', value: 38 }, { label: 'Brown', value: 65 }, { label: 'Dark', value: 88 }]}
                helperText="Color intensity"
                onClassSelect={(key: string, mid: number) => { setBeerSrm(mid); setBeerColor(key); }}
              />
            </div>
          </div>
        )}

        {category === 'Wine' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block font-bold mb-2 text-text-main">{renderMissingLabel('Style', isAutofillMissingField('wineStyle'))}</label>
              <SelectField value={wineStyle} onChange={setWineStyle} options={catalogsLoading || wineStyleOptionsFromApi.length === 0 ? [{ label: 'Loading…', value: '' }] : wineStyleOptionsFromApi} placeholder="Any style" />
            </div>
            <div>
              <label className="block font-bold mb-2 text-text-main">{renderMissingLabel('Color', isAutofillMissingField('wineColor'))}</label>
              <SelectField value={wineColor} onChange={setWineColor} options={catalogsLoading || wineColorOptionsFromApi.length === 0 ? [{ label: 'Loading…', value: '' }] : wineColorOptionsFromApi} placeholder="Any color" />
            </div>
            <div>
              <label className="block font-bold mb-2 text-text-main">{renderMissingLabel('Sweetness', isAutofillMissingField('wineSweetness'))}</label>
              <SelectField value={wineSweetness} onChange={setWineSweetness} options={catalogsLoading || wineSweetnessOptionsFromApi.length === 0 ? [{ label: 'Loading…', value: '' }] : wineSweetnessOptionsFromApi} placeholder="Any sweetness" />
            </div>
            <div>
              <label className="block font-bold mb-2 text-text-main">{renderMissingLabel('Aromas', isAutofillMissingField('wineAromas'))}</label>
              <MultiSelectField
                value={wineAromas}
                onChange={setWineAromas}
                options={catalogsLoading || wineAromaOptionsFromApi.length === 0 ? [{ label: 'Loading…', value: '' }] : wineAromaOptionsFromApi}
                placeholder="Select aromas"
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end mt-4.5">
          <button type="submit" disabled={submitting || Object.keys(errors).length > 0} className={`px-4.5 py-3 rounded-xl font-extrabold transition-colors border-none ${submitting || Object.keys(errors).length > 0 ? 'bg-gray-400 text-orange-50 cursor-not-allowed' : 'bg-brand-color text-orange-50 cursor-pointer hover:bg-opacity-90'}`}>
            {submitting ? 'Saving…' : 'Save product'}
          </button>
        </div>
      </div>
    </form>
  );
}
