import React from 'react';
import { Heart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
};

type ProductCardProps = {
  product: ProductDto;
  isFavorited?: boolean;
  onToggleFavorite?: (productId: number | string) => void;
  priceBandLabel?: string;
  recommendedProducts?: Array<ProductDto & { priceBandLabel?: string }>;
};

export default function ProductCard({
  product,
  isFavorited = false,
  onToggleFavorite,
  priceBandLabel,
  recommendedProducts,
}: ProductCardProps) {
  const [isHover, setIsHover] = React.useState(false);
  const [favHover, setFavHover] = React.useState(false);
  const navigate = useNavigate();
  const categoryLabel = product.categoryName || 'Alcohol';
  const avgRating = typeof product.avgRating === 'number' ? product.avgRating : Number(product.avgRating ?? 0);
  const reviewsLabel = (product.reviewsCount || 0) === 1 ? 'review' : 'reviews';
  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return '—';
    return String(value)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .trim();
  };

  const styleLabel = formatValue(product.beerStyle ?? product.wineStyle);
  const classLabel = formatValue(product.beerColor ?? product.wineColor);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/product/${product.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/product/${product.id}`); }}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        backgroundColor: 'white',
        borderRadius: '28px',
        width: '100%',
        height: '100%',
        padding: '25px',
        boxShadow: isHover ? '0 26px 56px rgba(93, 64, 55, 0.12)' : '0 14px 32px rgba(93, 64, 55, 0.06)',
        border: '1px solid rgba(243, 244, 246, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        transform: isHover ? 'translateY(-8px) scale(1.01)' : 'none',
        cursor: 'pointer'
      }}
    >
      <div
        style={{
          // Use a fixed aspect ratio so all product images share the same frame
          aspectRatio: '4 / 3',
          width: '100%',
          backgroundColor: '#FAF9F6',
          borderRadius: '20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 180,
        }}
      >
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 3, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{
            background: 'rgba(255,255,255,0.9)',
            padding: '6px 10px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            color: '#6B7280',
            border: '1px solid #F3F4F6',
            display: 'inline-block'
          }}>
            {categoryLabel}
          </span>
          {priceBandLabel ? (
            <span
              style={{
                background: '#2D2424',
                color: '#FFF7ED',
                padding: '6px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'inline-block'
              }}
            >
              {priceBandLabel}
            </span>
          ) : null}
        </div>
        {product.imageUrl ? (
          <div style={{ position: 'absolute', inset: 0, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF9F6' }}>
              <img src={product.imageUrl} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', objectPosition: 'center', background: '#FAF9F6', display: 'block' }} />
            </div>
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', zIndex: 1, padding: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.4rem' }}>🖼️</div>
              <div style={{ marginTop: 8, fontWeight: 700 }}>No image</div>
            </div>
          </div>
        )}
        {/* priceBandLabel now shown under category label */}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#2D2424', margin: 0, fontWeight: '800' }}>{product.name}</h2>
        <button
          onClick={(e) => { e.stopPropagation(); if (onToggleFavorite) onToggleFavorite(product.id); }}
          onMouseEnter={() => setFavHover(true)}
          onMouseLeave={() => setFavHover(false)}
          aria-label="favorite"
          style={{
            background: favHover ? '#fff7ed' : 'transparent',
            border: 'none',
            padding: '8px',
            borderRadius: 12,
            cursor: 'pointer',
            boxShadow: favHover ? '0 8px 24px rgba(45,36,36,0.12)' : '0 4px 10px rgba(0,0,0,0.04)',
            transform: favHover ? 'translateY(-2px) scale(1.04)' : 'none',
            transition: 'transform 180ms ease, box-shadow 180ms ease, background 180ms ease'
          }}
        >
          <Heart size={18} fill={isFavorited ? '#EF4444' : 'none'} color={isFavorited ? '#EF4444' : '#9CA3AF'} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#92400E' }}>
        <Star size={16} fill="#F59E0B" color="#F59E0B" />
        <span style={{ fontWeight: '700' }}>{avgRating.toFixed(1)}</span>
        <span style={{ color: '#9CA3AF' }}>({product.reviewsCount || 0} {reviewsLabel})</span>
      </div>

      <p style={{ color: '#6B7280', fontSize: '1rem', lineHeight: '1.5', marginBottom: '25px', flexGrow: 1 }}>{product.description}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div style={{ background: '#FAF9F6', borderRadius: '16px', padding: '14px' }}>
          <span style={{ display: 'block', fontSize: '0.72rem', color: '#9CA3AF', marginBottom: '5px' }}>PRICE</span>
          <div>
            <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#5D4037' }}>{product.basePrice} PLN</span>
          </div>
        </div>
        <div style={{ background: '#FAF9F6', borderRadius: '16px', padding: '14px' }}>
          <span style={{ display: 'block', fontSize: '0.72rem', color: '#9CA3AF', marginBottom: '5px' }}>ABV</span>
          <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#5D4037' }}>{product.strengthAbv ?? '—'}%</span>
        </div>
        <div style={{ background: '#FAF9F6', borderRadius: '16px', padding: '14px' }}>
          <span style={{ display: 'block', fontSize: '0.72rem', color: '#9CA3AF', marginBottom: '5px' }}>STYLE</span>
          <span style={{ fontSize: '0.98rem', fontWeight: '700', color: '#2D2424' }}>{styleLabel}</span>
        </div>
        <div style={{ background: '#FAF9F6', borderRadius: '16px', padding: '14px'}}>
          <span style={{ display: 'block', fontSize: '0.72rem', color: '#9CA3AF', marginBottom: '5px' }}>CLASS</span>
          <span style={{ fontSize: '0.98rem', fontWeight: '700', color: '#2D2424' }}>{classLabel}</span>
        </div>
      </div>

      {recommendedProducts && recommendedProducts.length > 0 ? (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Recommended</div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
            {recommendedProducts.map(r => (
              <div key={r.id} style={{ minWidth: 140, flex: '0 0 auto', background: '#FFFFFF', borderRadius: 12, padding: 8, border: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', height: 90, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF9F6' }}>
                  {r.imageUrl ? <img src={r.imageUrl} alt={r.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} /> : <div style={{ fontSize: '1.6rem' }}>🖼️</div>}
                </div>
                <div style={{ marginTop: 8, fontWeight: 700, textAlign: 'center' }}>{r.name}</div>
                <div style={{ marginTop: 6, fontWeight: 800, color: '#5D4037' }}>{r.basePrice} PLN</div>
                {r.priceBandLabel ? <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>{r.priceBandLabel}</div> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ height: 8 }} />
    </div>
  );
}