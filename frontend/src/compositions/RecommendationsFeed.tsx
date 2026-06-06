import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Heart, Sparkles, SlidersHorizontal, TrendingUp } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import type { LibraryResponse, ProductDto, UserPreferences } from '../types';
import { apiRoutes } from '../api/routes';
import { parseProductList } from '../utils/productApi';
import { apiFetch, userHeaders } from '../utils/api';

type RecommendationSection = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  products: ProductDto[];
  emptyMessage: string;
};

const CARD_GAP = 20;
const MIN_CARD_WIDTH = 260;
const MAX_CARD_WIDTH = 360;

const toProducts = (value: unknown): ProductDto[] => parseProductList<ProductDto>(value).items;

const normalize = (value?: string | null) => (value ?? '').trim().toLowerCase();

const isInPreferenceWindow = (product: ProductDto, preferences?: UserPreferences | null) => {
  if (!preferences) return false;

  const hasAnyPreference =
    (preferences.maxPrice !== null && preferences.maxPrice !== undefined) ||
    (preferences.preferredTags && preferences.preferredTags.length > 0);

  if (!hasAnyPreference) return false;

  if (preferences.maxPrice !== null && preferences.maxPrice !== undefined && Number(product.basePrice ?? 0) > Number(preferences.maxPrice)) {
    return false;
  }

  if (preferences.preferredTags && preferences.preferredTags.length > 0) {
    const haystack = [
      product.categoryName,
      product.beerStyle,
      product.beerColor,
      product.wineStyle,
      product.wineColor,
      product.wineSweetness,
      ...(product.wineAromas ?? []),
      product.name,
      product.description,
    ]
      .filter(Boolean)
      .map((item) => normalize(String(item)))
      .join(' ');

    if (!preferences.preferredTags.some((tag) => haystack.includes(normalize(tag)))) return false;
  }

  return true;
};

type SectionCardProps = RecommendationSection & {
  onToggleFavorite: (productId: number | string) => void;
  cardWidth: number;
  favoriteIds: string[];
};

function SectionCard({ title, description, icon, products, emptyMessage, onToggleFavorite, cardWidth, favoriteIds }: SectionCardProps) {
  // Only show up to 10 items in a section to avoid horizontal scroll fatiguerds only.
  const visibleProducts = products;

  return (
    <section className="bg-gradient-to-b from-white to-[#FFFDF9] border border-[#EEE7DE] rounded-3xl p-6 shadow-[0_20px_50px_rgba(45,36,36,0.05)] overflow-hidden min-w-0">
      <div className="flex flex-col gap-2.5 mb-4.5">
        <div className="inline-flex items-center gap-2 w-fit bg-bg-main border border-[#EFE2D0] rounded-full px-3.5 py-2 text-brand-color font-extrabold">{icon}{title}</div>
        <p className="m-0 text-text-muted leading-relaxed">{description}</p>
      </div>

      {visibleProducts.length === 0 ? (
        <div className="text-center py-10 px-6 rounded-2xl bg-bg-main text-text-muted">{emptyMessage}</div>
      ) : (
        <div className="flex gap-[20px] overflow-x-auto pb-2 snap-x snap-mandatory min-w-0" style={{ WebkitOverflowScrolling: 'touch' }}>
          {visibleProducts.map((item) => (
            <div key={item.id} className="flex self-stretch" style={{ flex: `0 0 ${cardWidth}px`, width: cardWidth, minWidth: cardWidth, maxWidth: cardWidth, scrollSnapAlign: 'start' }}>
              <ProductCard product={item} isFavorited={favoriteIds.includes(String(item.id))} onToggleFavorite={onToggleFavorite} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function RecommendationsFeed() {
  const [likedBasedItems, setLikedBasedItems] = useState<ProductDto[]>([]);
  const [preferenceBasedItems, setPreferenceBasedItems] = useState<ProductDto[]>([]);
  const [popularItems, setPopularItems] = useState<ProductDto[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionsContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const headers = await userHeaders();
        const [likedData, libraryData, productsData, favoritesData] = await Promise.all([
          apiFetch<unknown>(apiRoutes.recommendations.forUser, { headers }).catch(() => []),
          apiFetch<LibraryResponse>(apiRoutes.library, { headers }).catch(() => ({ preferences: undefined } as LibraryResponse)),
          apiFetch<unknown>(apiRoutes.products.list('page=1&pageSize=100'), { credentials: 'omit' }),
          apiFetch<unknown>(apiRoutes.favorites.list, { headers }).catch(() => []),
        ]);

        const allProducts = toProducts(productsData);
        const favorites = toProducts(favoritesData);
        const preferences = libraryData.preferences ?? null;

        const favoriteSeeds = new Set(favorites.map((item) => String(item.id)));
        const likedRecommendations = toProducts(likedData).filter((item) => !favoriteSeeds.has(String(item.id)));

        const preferenceMatches = allProducts
          .filter((product) => isInPreferenceWindow(product, preferences))
          .sort((left, right) => {
            const leftRating = Number(left.avgRating ?? 0);
            const rightRating = Number(right.avgRating ?? 0);
            if (rightRating !== leftRating) return rightRating - leftRating; // primary: avg rating desc
            return Number(right.reviewsCount ?? 0) - Number(left.reviewsCount ?? 0); // tie: reviews count desc
          });

        const popular = [...allProducts]
          .sort((left, right) => {
            const leftRating = Number(left.avgRating ?? 0);
            const rightRating = Number(right.avgRating ?? 0);
            if (rightRating !== leftRating) return rightRating - leftRating; // primary: avg rating desc
            return Number(right.reviewsCount ?? 0) - Number(left.reviewsCount ?? 0); // tie: reviews count desc
          });

        setLikedBasedItems(likedRecommendations);
        setPreferenceBasedItems(preferenceMatches);
        setPopularItems(popular);
        setFavoriteIds(favorites.map((item) => String(item.id)));
      } catch (err) {
        console.error(err);
        setLikedBasedItems([]);
        setPreferenceBasedItems([]);
        setPopularItems([]);
        setFavoriteIds([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  useLayoutEffect(() => {
    const element = sectionsContainerRef.current;
    if (!element) return;

    const updateWidth = () => {
      const measuredWidth = Math.max(
        element.clientWidth,
        element.parentElement?.clientWidth ?? 0,
      );

      setContainerWidth(measuredWidth);
    };
    updateWidth();

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(element);

    return () => observer.disconnect();
  }, [loading]);

  const toggleFavorite = async (productId: number | string) => {
    const favoriteId = String(productId);
    const isFav = favoriteIds.includes(favoriteId);
    const headers = await userHeaders({ 'Content-Type': 'application/json' });

    await apiFetch(apiRoutes.favorites.byProductId(productId), {
      method: isFav ? 'DELETE' : 'POST',
      headers,
      parseJson: false,
    });

    setFavoriteIds((current) => (isFav ? current.filter((id) => id !== favoriteId) : [...current, favoriteId]));
  };

  const sections = useMemo<RecommendationSection[]>(() => [
    {
      id: 'liked',
      title: 'Based on liked products',
      description: 'Suggestions that stay close to the products you already favored.',
      icon: <Heart size={16} />,
      products: likedBasedItems,
      emptyMessage: 'Add a few favorites and this section will start filling with similar picks.',
    },
    {
      id: 'preferences',
      title: 'Based on your account preferences',
      description: 'Matches your saved taste profile from account setup and profile settings.',
      icon: <SlidersHorizontal size={16} />,
      products: preferenceBasedItems,
      emptyMessage: 'No products match your saved preference profile yet.',
    },
    {
      id: 'popular',
      title: 'Popular products',
      description: 'Best-performing products ranked by activity and ratings across the catalog.',
      icon: <TrendingUp size={16} />,
      products: popularItems,
      emptyMessage: 'Popular products will appear here once the catalog has enough activity.',
    },
  ], [likedBasedItems, preferenceBasedItems, popularItems]);

  const cardsPerView = useMemo(() => {
    const availableWidth = Math.max(0, containerWidth);
    if (availableWidth === 0) return 1;

    const maxFit = Math.floor((availableWidth + CARD_GAP) / (MIN_CARD_WIDTH + CARD_GAP));
    return Math.max(1, maxFit || 1);
  }, [containerWidth]);

  const cardWidth = useMemo(() => {
    if (containerWidth === 0) return MAX_CARD_WIDTH;
    const fitWidth = Math.floor((containerWidth - CARD_GAP * (cardsPerView - 1)) / cardsPerView);
    return Math.max(MIN_CARD_WIDTH, Math.min(MAX_CARD_WIDTH, fitWidth));
  }, [cardsPerView, containerWidth]);

  if (loading) {
    return <div className="p-24 text-center text-brand-color">Loading recommendations...</div>;
  }

  return (
    <div className="max-w-[1280px] mx-auto pt-8 px-5 pb-14">
      <div className="text-center mb-7 pt-7 px-6 pb-2.5">
        <div className="inline-flex items-center gap-2.5 bg-[#F5F5DC] px-4.5 py-2 rounded-full text-brand-color font-extrabold mb-3.5"><Sparkles size={18} /> For You</div>
        <h1 className="text-text-main text-[clamp(2.2rem,4vw,3.4rem)] font-black tracking-tight m-0">Three ways to discover your next drink</h1>
        <p className="text-text-muted text-[1.05rem] max-w-[68ch] mx-auto mt-3 leading-relaxed">
          The page now groups recommendations by what you liked, what you told us during account setup, and what is trending in the catalog.
        </p>
      </div>

      <div ref={sectionsContainerRef} className="grid gap-7">
        {sections.map(({ id, ...section }) => (
          <SectionCard key={id} id={id} {...section} onToggleFavorite={toggleFavorite} cardWidth={cardWidth} favoriteIds={favoriteIds} />
        ))}
      </div>
    </div>
  );
}