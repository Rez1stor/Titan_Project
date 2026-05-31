import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import ProductCard, { type ProductDto } from '../components/ProductCard';
import RangeField from '../components/alcohol/RangeField';
import SelectField from '../components/alcohol/SelectField';
import {
  alcoholTypeOptions,
  buildCatalogQuery,
  getCategoryAveragePrice,
  getPriceBandForProduct,
  matchesPriceBand,
  normalizeCatalogCategory,
  normalizePriceBand,
  priceBandOptions,
  type CatalogCategory,
  type PriceBand,
} from '../utils/catalogFilters';

type FavoriteDto = {
  id: number | string;
};

const beerStyleOptions = [
  { label: 'Lager', value: 'Lager' },
  { label: 'Ale', value: 'Ale' },
  { label: 'Wheat', value: 'Wheat' },
  { label: 'Sour', value: 'Sour' },
  { label: 'Belgian', value: 'Belgian' },
];

const beerClassOptions = [
  { label: 'Pale', value: 'Pale' },
  { label: 'Amber', value: 'Amber' },
  { label: 'Brown', value: 'Brown' },
  { label: 'Dark', value: 'Dark' },
];

const wineStyleOptions = [
  { label: 'Still', value: 'Still' },
  { label: 'Sparkling', value: 'Sparkling' },
  { label: 'Fortified', value: 'Fortified' },
  { label: 'Dessert', value: 'Dessert' },
  { label: 'Other', value: 'Other' },
];

const wineColorOptions = [
  { label: 'Red', value: 'Red' },
  { label: 'White', value: 'White' },
  { label: 'Rose', value: 'Rose' },
  { label: 'Orange', value: 'Orange' },
];

const wineSweetnessOptions = [
  { label: 'Dry', value: 'Dry' },
  { label: 'Semi-dry', value: 'SemiDry' },
  { label: 'Semi-sweet', value: 'SemiSweet' },
  { label: 'Sweet', value: 'Sweet' },
  { label: 'Dessert', value: 'Dessert' },
  { label: 'Other', value: 'Other' },
];

const wineAromaOptions = [
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

export default function Catalog() {
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

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const productsResponse = await fetch('/api/products');
        const productsData = await productsResponse.json();
        setProducts(Array.isArray(productsData) ? productsData : productsData.value ?? []);
      } catch (error) {
        console.error('Failed to load products', error);
      }

      try {
        const favoritesResponse = await fetch('/api/Favorites', { headers: { 'X-User-Id': '1' } });
        if (favoritesResponse.ok) {
          const favoritesData = await favoritesResponse.json();
          setFavIds(Array.isArray(favoritesData) ? favoritesData.map((favorite: FavoriteDto) => String(favorite.id)) : []);
        } else {
          setFavIds([]);
        }
      } catch (error) {
        console.error('Failed to load favorites', error);
        setFavIds([]);
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, []);

  const selectedCategory = normalizeCatalogCategory(searchParams.get('type'));
  const selectedPriceBand = normalizePriceBand(searchParams.get('price'));

  const categoryAveragePrice = useMemo(() => getCategoryAveragePrice(products, selectedCategory), [products, selectedCategory]);

  const averagesByCategory = useMemo(() => {
    const cats: CatalogCategory[] = ['All', 'Beer', 'Wine', 'Other'];
    const map: Record<string, number> = {};
    cats.forEach((c) => { map[c] = getCategoryAveragePrice(products, c); });
    return map;
  }, [products]);

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

  const visibleProducts = useMemo(() => {
    const categoryScopedProducts = selectedCategory === 'All'
      ? products
      : products.filter((product) => (product.categoryName ?? '').toLowerCase() === selectedCategory.toLowerCase());

    return categoryScopedProducts
      .filter((product) => {
        const productCat = normalizeCatalogCategory(product.categoryName);
        const avg = averagesByCategory[productCat] ?? categoryAveragePrice;
        return matchesPriceBand(product.basePrice, avg, selectedPriceBand);
      })
      .filter((product) => {
        if (selectedCategory === 'Beer') {
          const matchesStyle = beerStyle ? (product.beerStyle ?? '').toLowerCase().includes(beerStyle.toLowerCase()) : true;
          const matchesClass = beerClass ? (product.beerColor ?? '').toLowerCase().includes(beerClass.toLowerCase()) : true;
          const ibu = Number(product.beerIbu ?? 0);
          const srm = Number(product.beerSrm ?? 0);
          return matchesStyle && matchesClass && ibu <= beerIbu && srm <= beerSrm;
        }

        if (selectedCategory === 'Wine') {
          const matchesStyle = wineStyle ? (product.wineStyle ?? '').toLowerCase().includes(wineStyle.toLowerCase()) : true;
          const matchesColor = wineColor ? (product.wineColor ?? '').toLowerCase().includes(wineColor.toLowerCase()) : true;
          const matchesSweetness = wineSweetness ? (product.wineSweetness ?? '').toLowerCase() === wineSweetness.toLowerCase() : true;
          const matchesAroma = wineAroma ? (product.wineAromas ?? []).some((aroma) => aroma.toLowerCase() === wineAroma.toLowerCase()) : true;
          return matchesStyle && matchesColor && matchesSweetness && matchesAroma;
        }

        return true;
      })
      .sort((left, right) => Number(right.avgRating ?? 0) - Number(left.avgRating ?? 0));
  }, [beerClass, beerIbu, beerSrm, beerStyle, categoryAveragePrice, products, selectedCategory, selectedPriceBand, wineAroma, wineColor, wineStyle, wineSweetness]);

  const toggleFavorite = (productId: number | string) => {
    const favoriteId = String(productId);
    const isFav = favIds.includes(favoriteId);
    if (isFav) {
      fetch(`/api/Favorites/${productId}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': '1' },
      }).then(() => setFavIds(favIds.filter((id) => id !== favoriteId)));
    } else {
      fetch(`/api/Favorites/${productId}`, {
        method: 'POST',
        headers: { 'X-User-Id': '1', 'Content-Type': 'application/json' },
      }).then(() => setFavIds([...favIds, favoriteId]));
    }
  };

  const updateQuery = (category: CatalogCategory, priceBand: PriceBand) => {
    setSearchParams(buildCatalogQuery(category, priceBand));
  };

  return (
    <div style={pageStyle}>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <section style={headerStyle}>
        <div>
          <div style={eyebrowStyle}><Sparkles size={16} /> Catalog</div>
          <h1 style={titleStyle}>Refine by type, then let category averages set the price bands.</h1>
          <p style={descriptionStyle}>
            The price category is derived from the average price of the selected alcohol type. After that you can narrow beer by IBU and SRM, or wine by style, color, and sweetness.
          </p>
          <div style={metaRowStyle}>
            <span style={metaPillStyle}>Selected type: {selectedCategory}</span>
            <span style={metaPillStyle}>Price band: {selectedPriceBand}</span>
            <span style={metaPillStyle}>Average price: {categoryAveragePrice ? `${categoryAveragePrice.toFixed(2)} PLN` : 'n/a'}</span>
          </div>
        </div>

      </section>

      <section style={toolbarStyle}>
        <div style={toolbarCardStyle}>
          <div style={fieldLabelStyle}>Alcohol type</div>
          <SelectField
            value={selectedCategory}
            onChange={(value) => updateQuery(value as CatalogCategory, selectedPriceBand)}
            options={[{ label: 'All', value: 'All' }, ...alcoholTypeOptions]}
          />
        </div>

        <div style={toolbarCardStyle}>
          <div style={fieldLabelStyle}>Price band</div>
          <SelectField
            value={selectedPriceBand}
            onChange={(value) => updateQuery(selectedCategory, value as PriceBand)}
            options={priceBandDropdownOptions}
          />
        </div>
        
      </section>

      {selectedCategory === 'Beer' ? (
        <section key="beer-filters" style={filtersStyle}>
          <div style={filterCardStyle}>
            <div style={fieldLabelStyle}>Style</div>
            <SelectField value={beerStyle} onChange={setBeerStyle} placeholder="Any beer style" options={beerStyleOptions} />
          </div>
          <div style={filterCardStyle}>
            <div style={fieldLabelStyle}>Class</div>
            <SelectField value={beerClass} onChange={setBeerClass} placeholder="Any beer class" options={beerClassOptions} />
          </div>
          <div style={filterCardStyle}>
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
          <div style={filterCardStyle}>
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
      ) : null}

      {selectedCategory === 'Wine' ? (
        <section key="wine-filters" style={filtersStyle}>
          <div style={filterCardStyle}>
            <div style={fieldLabelStyle}>Style</div>
            <SelectField value={wineStyle} onChange={setWineStyle} placeholder="Any wine style" options={wineStyleOptions} />
          </div>
          <div style={filterCardStyle}>
            <div style={fieldLabelStyle}>Color</div>
            <SelectField value={wineColor} onChange={setWineColor} placeholder="Any wine color" options={wineColorOptions} />
          </div>
          <div style={filterCardStyle}>
            <div style={fieldLabelStyle}>Sweetness</div>
            <SelectField value={wineSweetness} onChange={setWineSweetness} placeholder="Any sweetness" options={wineSweetnessOptions} />
          </div>
          <div style={filterCardStyle}>
            <div style={fieldLabelStyle}>Aroma</div>
            <SelectField value={wineAroma} onChange={setWineAroma} placeholder="Any aroma" options={wineAromaOptions} />
          </div>
        </section>
      ) : null}

      <div style={resultMetaStyle}>{visibleProducts.length} matches</div>
      {loading ? <div style={loadingHintStyle}>Loading products…</div> : null}

      <section style={gridStyle}>
        {visibleProducts.length === 0 ? (
          <div style={emptyStateStyle}>No drinks match the current filters. Try widening the price band or switching the category.</div>
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
    </div>
  );
}

// loadingStyle removed — using inline hint when needed

const loadingHintStyle: React.CSSProperties = {
  margin: '0 0 14px',
  color: '#6B7280',
  fontWeight: 600,
};

const pageStyle: React.CSSProperties = {
  maxWidth: '1240px',
  margin: '0 auto',
  padding: '12px 8px 0',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '20px',
  marginBottom: '28px',
};

const eyebrowStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 14px',
  borderRadius: '999px',
  background: '#2D2424',
  color: '#FFF7ED',
  fontSize: '0.85rem',
  fontWeight: 800,
  marginBottom: '18px',
};

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(2rem, 4vw, 3.6rem)',
  lineHeight: 1.05,
  margin: 0,
  color: '#2D2424',
  maxWidth: '16ch',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '1.02rem',
  lineHeight: 1.7,
  color: '#6B7280',
  maxWidth: '68ch',
  marginTop: '14px',
};

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  marginTop: '16px',
};

const metaPillStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '999px',
  background: '#FAF5EE',
  border: '1px solid #EBDCC8',
  color: '#5D4037',
  fontWeight: 700,
  fontSize: '0.85rem',
};

const toolbarStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '16px',
  marginBottom: '18px',
};

const toolbarCardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #EFE2D0',
  borderRadius: '24px',
  padding: '18px',
};

const filtersStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '16px',
  marginBottom: '18px',
  animation: 'fadeUp 280ms ease both',
};

const filterCardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #EFE2D0',
  borderRadius: '24px',
  padding: '18px',
};

const fieldLabelStyle: React.CSSProperties = {
  color: '#5D4037',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontSize: '0.74rem',
  fontWeight: 900,
  marginBottom: '10px',
};

const resultMetaStyle: React.CSSProperties = {
  margin: '20px 0 14px',
  fontWeight: 800,
  color: '#2D2424',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
  gap: '22px',
};

const emptyStateStyle: React.CSSProperties = {
  gridColumn: '1 / -1',
  padding: '36px',
  borderRadius: '24px',
  border: '1px dashed #E7D8C4',
  background: '#FAF8F5',
  textAlign: 'center',
  color: '#6B7280',
  fontWeight: 600,
};
