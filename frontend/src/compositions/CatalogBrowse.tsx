import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import RangeField from '../components/alcohol/RangeField';
import SelectField from '../components/alcohol/SelectField';
import type { FavoriteDto, ProductDto } from '../types';
import {
  BEER_CLASS_OPTIONS,
  BEER_STYLE_FAMILIES,
  WINE_AROMA_OPTIONS,
  WINE_COLOR_OPTIONS,
  WINE_STYLE_OPTIONS,
  WINE_SWEETNESS_OPTIONS,
} from '../utils/alcoholOptions';
import { apiRoutes } from '../api/routes';
import { apiFetch, userHeaders } from '../utils/api';
import {
  alcoholTypeOptions,
  buildCatalogQuery,
  getPriceBandForProduct,
  normalizeCatalogCategory,
  normalizePriceBand,
  priceBandOptions,
  type CatalogCategory,
  type PriceBand,
} from '../utils/catalogFilters';
import { buildProductsApiQuery, parseProductList } from '../utils/productApi';

export default function CatalogBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [beerStyle, setBeerStyle] = useState('');
  const [beerClass, setBeerClass] = useState('');
  const [beerIbu, setBeerIbu] = useState(60);
  const [beerSrm, setBeerSrm] = useState(40);
  const [wineStyle, setWineStyle] = useState('');
  const [wineColor, setWineColor] = useState('');
  const [wineSweetness, setWineSweetness] = useState('');
  const [wineAroma, setWineAroma] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [allProducts, setAllProducts] = useState<ProductDto[]>([]);
  const pageSize = 20;

  const selectedCategory = normalizeCatalogCategory(searchParams.get('type'));
  const selectedPriceBand = normalizePriceBand(searchParams.get('price'));

  useEffect(() => {
    setPage(1);
  }, [
    selectedCategory,
    selectedPriceBand,
    beerStyle,
    beerClass,
    beerIbu,
    beerSrm,
    wineStyle,
    wineColor,
    wineSweetness,
    wineAroma,
  ]);

  useEffect(() => {
    void apiFetch<unknown>(apiRoutes.products.list('page=1&pageSize=1000'), { credentials: 'omit' })
      .then((data) => setAllProducts(parseProductList<ProductDto>(data).items))
      .catch(() => setAllProducts([]));
  }, []);

  useEffect(() => {
    const loadCatalog = async () => {
      setLoading(true);

      try {
        const query = buildProductsApiQuery({
          category: selectedCategory,
          priceBand: selectedPriceBand,
          beerStyle: selectedCategory === 'Beer' ? beerStyle : undefined,
          beerColor: selectedCategory === 'Beer' ? beerClass : undefined,
          maxIbu: selectedCategory === 'Beer' ? beerIbu : undefined,
          maxSrm: selectedCategory === 'Beer' ? beerSrm : undefined,
          wineStyle: selectedCategory === 'Wine' ? wineStyle : undefined,
          wineColor: selectedCategory === 'Wine' ? wineColor : undefined,
          wineSweetness: selectedCategory === 'Wine' ? wineSweetness : undefined,
          sortBy: 'rating',
          sortDir: 'desc',
          page,
          pageSize,
        });

        const productsData = await apiFetch<unknown>(apiRoutes.products.list(query), { credentials: 'omit' });
        const parsed = parseProductList<ProductDto>(productsData);
        const filteredItems = selectedCategory === 'Wine' && wineAroma
          ? parsed.items.filter((product) =>
              (product.wineAromas ?? []).some((aroma) => aroma.toLowerCase() === wineAroma.toLowerCase()))
          : parsed.items;

        setProducts(filteredItems);
        setTotalCount(wineAroma && selectedCategory === 'Wine' ? filteredItems.length : parsed.totalCount);
        setTotalPages(wineAroma && selectedCategory === 'Wine'
          ? Math.max(1, Math.ceil(filteredItems.length / pageSize))
          : parsed.totalPages);
      } catch (error) {
        console.error('Failed to load products', error);
        setProducts([]);
        setTotalCount(0);
        setTotalPages(1);
      }

      try {
        const headers = await userHeaders();
        const favoritesData = await apiFetch<FavoriteDto[]>(apiRoutes.favorites.list, { headers });
        setFavIds(Array.isArray(favoritesData) ? favoritesData.map((favorite) => String(favorite.id)) : []);
      } catch (error) {
        console.error('Failed to load favorites', error);
        setFavIds([]);
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, [
    beerClass,
    beerIbu,
    beerSrm,
    beerStyle,
    page,
    selectedCategory,
    selectedPriceBand,
    wineAroma,
    wineColor,
    wineStyle,
    wineSweetness,
  ]);

  const categoryAveragePrice = useMemo(() => {
    const relevantProducts = selectedCategory === 'All'
      ? allProducts
      : allProducts.filter((product) => (product.categoryName ?? '').toLowerCase() === selectedCategory.toLowerCase());

    const prices = relevantProducts
      .map((product) => Number(product.basePrice ?? 0))
      .filter((price) => Number.isFinite(price) && price > 0);

    if (prices.length === 0) {
      return 0;
    }

    return prices.reduce((total, price) => total + price, 0) / prices.length;
  }, [allProducts, selectedCategory]);

  const averagesByCategory = useMemo(() => {
    const cats: CatalogCategory[] = ['All', 'Beer', 'Wine', 'Other'];
    const map: Record<string, number> = {};
    cats.forEach((category) => {
      const scoped = category === 'All'
        ? allProducts
        : allProducts.filter((product) => (product.categoryName ?? '').toLowerCase() === category.toLowerCase());
      const prices = scoped
        .map((product) => Number(product.basePrice ?? 0))
        .filter((price) => Number.isFinite(price) && price > 0);
      map[category] = prices.length > 0
        ? prices.reduce((total, price) => total + price, 0) / prices.length
        : 0;
    });
    return map;
  }, [allProducts]);

  const priceBandDropdownOptions = useMemo(() => {
    const average = categoryAveragePrice > 0 ? categoryAveragePrice : 0;

    const formatMoney = (value: number) => `${Math.round(value)} PLN`;

    return priceBandOptions.map((band) => {
      if (band.value === 'Any') {
        return { ...band, hint: average > 0 ? `All prices in ${selectedCategory.toLowerCase()} catalog` : 'show everything' };
      }

      if (average <= 0) {
        return { ...band, hint: 'No average price yet' };
      }

      const budgetMax = average * 0.85;
      const classicMin = budgetMax;
      const classicMax = average * 1.05;
      const premiumMin = classicMax;
      const premiumMax = average * 1.3;
      const luxuryMin = premiumMax;

      const hints: Record<PriceBand, string> = {
        Any: band.hint,
        Budget: `up to ${formatMoney(budgetMax)}`,
        Classic: `${formatMoney(classicMin)} – ${formatMoney(classicMax)}`,
        Premium: `${formatMoney(premiumMin)} – ${formatMoney(premiumMax)}`,
        Luxury: `from ${formatMoney(luxuryMin)}`,
      };

      return { ...band, hint: hints[band.value] };
    });
  }, [categoryAveragePrice, selectedCategory]);

  const visibleProducts = products;

  const toggleFavorite = async (productId: number | string) => {
    const favoriteId = String(productId);
    const isFav = favIds.includes(favoriteId);
    const headers = await userHeaders({ 'Content-Type': 'application/json' });

    if (isFav) {
      await apiFetch(apiRoutes.favorites.byProductId(productId), { method: 'DELETE', headers, parseJson: false });
      setFavIds(favIds.filter((id) => id !== favoriteId));
    } else {
      await apiFetch(apiRoutes.favorites.byProductId(productId), { method: 'POST', headers, parseJson: false });
      setFavIds([...favIds, favoriteId]);
    }
  };

  const updateQuery = (category: CatalogCategory, priceBand: PriceBand) => {
    setSearchParams(buildCatalogQuery(category, priceBand));
  };

  return (
    <div className="max-w-[1240px] mx-auto pt-3 px-2 pb-0">
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <section className="flex justify-between items-start gap-5 mb-7">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-text-main text-orange-50 text-[0.85rem] font-extrabold mb-4.5"><Sparkles size={16} /> Catalog</div>
          <h1 className="text-[clamp(2rem,4vw,3.6rem)] leading-[1.05] m-0 text-text-main max-w-[16ch] font-black tracking-tight">Refine by type, then let category averages set the price bands.</h1>
          <p className="text-[1.02rem] leading-[1.7] text-text-muted max-w-[68ch] mt-3.5">
            The price category is derived from the average price of the selected alcohol type. After that you can narrow beer by IBU and SRM, or wine by style, color, and sweetness.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-4">
            <span className="px-3 py-2 rounded-full bg-[#FAF5EE] border border-[#EBDCC8] text-brand-color font-bold text-[0.85rem]">Selected type: {selectedCategory}</span>
            <span className="px-3 py-2 rounded-full bg-[#FAF5EE] border border-[#EBDCC8] text-brand-color font-bold text-[0.85rem]">Price band: {selectedPriceBand}</span>
            <span className="px-3 py-2 rounded-full bg-[#FAF5EE] border border-[#EBDCC8] text-brand-color font-bold text-[0.85rem]">Average price: {categoryAveragePrice ? `${categoryAveragePrice.toFixed(2)} PLN` : 'n/a'}</span>
          </div>
        </div>

      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4.5">
        <div className="bg-white border border-[#EFE2D0] rounded-3xl p-4.5">
          <div className="text-brand-color uppercase tracking-widest text-[0.74rem] font-black mb-2.5">Alcohol type</div>
          <SelectField
            value={selectedCategory}
            onChange={(value) => updateQuery(value as CatalogCategory, selectedPriceBand)}
            options={[{ label: 'All', value: 'All' }, ...alcoholTypeOptions]}
          />
        </div>

        <div className="bg-white border border-[#EFE2D0] rounded-3xl p-4.5">
          <div className="text-brand-color uppercase tracking-widest text-[0.74rem] font-black mb-2.5">Price band</div>
          <SelectField
            value={selectedPriceBand}
            onChange={(value) => updateQuery(selectedCategory, value as PriceBand)}
            options={priceBandDropdownOptions}
          />
        </div>
        
      </section>

      {selectedCategory === 'Beer' && (
        <section key="beer-filters" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4.5 animate-[fadeUp_280ms_ease_both]">
          <div className="bg-white border border-[#EFE2D0] rounded-3xl p-4.5">
            <div className="text-brand-color uppercase tracking-widest text-[0.74rem] font-black mb-2.5">Style</div>
            <SelectField value={beerStyle} onChange={setBeerStyle} placeholder="Any beer style" options={BEER_STYLE_FAMILIES} />
          </div>
          <div className="bg-white border border-[#EFE2D0] rounded-3xl p-4.5">
            <div className="text-brand-color uppercase tracking-widest text-[0.74rem] font-black mb-2.5">Class</div>
            <SelectField value={beerClass} onChange={setBeerClass} placeholder="Any beer class" options={BEER_CLASS_OPTIONS} />
          </div>
          <div className="bg-white border border-[#EFE2D0] rounded-3xl p-4.5">
            <RangeField
              label="IBU"
              value={beerIbu}
              onChange={setBeerIbu}
              min={0}
              max={120}
              leftLabel="Smooth"
              rightLabel="Bitter"
              marks={[{ label: 'Low', value: 15 }, { label: 'Mid', value: 50 }, { label: 'High', value: 85 }]}
              helperText="Keep only beers under this bitterness ceiling."
            />
          </div>
          <div className="bg-white border border-[#EFE2D0] rounded-3xl p-4.5">
            <RangeField
              label="SRM"
              value={beerSrm}
              onChange={setBeerSrm}
              min={0}
              max={80}
              leftLabel="Pale"
              rightLabel="Dark"
              marks={[{ label: 'Pale', value: 12 }, { label: 'Amber', value: 38 }, { label: 'Brown', value: 65 }, { label: 'Dark', value: 88 }]}
              helperText="Keep only beers under this color intensity."
            />
          </div>
        </section>
      )}

      {selectedCategory === 'Wine' && (
        <section key="wine-filters" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4.5 animate-[fadeUp_280ms_ease_both]">
          <div className="bg-white border border-[#EFE2D0] rounded-3xl p-4.5">
            <div className="text-brand-color uppercase tracking-widest text-[0.74rem] font-black mb-2.5">Style</div>
            <SelectField value={wineStyle} onChange={setWineStyle} placeholder="Any wine style" options={WINE_STYLE_OPTIONS} />
          </div>
          <div className="bg-white border border-[#EFE2D0] rounded-3xl p-4.5">
            <div className="text-brand-color uppercase tracking-widest text-[0.74rem] font-black mb-2.5">Color</div>
            <SelectField value={wineColor} onChange={setWineColor} placeholder="Any wine color" options={WINE_COLOR_OPTIONS} />
          </div>
          <div className="bg-white border border-[#EFE2D0] rounded-3xl p-4.5">
            <div className="text-brand-color uppercase tracking-widest text-[0.74rem] font-black mb-2.5">Sweetness</div>
            <SelectField value={wineSweetness} onChange={setWineSweetness} placeholder="Any sweetness" options={WINE_SWEETNESS_OPTIONS} />
          </div>
          <div className="bg-white border border-[#EFE2D0] rounded-3xl p-4.5">
            <div className="text-brand-color uppercase tracking-widest text-[0.74rem] font-black mb-2.5">Aroma</div>
            <SelectField value={wineAroma} onChange={setWineAroma} placeholder="Any aroma" options={WINE_AROMA_OPTIONS} />
          </div>
        </section>
      )}

      <div className="my-5 font-extrabold text-text-main">{totalCount} matches · page {page} of {totalPages}</div>
      {loading && <div className="mb-3.5 text-text-muted font-semibold">Loading products…</div>}

      <section className="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-5.5">
        {visibleProducts.length === 0 ? (
          <div className="col-span-full p-9 rounded-3xl border border-dashed border-[#E7D8C4] bg-[#FAF8F5] text-center text-text-muted font-semibold">No drinks match the current filters. Try widening the price band or switching the category.</div>
        ) : (
          visibleProducts.map((item) => {
            const itemCat = normalizeCatalogCategory(item.categoryName);
            const itemAvg = averagesByCategory[itemCat] ?? categoryAveragePrice;
            const priceBand = getPriceBandForProduct(item.basePrice, itemAvg);

            return (
              <ProductCard
                key={item.id}
                product={item}
                isFavorited={favIds.includes(String(item.id))}
                onToggleFavorite={toggleFavorite}
                priceBandLabel={priceBand}
              />
            );
          })
        )}
      </section>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button type="button" className="px-4 py-2.5 rounded-full border border-stone-300 bg-white font-bold cursor-pointer hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Previous
          </button>
          <span className="text-stone-600 font-bold">Page {page} / {totalPages}</span>
          <button type="button" className="px-4 py-2.5 rounded-full border border-stone-300 bg-white font-bold cursor-pointer hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={page >= totalPages || loading} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
