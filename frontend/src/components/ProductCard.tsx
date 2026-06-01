import { useLayoutEffect, useRef, useState } from 'react';
import { Heart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ProductDto } from '../types';
import { resolveProductImageSrc } from '../utils/productImages';

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
  const imageSrc = resolveProductImageSrc(product.imageUrl);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const [visibleDescription, setVisibleDescription] = useState(product.description ?? '');

  useLayoutEffect(() => {
    const element = descriptionRef.current;
    if (!element) return;

    const fullText = product.description ?? '';
    const words = fullText.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      setVisibleDescription('');
      return;
    }

    const availableWidth = element.clientWidth;
    if (availableWidth <= 0) return;

    const style = window.getComputedStyle(element);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    context.font = `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    const measure = (text: string) => context.measureText(text).width;
    const lines: string[] = [];
    let currentLine = '';

    for (let index = 0; index < words.length; index += 1) {
      const word = words[index];
      const candidate = currentLine ? `${currentLine} ${word}` : word;

      if (measure(candidate) <= availableWidth) {
        currentLine = candidate;
        continue;
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      currentLine = word;

      if (lines.length === 2) {
        setVisibleDescription(`${lines.slice(0, 2).join(' ')}...`);
        return;
      }

      if (measure(currentLine) > availableWidth) {
        // Very long single word: keep it and truncate visually by the browser.
        lines.push(currentLine);
        currentLine = '';
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    if (lines.length <= 2) {
      setVisibleDescription(fullText);
      return;
    }

    setVisibleDescription(`${lines.slice(0, 2).join(' ')}...`);
  }, [product.description]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/product/${product.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/product/${product.id}`); }}
      className="bg-bg-card rounded-[28px] w-full h-full p-6 flex flex-col shadow-[0_14px_32px_rgba(93,64,55,0.06)] border border-gray-100 transition-all duration-200 ease-out hover:-translate-y-2 hover:scale-[1.01] hover:shadow-[0_26px_56px_rgba(93,64,55,0.12)] cursor-pointer group"
    >
      <div className="aspect-4/3 w-full bg-bg-main rounded-2xl mb-5 flex items-center justify-center relative overflow-hidden min-h-45">
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          <span className="bg-white/90 px-2.5 py-1.5 rounded-full text-xs text-gray-500 border border-gray-100 inline-block">
            {categoryLabel}
          </span>
          {priceBandLabel && (
            <span className="bg-text-main text-orange-50 px-2.5 py-1.5 rounded-full text-xs font-extrabold inline-block">
              {priceBandLabel}
            </span>
          )}
        </div>
        
        {imageSrc ? (
          <div className="absolute inset-0 p-3 flex items-center justify-center z-0">
            <div className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center bg-bg-main">
              <img src={imageSrc} alt={product.name} className="max-w-full max-h-full object-contain object-center bg-bg-main block" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-0 p-3">
            <div className="text-center">
              <div className="text-4xl">🖼️</div>
              <div className="mt-2 font-bold">No image</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-2xl text-text-main m-0 font-extrabold">{product.name}</h2>
        <button
          onClick={(e) => { e.stopPropagation(); if (onToggleFavorite) onToggleFavorite(product.id); }}
          aria-label="favorite"
          className="bg-transparent hover:bg-orange-50 border-none p-2 rounded-xl cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(45,36,36,0.12)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.04]"
        >
          <Heart size={18} fill={isFavorited ? '#EF4444' : 'none'} color={isFavorited ? '#EF4444' : '#9CA3AF'} />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3 text-amber-800">
        <Star size={16} fill="#F59E0B" color="#F59E0B" />
        <span className="font-bold">{avgRating.toFixed(1)}</span>
        <span className="text-gray-400">({product.reviewsCount || 0} {reviewsLabel})</span>
      </div>

      <p ref={descriptionRef} className="text-gray-500 text-base leading-relaxed mb-6 grow overflow-hidden">
        {visibleDescription}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4.5">
        <div className="bg-bg-main rounded-2xl p-3.5">
          <span className="block text-xs text-gray-400 mb-1">PRICE</span>
          <span className="text-lg font-extrabold text-brand-color">{product.basePrice} PLN</span>
        </div>
        <div className="bg-bg-main rounded-2xl p-3.5">
          <span className="block text-xs text-gray-400 mb-1">ABV</span>
          <span className="text-lg font-extrabold text-brand-color">{product.strengthAbv ?? '—'}%</span>
        </div>
        <div className="bg-bg-main rounded-2xl p-3.5">
          <span className="block text-xs text-gray-400 mb-1">STYLE</span>
          <span className="text-[0.98rem] font-bold text-text-main">{styleLabel}</span>
        </div>
        <div className="bg-bg-main rounded-2xl p-3.5">
          <span className="block text-xs text-gray-400 mb-1">CLASS</span>
          <span className="text-[0.98rem] font-bold text-text-main">{classLabel}</span>
        </div>
      </div>

      {recommendedProducts && recommendedProducts.length > 0 && (
        <div className="mt-1.5">
          <div className="text-sm font-bold text-gray-700 mb-2">Recommended</div>
          <div className="flex gap-3 overflow-x-auto pb-1.5 scrollbar-hide">
            {recommendedProducts.map(r => (
              <div key={r.id} className="min-w-35 flex-none bg-white rounded-xl p-2 border border-gray-100 flex flex-col items-center">
                <div className="w-full h-22.5 rounded-lg overflow-hidden flex items-center justify-center bg-bg-main">
                  {resolveProductImageSrc(r.imageUrl) ? <img src={resolveProductImageSrc(r.imageUrl)} alt={r.name} className="max-w-full max-h-full object-contain block" /> : <div className="text-2xl">🖼️</div>}
                </div>
                <div className="mt-2 font-bold text-center text-sm">{r.name}</div>
                <div className="mt-1.5 font-extrabold text-brand-color text-sm">{r.basePrice} PLN</div>
                {r.priceBandLabel && <div className="text-xs text-gray-500 mt-1">{r.priceBandLabel}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="h-2" />
    </div>
  );
}