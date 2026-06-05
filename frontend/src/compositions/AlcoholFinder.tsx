import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Beer, ChevronRight, Heart, Save, SlidersHorizontal, Sparkles, Star } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import type { ProductDto } from '../types';
import Notification from '../components/Notification';
import MultiSelectField from '../components/alcohol/MultiSelectField';
import RangeField from '../components/alcohol/RangeField';
import {
  type AlcoholProfile,
  type AlcoholCategory,
  type PriceBand,
  STORAGE_KEY,
  alcoholCategories,
  defaultAlcoholProfile,
  describeProfile,
  getCategoryDefinition,
  matchesCategory,
  matchesPrice,
  matchesTaste,
  priceBands,
  scoreProduct,
  type ProductLike,
} from '../utils/alcoholProfiles';
import { apiRoutes } from '../api/routes';
import { apiFetch, userHeaders } from '../utils/api';
import { parseProductList } from '../utils/productApi';

export default function AlcoholFinder() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AlcoholProfile>(defaultAlcoholProfile);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    const rawProfile = window.localStorage.getItem(STORAGE_KEY);

    if (rawProfile) {
      try {
        const parsed = JSON.parse(rawProfile) as Partial<AlcoholProfile>;
        // Upgrade check: if they have the old format (category string), convert to array
        const oldFormat = parsed as any;
        if ('category' in oldFormat && typeof oldFormat.category === 'string') {
           setProfile({
             ...defaultAlcoholProfile,
             categories: [oldFormat.category as AlcoholCategory],
             primaryChoices: oldFormat.primaryChoice ? [oldFormat.primaryChoice as string] : [],
             secondaryChoices: oldFormat.secondaryChoice ? [oldFormat.secondaryChoice as string] : [],
             priceBands: oldFormat.priceBand ? [oldFormat.priceBand as PriceBand] : ['Any'],
             color: oldFormat.color ?? 22,
             bitterness: oldFormat.bitterness ?? 40,
             strength: oldFormat.strength ?? 5,
           });
        } else {
           setProfile((current) => ({ ...current, ...parsed }));
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    const loadProducts = async () => {
      try {
        const [payload, favPayload] = await Promise.all([
          apiFetch<unknown>(apiRoutes.products.list('page=1&pageSize=100'), { credentials: 'omit' }),
          userHeaders().then(h => apiFetch<unknown>(apiRoutes.favorites.list, { headers: h })).catch(() => []),
        ]);
        setProducts(parseProductList<ProductDto>(payload).items);
        const favs = parseProductList<ProductDto>(favPayload).items;
        setFavoriteIds(favs.map(f => String(f.id)));
      } catch (error) {
        console.error('Failed to load products', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const updateProfile = (patch: Partial<AlcoholProfile>) => {
    setProfile((current) => ({ ...current, ...patch }));
    setSavedNotice(null);
  };

  const saveProfile = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSavedNotice('Preferences saved on this device.');
  };

  const createAccount = () => {
    saveProfile();
    navigate('/register');
  };

  const handleCategoriesChange = (values: string[]) => {
    let newCats = values as AlcoholCategory[];
    if (newCats.length === 0) newCats = ['All'];
    updateProfile({ categories: newCats });
  };

  const toggleFavorite = async (productId: number | string) => {
    const favoriteId = String(productId);
    const isFav = favoriteIds.includes(favoriteId);
    try {
      const headers = await userHeaders({ 'Content-Type': 'application/json' });
      await apiFetch(apiRoutes.favorites.byProductId(productId), {
        method: isFav ? 'DELETE' : 'POST',
        headers,
        parseJson: false,
      });
      setFavoriteIds((current) => (isFav ? current.filter((id) => id !== favoriteId) : [...current, favoriteId]));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => matchesCategory(product, profile.categories))
      .filter((product) => matchesPrice(product.basePrice, profile.priceBands))
      .filter((product) => matchesTaste(product, profile))
      .sort((left, right) => scoreProduct(right as ProductLike, profile) - scoreProduct(left as ProductLike, profile));
  }, [products, profile]);

  return (
    <div className="max-w-[1280px] mx-auto pt-7 px-5 pb-13">
      <section className="grid grid-cols-1 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-6.5 items-start mb-7">
        <div className="text-center pt-5 px-4.5">
          <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full bg-[#F5F0E8] text-brand-color font-black tracking-[0.1em] uppercase mb-4">
            <Beer size={16} /> Alcohol finder
          </div>
          <h1 className="mx-auto mb-3.5 text-text-main text-[clamp(2.6rem,4vw,4.8rem)] font-black leading-[1.02] max-w-[12ch]">Find a drink that matches your taste.</h1>
          <p className="mx-auto max-w-[62ch] text-[1.05rem] leading-[1.7] text-text-muted">
            Choose the alcohol types, then the menu shows only the controls for those categories. Results update instantly while you move the filters.
          </p>

          <div className="flex gap-3 justify-center flex-wrap mt-5.5">
            <button type="button" onClick={createAccount} className="inline-flex items-center gap-2.5 px-4.5 py-3.5 rounded-2xl border border-brand-color bg-brand-color text-white font-extrabold cursor-pointer hover:bg-opacity-90 transition-colors">
              Create account and save profile <ChevronRight size={18} />
            </button>
            <Link to="/catalog" className="inline-flex items-center justify-center px-4.5 py-3.5 rounded-2xl border border-[#E7D8C4] bg-[#F5F0E8] text-brand-color font-extrabold no-underline hover:bg-brand-color hover:text-white transition-colors">
              Open full catalog
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-7">
            <div className="flex items-start gap-3 p-4 rounded-[20px] bg-bg-main border border-[#EFE7DB] text-left">
              <Star size={18} className="text-brand-color shrink-0" />
              <div>
                <strong className="block text-text-main mb-1">Live filtering</strong>
                <p className="m-0 text-text-muted text-sm leading-relaxed">Results refresh the moment you change a control.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-[20px] bg-bg-main border border-[#EFE7DB] text-left">
              <Heart size={18} className="text-brand-color shrink-0" />
              <div>
                <strong className="block text-text-main mb-1">Save the profile</strong>
                <p className="m-0 text-text-muted text-sm leading-relaxed">Keep your choices locally and attach them to an account later.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-7 rounded-[34px] bg-white border border-[#EFE7DB] shadow-[0_24px_60px_rgba(93,64,55,0.06)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
            <div className="grid gap-2">
              <div className="text-brand-color text-[0.82rem] font-extrabold uppercase tracking-widest">Alcohol types</div>
              <MultiSelectField
                value={profile.categories}
                onChange={handleCategoriesChange}
                options={alcoholCategories.filter(c => c !== 'All').map((category) => ({ label: category, value: category }))}
                placeholder="Select types"
              />
            </div>

            <div className="grid gap-2">
              <div className="text-brand-color text-[0.82rem] font-extrabold uppercase tracking-widest">Price</div>
              <MultiSelectField
                value={profile.priceBands}
                onChange={(values) => {
                  const bands = values as PriceBand[];
                  updateProfile({ priceBands: bands.length ? bands : ['Any'] });
                }}
                options={priceBands.filter((b) => b.value !== 'Any').map((band) => ({ label: band.label, value: band.value }))}
                placeholder="Select price bands"
              />
            </div>
          </div>

          {profile.categories.filter(c => c !== 'All').map((cat) => {
            const categoryDefinition = getCategoryDefinition(cat);
            if (!categoryDefinition) return null;

            return (
              <div key={cat} className="mb-6">
                <div className="flex flex-col gap-1 mb-4 text-text-muted">
                  <strong className="text-text-main">{categoryDefinition.title}</strong>
                  <span className="text-sm">{categoryDefinition.description}</span>
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
                  {categoryDefinition.controls.map((control) => {
                    if (control.kind === 'select') {
                      const controlValue = profile[control.valueKey] as string[];

                      return (
                        <div key={control.id} className="grid gap-2">
                          <div className="text-brand-color text-[0.82rem] font-extrabold uppercase tracking-widest">{control.label}</div>
                          <MultiSelectField
                            value={controlValue}
                            onChange={(value) => updateProfile({ [control.valueKey]: value } as Partial<AlcoholProfile>)}
                            options={control.options}
                            placeholder={`Select ${control.label.toLowerCase()}`}
                          />
                          {control.helperText && <div className="text-[#7A736C] text-[0.8rem] leading-[1.5]">{control.helperText}</div>}
                        </div>
                      );
                    }

                    return (
                      <div key={control.id} className="grid gap-2">
                        <RangeField
                          label={control.label}
                          value={profile[control.valueKey] as number}
                          onChange={(value) => updateProfile({ [control.valueKey]: value } as Partial<AlcoholProfile>)}
                          min={control.min}
                          max={control.max}
                          step={control.step}
                          leftLabel={control.leftLabel}
                          rightLabel={control.rightLabel}
                          marks={control.marks}
                          valueSuffix={control.valueSuffix}
                          helperText={control.helperText}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex justify-between items-center gap-3 mt-4.5 pt-4.5 border-t border-[#E5D8C9]">
            <div>
              <p className="m-0 text-[#8B7D73] text-[0.78rem] uppercase tracking-widest">Current selection</p>
              <p className="mt-1 mb-0 text-text-main font-black text-[1.05rem]">{describeProfile(profile)}</p>
            </div>
            <button type="button" onClick={saveProfile} className="inline-flex items-center gap-2 border border-[#E7D8C4] bg-[#FAF8F5] text-brand-color px-4 py-3 rounded-2xl font-black cursor-pointer hover:bg-brand-color hover:text-white transition-colors">
              <Save size={16} /> Save profile
            </button>
          </div>

          {savedNotice && <div className="mt-4"><Notification type="success">{savedNotice}</Notification></div>}
        </div>
      </section>

      <section className="flex justify-between items-end gap-3 my-7">
        <div>
          <p className="inline-flex items-center gap-2 m-0 text-brand-color font-black uppercase tracking-[0.08em] text-[0.8rem]"><SlidersHorizontal size={16} /> Live results</p>
          <h2 className="mt-2 mb-0 text-text-main text-3xl font-black">Suitable drinks</h2>
        </div>
        <div className="text-gray-500 font-bold">{loading ? 'Loading...' : `${filteredProducts.length} matches`}</div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
        {loading ? (
          <div className="col-span-full min-h-[180px] rounded-[22px] border border-dashed border-[#D8C4AF] bg-bg-main flex items-center justify-center gap-2.5 text-gray-500 font-bold">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full min-h-[180px] rounded-[22px] border border-dashed border-[#D8C4AF] bg-bg-main flex items-center justify-center gap-2.5 text-gray-500 font-bold">
            <Sparkles size={22} /> No close matches yet. Try a different alcohol type or price band.
          </div>
        ) : (
          filteredProducts.map((product) => <ProductCard key={product.id} product={product} isFavorited={favoriteIds.includes(String(product.id))} onToggleFavorite={toggleFavorite} />)
        )}
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 mt-7">
        <div className="flex gap-3.5 items-start p-4.5 bg-white border border-[#EFE7DB] rounded-[20px]">
          <Star className="text-brand-color shrink-0" size={28} />
          <div>
            <h3 className="m-0 mb-1.5 text-text-main text-[1.05rem] font-black">All alcohol types</h3>
            <p className="m-0 text-text-muted leading-[1.6]">The menu can grow to new categories by changing config, not page logic.</p>
          </div>
        </div>
        <div className="flex gap-3.5 items-start p-4.5 bg-white border border-[#EFE7DB] rounded-[20px]">
          <Heart className="text-brand-color shrink-0" size={28} />
          <div>
            <h3 className="m-0 mb-1.5 text-text-main text-[1.05rem] font-black">Save your preferences</h3>
            <p className="m-0 text-text-muted leading-[1.6]">Create an account when you want the selected filters remembered permanently.</p>
          </div>
        </div>
      </section>

      <section className="mt-7 text-center py-7.5 px-5.5 rounded-3xl bg-[#F5F0E8] border border-[#E7D8C4]">
        <h2 className="m-0 mb-2.5 text-brand-color text-[1.6rem] font-black">Want these filters tied to your account?</h2>
        <p className="m-0 mb-4.5 text-text-muted leading-[1.6]">Create an account now and the same profile can be reused later for recommendations.</p>
        <div className="flex justify-center gap-3 flex-wrap">
          <button type="button" onClick={createAccount} className="inline-flex items-center gap-2.5 px-4.5 py-3.5 rounded-2xl border border-brand-color bg-brand-color text-white font-extrabold cursor-pointer hover:bg-opacity-90 transition-colors no-underline">
            Create account
          </button>
          <Link to="/login" className="inline-flex items-center justify-center px-4.5 py-3.5 rounded-2xl border border-[#E7D8C4] bg-white text-brand-color font-black no-underline hover:bg-gray-50 transition-colors">Sign in instead</Link>
        </div>
      </section>
    </div>
  );
}
