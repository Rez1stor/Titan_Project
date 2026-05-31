import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Heart, Sparkles, SlidersHorizontal, TrendingUp } from 'lucide-react';
import ProductCard, { type ProductDto } from '../components/ProductCard';

type UserPreferences = {
  targetAbv?: number | null;
  abvTolerance?: number | null;
  maxPrice?: number | null;
  preferredTags?: string[];
};

type LibraryResponse = {
  favorites?: ProductDto[];
  preferences?: UserPreferences;
};

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

const toProducts = (value: any): ProductDto[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.value)) return value.value;
  return [];
};

const normalize = (value?: string | null) => (value ?? '').trim().toLowerCase();

const isInPreferenceWindow = (product: ProductDto, preferences?: UserPreferences | null) => {
  if (!preferences) return false;

  const abv = Number(product.strengthAbv ?? 0);
  const targetAbv = preferences.targetAbv;
  const abvTolerance = preferences.abvTolerance;
  const maxPrice = preferences.maxPrice;

  if (targetAbv !== null && targetAbv !== undefined && abvTolerance !== null && abvTolerance !== undefined) {
    if (Math.abs(abv - Number(targetAbv)) > Number(abvTolerance)) return false;
  }

  if (maxPrice !== null && maxPrice !== undefined && Number(product.basePrice ?? 0) > Number(maxPrice)) {
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

function SectionCard({ title, description, icon, products, emptyMessage, onToggleFavorite, cardWidth }: RecommendationSection & { onToggleFavorite?: (productId: number | string) => void; cardWidth: number }) {
  // Render all products in a horizontally scrollable row. The `cardWidth` is
  // computed by the parent so the visible viewport contains whole cards only.
  const visibleProducts = products;

  return (
    <section style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <div style={sectionBadgeStyle}>{icon}{title}</div>
        <p style={sectionDescriptionStyle}>{description}</p>
      </div>

      {visibleProducts.length === 0 ? (
        <div style={emptyStateStyle}>{emptyMessage}</div>
      ) : (
        <div style={{ ...scrollRowStyle }}>
          {visibleProducts.map((item) => (
            <div key={item.id} style={{ ...cardShellStyle, flex: `0 0 ${cardWidth}px`, width: cardWidth, minWidth: cardWidth, maxWidth: cardWidth, scrollSnapAlign: 'start' as const }}>
              <ProductCard product={item} onToggleFavorite={onToggleFavorite} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Recommendations() {
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
        const [likedResponse, libraryResponse, productsResponse, favoritesResponse] = await Promise.all([
          fetch('/api/recommendations/for-user', { headers: { 'X-User-Id': '1' } }),
          fetch('/api/library', { credentials: 'include', headers: { 'X-User-Id': '1' } }),
          fetch('/api/products'),
          fetch('/api/favorites', { headers: { 'X-User-Id': '1' } }),
        ]);

        const likedData = likedResponse.ok ? await likedResponse.json() : [];
        const libraryData = libraryResponse.ok ? (await libraryResponse.json()) as LibraryResponse : {};
        const productsData = await productsResponse.json();
        const favoritesData = favoritesResponse.ok ? await favoritesResponse.json() : [];

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
            const leftPrice = Number(left.basePrice ?? 0);
            const rightPrice = Number(right.basePrice ?? 0);
            return leftPrice - rightPrice; // sort by price ascending
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

  const toggleFavorite = (productId: number | string) => {
    const favoriteId = String(productId);
    const isFav = favoriteIds.includes(favoriteId);

    fetch(`/api/favorites/${productId}`, {
      method: isFav ? 'DELETE' : 'POST',
      headers: { 'X-User-Id': '1', 'Content-Type': 'application/json' },
    }).then(() => {
      setFavoriteIds((current) => (isFav ? current.filter((id) => id !== favoriteId) : [...current, favoriteId]));
    });
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
    return <div style={{ padding: '100px', textAlign: 'center', color: '#5D4037' }}>Loading recommendations...</div>;
  }

  return (
    <div style={pageStyle}>
      <div style={heroStyle}>
        <div style={heroPillStyle}><Sparkles size={18} /> For You</div>
        <h1 style={heroTitleStyle}>Three ways to discover your next drink</h1>
        <p style={heroTextStyle}>
          The page now groups recommendations by what you liked, what you told us during account setup, and what is trending in the catalog.
        </p>
      </div>

      <div ref={sectionsContainerRef} style={sectionsStyle}>
        {sections.map(({ id, ...section }) => (
          <SectionCard key={id} id={id} {...section} onToggleFavorite={toggleFavorite} cardWidth={cardWidth} />
        ))}
      </div>
    </div>
  );
}

const pageStyle = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '32px 20px 56px',
};

const heroStyle = {
  textAlign: 'center' as const,
  marginBottom: '28px',
  padding: '28px 24px 10px',
};

const heroPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  background: '#F5F5DC',
  padding: '8px 18px',
  borderRadius: '999px',
  color: '#5D4037',
  fontWeight: 800,
  marginBottom: '14px',
};

const heroTitleStyle = {
  color: '#2D2424',
  fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
  fontWeight: 900,
  letterSpacing: '-0.04em',
  margin: 0,
};

const heroTextStyle = {
  color: '#6B7280',
  fontSize: '1.05rem',
  maxWidth: '68ch',
  margin: '12px auto 0',
  lineHeight: 1.7,
};

const sectionsStyle = {
  display: 'grid',
  gap: '28px',
};

const sectionStyle = {
  background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF9 100%)',
  border: '1px solid #EEE7DE',
  borderRadius: '28px',
  padding: '24px',
  boxShadow: '0 20px 50px rgba(45, 36, 36, 0.05)',
  overflow: 'hidden',
  minWidth: 0,
};

const sectionHeaderStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '10px',
  marginBottom: '18px',
};

const sectionBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  width: 'fit-content',
  background: '#FAF9F6',
  border: '1px solid #EFE2D0',
  borderRadius: '999px',
  padding: '8px 14px',
  color: '#5D4037',
  fontWeight: 800,
};

const sectionDescriptionStyle = {
  margin: 0,
  color: '#6B7280',
  lineHeight: 1.6,
};

// cardsGridStyle removed in favor of scrollable rows

const scrollRowStyle = {
  display: 'flex',
  gap: `${CARD_GAP}px`,
  overflowX: 'auto' as const,
  WebkitOverflowScrolling: 'touch' as const,
  paddingBottom: 8,
  scrollSnapType: 'x mandatory' as const,
  // allow the row to shrink inside rounded section containers
  minWidth: 0,
};

const cardShellStyle = {
  display: 'flex',
  alignSelf: 'stretch' as const,
};

const emptyStateStyle = {
  textAlign: 'center' as const,
  padding: '42px 24px',
  borderRadius: '22px',
  background: '#FAF9F6',
  color: '#6B7280',
};