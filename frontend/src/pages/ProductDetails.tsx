import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, ChevronLeft, Star, BadgeDollarSign, Percent, Info, MessageSquare, Send } from 'lucide-react';
import { getCategoryAveragePrice, getPriceBandForProduct } from '../utils/catalogFilters';

type BeerStyleEntry = { code: string; description: string };
type BeerColorEntry = { code: string; description: string };
type BeerStyleFamilyEntry = { code: string; description?: string; styles: BeerStyleEntry[] };
type WineStyleEntry = { code: string; description: string };
type WineColorEntry = { code: string; description: string };

type BeerCatalogResponse = {
  families: BeerStyleFamilyEntry[];
  colors: BeerColorEntry[];
};

type WineCatalogResponse = {
  styles: WineStyleEntry[];
  colors: WineColorEntry[];
};

type ProductDetailsDto = {
  id: number | string;
  name: string;
  categoryName: string;
  description?: string;
  imageUrl?: string | null;
  avgRating?: number;
  reviewsCount?: number;
  basePrice?: number;
  strengthAbv?: number;
  country?: string;
  beerStyle?: string;
  wineStyle?: string;
  beerColor?: string;
  wineColor?: string;
  beerSrm?: number;
  beerIbu?: number;
};

type ReviewDto = {
  id: number | string;
  userId?: number;
  username?: string;
  comment?: string;
  createdAt: string;
  rating: number | string;
};

type FavoriteDto = {
  id: number | string;
};

type AuthUserDto = {
  userId: number;
  username: string;
  email: string;
  country?: string | null;
  role?: string | null;
};

type ReviewFeedback = {
  kind: 'success' | 'error';
  message: string;
} | null;

const getStyleDescription = (
  product: ProductDetailsDto | null,
  beerCatalog: BeerCatalogResponse | null,
  wineCatalog: WineCatalogResponse | null,
) => {
  if (!product) return 'No style description available.';
  const value = product.beerStyle ?? product.wineStyle;
  if (!value) return 'No style description available.';
  if (product.categoryName === 'Beer') {
    return beerCatalog?.families.flatMap((family) => family.styles).find((style) => style.code === value)?.description
      ?? 'No style description available.';
  }
  return wineCatalog?.styles.find((style) => style.code === value)?.description
    ?? 'No style description available.';
};

const getClassDescription = (
  product: ProductDetailsDto | null,
  beerCatalog: BeerCatalogResponse | null,
  wineCatalog: WineCatalogResponse | null,
) => {
  if (!product) return 'No class description available.';
  const value = product.beerColor ?? product.wineColor;
  if (!value) return 'No class description available.';
  if (product.categoryName === 'Beer') {
    return beerCatalog?.colors.find((color) => color.code === value)?.description
      ?? 'No class description available.';
  }
  return wineCatalog?.colors.find((color) => color.code === value)?.description
    ?? 'No class description available.';
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [beer, setBeer] = useState<ProductDetailsDto | null>(null);
  const [similar, setSimilar] = useState<ProductDetailsDto[]>([]);
  const [allProducts, setAllProducts] = useState<ProductDetailsDto[]>([]);
  const [beerCatalog, setBeerCatalog] = useState<BeerCatalogResponse | null>(null);
  const [wineCatalog, setWineCatalog] = useState<WineCatalogResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUserDto | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [reviewFeedback, setReviewFeedback] = useState<ReviewFeedback>(null);
  const [editingReviewId, setEditingReviewId] = useState<number | string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<number | string | null>(null);
  const autoFilledReviewKeyRef = useRef<string | null>(null);

  const hasBeerDetails = beer?.beerIbu !== null && beer?.beerIbu !== undefined;
  const loadData = useCallback(() => {
    fetch(`/api/products/${id}`).then(res => res.json()).then(data => setBeer(data));
    fetch(`/api/Recommendations/${id}`).then(res => res.json()).then(data => setSimilar(data));
    fetch(`/api/reviews/product/${id}`).then(res => res.json()).then(data => setReviews(data));
    fetch('/api/Favorites', { headers: { 'X-User-Id': '1' } })
      .then(res => res.json())
      .then((favs: FavoriteDto[]) => setIsFav(favs.some((f) => String(f.id) === String(id))));
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    const fetchMe = () => {
      fetch('/api/auth/me', { credentials: 'include' })
        .then(async (res) => {
          if (!isMounted) return;

          if (!res.ok) {
            setCurrentUser(null);
            return;
          }

          const user = await res.json() as AuthUserDto;
          setCurrentUser(user);
        })
        .catch(() => {
          if (isMounted) {
            setCurrentUser(null);
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsAuthLoading(false);
          }
        });
    };

    fetchMe();

    const onAuthChanged = () => {
      fetchMe();
    };

    window.addEventListener('auth-changed', onAuthChanged);

    return () => {
      isMounted = false;
      window.removeEventListener('auth-changed', onAuthChanged);
    };
  }, []);

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return '—';
    return String(value)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .trim();
  };

  const styleLabel = formatValue(beer?.beerStyle ?? beer?.wineStyle);
  const classLabel = formatValue(beer?.beerColor ?? beer?.wineColor);
  const styleDescription = getStyleDescription(beer, beerCatalog, wineCatalog);
  const classDescription = getClassDescription(beer, beerCatalog, wineCatalog);
  const reviewLabel = (beer?.reviewsCount || 0) === 1 ? 'expert review' : 'expert reviews';

  const [hoveredSimilar, setHoveredSimilar] = useState<string | null>(null);

  const categoryAveragePrice = useMemo(() => {
    if (!beer) return 0;
    return getCategoryAveragePrice(allProducts, beer.categoryName as 'Beer' | 'Wine' | 'All' | undefined ?? 'All');
  }, [allProducts, beer]);

  const priceBandLabel = useMemo(() => {
    if (!beer) return null;
    return getPriceBandForProduct(Number(beer.basePrice ?? 0), categoryAveragePrice);
  }, [beer, categoryAveragePrice]);

  const TooltipField = ({
    label,
    value,
    tooltipKey,
    description,
  }: {
    label: string;
    value: string;
    tooltipKey: string;
    description: ReactNode;
  }) => (
    <div>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '4px' }}>
        {label}
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <button
            type="button"
            aria-label={label}
            onMouseEnter={() => setActiveTooltip(tooltipKey)}
            onMouseLeave={() => setActiveTooltip(null)}
            onFocus={() => setActiveTooltip(tooltipKey)}
            onBlur={() => setActiveTooltip(null)}
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '999px',
              border: '1px solid #E5E7EB',
              background: activeTooltip === tooltipKey ? '#fff7ed' : '#F9FAFB',
              color: activeTooltip === tooltipKey ? '#92400E' : '#9CA3AF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              cursor: 'help',
              boxShadow: activeTooltip === tooltipKey ? '0 6px 18px rgba(45,36,36,0.12)' : '0 1px 2px rgba(45, 36, 36, 0.06)',
              transform: activeTooltip === tooltipKey ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 160ms ease, box-shadow 160ms ease, background 160ms ease, color 160ms ease'
            }}
          >
            <Info size={11} />
          </button>
          <div
            role="tooltip"
            aria-hidden={activeTooltip !== tooltipKey}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 'calc(100% + 10px)',
              
              width: '240px',
              background: 'linear-gradient(180deg, #2D2424 0%, #3B2F2A 100%)',
              color: '#FFF7ED',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderTop: '3px solid #A0522D',
              borderRadius: '16px',
              padding: '12px 14px',
              boxShadow: '0 18px 40px rgba(45, 36, 36, 0.18)',
              zIndex: 20,
              fontSize: '0.78rem',
              lineHeight: 1.5,
              textTransform: 'none',
              letterSpacing: '0',
              whiteSpace: 'normal',
              opacity: activeTooltip === tooltipKey ? 1 : 0,
              pointerEvents: activeTooltip === tooltipKey ? 'auto' : 'none',
              transform: `translateX(-50%) translateY(${activeTooltip === tooltipKey ? '0' : '8px'}) scale(${activeTooltip === tooltipKey ? 1 : 0.98})`,
              transition: 'opacity 240ms cubic-bezier(.16,.8,.24,1), transform 240ms cubic-bezier(.16,.8,.24,1)',
              transitionDelay: '0ms',
              willChange: 'transform, opacity',
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: '#F5D6B4', marginBottom: '6px' }}>
              {label}
            </div>
            <div>{description}</div>
          </div>
        </span>
      </span>
      <span style={{ fontWeight: 'bold', color: '#2D2424' }}>{value}</span>
    </div>
  );

  useEffect(() => {
    loadData();
    // also load all products for computing category average/price band
    fetch('/api/products').then(r => r.json()).then(d => setAllProducts(Array.isArray(d) ? d : d.value ?? [])).catch(() => setAllProducts([]));
  }, [loadData]);

  useEffect(() => {
    Promise.all([
      fetch('/api/beer-catalog/families').then((res) => res.json()),
      fetch('/api/beer-catalog/colors').then((res) => res.json()),
      fetch('/api/wine-catalog/styles').then((res) => res.json()),
      fetch('/api/wine-catalog/colors').then((res) => res.json()),
    ])
      .then(([beerFamilies, beerColors, wineStyles, wineColors]) => {
        setBeerCatalog({
          families: Array.isArray(beerFamilies) ? beerFamilies : [],
          colors: Array.isArray(beerColors) ? beerColors : [],
        });
        setWineCatalog({
          styles: Array.isArray(wineStyles) ? wineStyles : [],
          colors: Array.isArray(wineColors) ? wineColors : [],
        });
      })
      .catch(() => {
        setBeerCatalog({ families: [], colors: [] });
        setWineCatalog({ styles: [], colors: [] });
      });
  }, []);

  const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://127.0.0.1:5542';

  const toggleFavorite = () => {
    const method = isFav ? 'DELETE' : 'POST';
    fetch(`/api/Favorites/${id}`, {
      method: method,
      headers: { 'X-User-Id': '1' }
    }).then(() => setIsFav(!isFav));
  };

  const submitReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) {
      setReviewFeedback({ kind: 'error', message: 'Please sign in to leave a review.' });
      return;
    }

    const isEditing = editingReviewId !== null;
    fetch(isEditing ? `/api/reviews/${editingReviewId}` : '/api/reviews', {
      method: isEditing ? 'PUT' : 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser ? String(currentUser.userId) : '' },
      body: JSON.stringify({ productId: Number(id), rating, comment })
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => null);

        if (!res.ok) {
          const message = payload?.message || payload?.detail || payload?.error || 'An error occurred while saving the review.';
          setReviewFeedback({ kind: 'error', message });
          return;
        }

        setComment('');
        setRating(5);
        setEditingReviewId(null);
        setReviewFeedback({ kind: 'success', message: isEditing ? 'Your review has been updated successfully.' : 'Your review has been posted successfully.' });
        loadData();
      })
      .catch((err) => {
        console.error(err);
        setReviewFeedback({ kind: 'error', message: 'An error occurred while saving the review.' });
      });
  };

  const canDeleteReview = (review: ReviewDto) => {
    if (!currentUser) return false;
    const isOwner = review.userId != null && review.userId === currentUser.userId;
    const isPrivileged = currentUser.role === 'Admin' || currentUser.role === 'Moderator';
    return isOwner || isPrivileged;
  };

  const startEditReview = (review: ReviewDto) => {
    setEditingReviewId(review.id);
    setRating(Number(review.rating) || 5);
    setComment(review.comment || '');
    setReviewFeedback({ kind: 'success', message: 'Editing your review. Update the text or rating and submit.' });
  };

  useEffect(() => {
    if (!currentUser || reviews.length === 0) return;

    const ownReview = reviews.find((review) => review.userId === currentUser.userId);
    if (!ownReview) return;

    const autoFillKey = `${currentUser.userId}:${id}`;
    if (autoFilledReviewKeyRef.current === autoFillKey) return;

    autoFilledReviewKeyRef.current = autoFillKey;
    setEditingReviewId(ownReview.id);
    setRating(Number(ownReview.rating) || 5);
    setComment(ownReview.comment || '');
  }, [currentUser, id, reviews]);

  const deleteReview = async (review: ReviewDto) => {
    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) return;

    try {
      setDeletingReviewId(review.id);
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Failed to delete review');
      }

      setReviews((current) => current.filter((item) => item.id !== review.id));
      if (editingReviewId === review.id) {
        setEditingReviewId(null);
        setRating(5);
        setComment('');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to delete comment.');
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (!beer) return <div style={{ padding: '100px', textAlign: 'center', color: '#5D4037' }}>Loading...</div>;

  const formatReviewDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())} ${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#5D4037', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' }}
      >
        <ChevronLeft size={20} /> Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start', marginBottom: '80px' }}>
          <div style={{ backgroundColor: 'transparent', borderRadius: '40px', height: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
              {beer.imageUrl ? (
                (() => {
                  const src = beer.imageUrl?.startsWith('/') ? `http://127.0.0.1:5542${beer.imageUrl}` : beer.imageUrl;
                  return <img src={src} alt={beer.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', borderRadius: 18 }} />;
                })()
              ) : (
                <span style={{ fontSize: '8rem', opacity: 0.1 }}>🍷</span>
              )}
          </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ color: '#A0522D', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px' }}>
                {beer.categoryName}
              </span>
              <h1 style={{ fontSize: '3.5rem', color: '#2D2424', fontWeight: '900', margin: '10px 0', lineHeight: '1.1' }}>
                {beer.name}
              </h1>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#FFFBEB', padding: '6px 12px', borderRadius: '10px', border: '1px solid #FEF3C7' }}>
                  <Star size={18} fill="#F59E0B" color="#F59E0B" />
                  <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#92400E' }}>
                    {typeof beer.avgRating === 'number' ? beer.avgRating.toFixed(1) : '0.0'}
                  </span>
                </div>
                <span style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>
                    ({beer.reviewsCount || 0} {reviewLabel})
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={toggleFavorite} style={{ background: 'white', border: '1px solid #E5E7EB', padding: '15px', borderRadius: '20px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
              <Heart size={30} fill={isFav ? "#EF4444" : "none"} color={isFav ? "#EF4444" : "#9CA3AF"} />
              </button>
              {!isAuthLoading && currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Moderator') ? (
                <>
                  <button onClick={() => {
                    const confirmed = confirm('Are you sure you want to delete this product?');
                    if (!confirmed) return;
                    fetch(`/api/admin/products/${id}`, { method: 'DELETE', credentials: 'include' })
                      .then(res => {
                        if (res.ok) navigate('/');
                        else alert('Failed to delete product');
                      });
                  }} style={{ background: '#FFF5F5', color: '#C53030', padding: '10px 14px', borderRadius: '12px', border: '1px solid #FC8181', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>

                  <button onClick={() => navigate(`/product/${id}/edit`)} style={{ background: '#EEF2FF', color: '#3730A3', padding: '10px 14px', borderRadius: '12px', border: '1px solid #C7D2FE', fontWeight: 'bold', cursor: 'pointer' }}>Edit</button>
                </>
              ) : null}
            </div>
          </div>

          <p style={{ fontSize: '1.15rem', color: '#6B7280', lineHeight: '1.7', margin: '30px 0' }}>{beer.description}</p>

           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', marginBottom: '40px' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <BadgeDollarSign color="#5D4037" />
               <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#9CA3AF' }}>PRICE</span>
                  <span style={{ fontWeight: 'bold', color: '#2D2424' }}>{beer.basePrice} PLN</span>
                  {priceBandLabel ? (
                    <span style={{ display: 'block', marginTop: 4, fontSize: '0.8rem', fontWeight: 700, color: '#6B7280' }}>{priceBandLabel}</span>
                  ) : null}
               </div>
            </div>
            <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Percent color="#5D4037" />
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '4px' }}>ABV</span>
                <span style={{ fontWeight: 'bold', color: '#2D2424' }}>{beer.strengthAbv}%</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F3F4F6', marginBottom: '40px' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '1.05rem', fontWeight: '800', color: '#2D2424' }}>Product details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '4px' }}>COUNTRY</span>
                <span style={{ fontWeight: 'bold', color: '#2D2424' }}>{beer.country || '—'}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '4px' }}>CATEGORY</span>
                <span style={{ fontWeight: 'bold', color: '#2D2424' }}>{beer.categoryName}</span>
              </div>
              <div>
                <TooltipField
                    label="STYLE"
                    value={styleLabel}
                    tooltipKey="style"
                    description={(
                      <div>
                        <div style={{ marginBottom: '6px', fontWeight: 600 }}>
                          {beer.categoryName === 'Beer'
                            ? 'Beer style describes brewing method, typical ingredients, and characteristic aroma and flavor.'
                            : 'Wine style describes fermentation approach, sweetness/carbonation level and general flavor profile.'}
                        </div>
                        <div style={{ color: '#F8F2E8' }}>{styleDescription}</div>
                      </div>
                    )}
                  />
              </div>
              <div>
                <TooltipField
                  label="CLASS"
                  value={classLabel}
                  tooltipKey="class"
                  description={(
                    <div>
                      <div style={{ marginBottom: '6px', fontWeight: 600 }}>
                        {beer.categoryName === 'Beer'
                          ? 'Class indicates the beer color category, often driven by malt roast level.'
                          : 'Class indicates wine color category which reflects grape variety and winemaking.'}
                      </div>
                      <div style={{ color: '#F8F2E8' }}>{classDescription}</div>
                    </div>
                  )}
                />
              </div>
              {hasBeerDetails ? (
                <>
                  <div>
                    <TooltipField
                      label="SRM"
                      value={String(beer.beerSrm ?? '—')}
                      tooltipKey="srm"
                      description={(
                        <div>
                          <div style={{ marginBottom: '6px', fontWeight: 600 }}>SRM — color scale (global)</div>
                          <div style={{ color: '#F8F2E8' }}>
                            SRM (Standard Reference Method) measures beer color from very pale to very dark. Typical bands: 1–3 (very pale), 4–6 (straw/golden), 7–12 (amber), 13–20 (brown), 20+ (dark).
                          </div>
                         
                        </div>
                      )}
                    />
                  </div>
                  <div>
                    <TooltipField
                      label="IBU"
                      value={String(beer.beerIbu ?? '—')}
                      tooltipKey="ibu"
                      description={(
                        <div>
                          <div style={{ marginBottom: '6px', fontWeight: 600 }}>IBU — bitterness categories (global)</div>
                          <div style={{ color: '#F8F2E8' }}>
                            IBU (International Bitterness Units) measures perceived bitterness. Typical categories:
                            <ul style={{ margin: '6px 0 0 16px' }}>
                              <li>0–10: Very low — little to no bitterness</li>
                              <li>11–20: Low</li>
                              <li>21–40: Moderate</li>
                              <li>41–60: High</li>
                              <li>61+: Very high</li>
                            </ul>
                          </div>
                         
                        </div>
                      )}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* review form removed from right column; moved to Reviews section below */}
        </div>
      </div>

      <div style={{ marginBottom: '80px' }}>
        <h3 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <MessageSquare size={30} /> Reviews ({reviews.length})
        </h3>

        {/* Review form is now in the Reviews section */}
        <div style={{ background: '#FAF9F6', padding: '20px', borderRadius: '18px', marginBottom: '20px' }}>
          {reviewFeedback ? (
            <div
              style={{
                marginBottom: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                border: reviewFeedback.kind === 'success' ? '1px solid #BBF7D0' : '1px solid #FECACA',
                background: reviewFeedback.kind === 'success' ? '#F0FDF4' : '#FEF2F2',
                color: reviewFeedback.kind === 'success' ? '#166534' : '#991B1B',
                fontWeight: 600,
              }}
            >
              {reviewFeedback.message}
            </div>
          ) : null}

          {isAuthLoading ? (
            <div style={{ padding: '12px 0', color: '#9CA3AF' }}>Checking sign-in status...</div>
          ) : currentUser ? (
            <form onSubmit={submitReview}>
              {editingReviewId !== null ? (
                <div style={{ marginBottom: '10px', padding: '10px 12px', borderRadius: '10px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <span>Editing an existing review</span>
                  <button type="button" onClick={() => { setEditingReviewId(null); setRating(5); setComment(''); }} style={{ border: 'none', background: 'transparent', color: '#1D4ED8', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                </div>
              ) : null}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                {[1, 2, 3, 4, 5].map(num => (
                  <Star 
                    key={num} 
                    size={20} 
                    cursor="pointer" 
                    fill={num <= rating ? "#F59E0B" : "none"} 
                    color={num <= rating ? "#F59E0B" : "#D1D5DB"}
                    onClick={() => setRating(num)}
                  />
                ))}
              </div>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Your tasting notes..."
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', minHeight: '90px', marginBottom: '10px', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{ background: '#2D2424', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  <Send size={16} /> {editingReviewId !== null ? 'Update review' : 'Submit review'}
                </button>
                <div style={{ alignSelf: 'center', color: '#9CA3AF' }}>Signed in as <strong style={{ color: '#5D4037' }}>{currentUser.username}</strong></div>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#5D4037' }}>Sign in to leave your review.</div>
              <Link to="/login" style={{ color: '#A0522D', fontWeight: 800, textDecoration: 'none' }}>Sign In</Link>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reviews.length === 0 ? <p style={{ color: '#9CA3AF' }}>No reviews yet. Be the first!</p> : reviews.map((rev) => (
            <div key={rev.id} style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                <Link to={rev.userId ? `/profile/${rev.userId}` : '/profile'} style={{ fontWeight: 'bold', color: '#2D2424', textDecoration: 'none' }}>
                  {rev.username || 'Anonymous reviewer'}
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < Number(rev.rating) ? "#F59E0B" : "none"} color={i < Number(rev.rating) ? "#F59E0B" : "#D1D5DB"} />
                    ))}
                  </div>
                  {canDeleteReview(rev) ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => startEditReview(rev)}
                        style={{
                          background: '#EEF2FF',
                          color: '#3730A3',
                          border: '1px solid #C7D2FE',
                          borderRadius: '10px',
                          padding: '6px 10px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteReview(rev)}
                        disabled={deletingReviewId === rev.id}
                        style={{
                          background: '#FFF5F5',
                          color: '#C53030',
                          border: '1px solid #FC8181',
                          borderRadius: '10px',
                          padding: '6px 10px',
                          fontWeight: 800,
                          cursor: deletingReviewId === rev.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {deletingReviewId === rev.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <p style={{ margin: 0, color: '#6B7280', lineHeight: '1.6' }}>{rev.comment}</p>
              <small style={{ color: '#D1D5DB', marginTop: '8px', display: 'block' }}>{formatReviewDate(rev.createdAt)}</small>
            </div>
          ))}
        </div>
      </div>

      {similar.length > 0 && (
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '84px', paddingBottom: '24px' }}>
          <h3 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '24px', color: '#2D2424' }}>Similar products</h3>
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: 8 }}>
            {similar.map((item) => {
              const src = item.imageUrl?.startsWith('/') ? `${API_BASE}${item.imageUrl}` : item.imageUrl;
              const isHovered = hoveredSimilar === String(item.id);
              return (
                <Link
                  to={`/product/${item.id}`}
                  key={item.id}
                  onMouseEnter={() => setHoveredSimilar(String(item.id))}
                  onMouseLeave={() => setHoveredSimilar(null)}
                  style={{
                    textDecoration: 'none',
                    background: 'white',
                    padding: '12px',
                    borderRadius: '16px',
                    border: '1px solid #F3F4F6',
                    minWidth: 220,
                    flex: '0 0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'transform 160ms ease, box-shadow 160ms ease',
                    transform: isHovered ? 'translateY(-6px) scale(1.01)' : 'none',
                    boxShadow: isHovered ? '0 14px 36px rgba(0,0,0,0.10)' : 'none'
                  }}
                >
                  <div style={{ height: 110, background: '#FAF9F6', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {src ? (
                      <img src={src} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
                    ) : (
                      <div style={{ fontSize: '2rem' }}>🍷</div>
                    )}
                  </div>
                  <div style={{ fontWeight: 800, color: '#2D2424' }}>{item.name}</div>
                  <div style={{ color: '#5D4037', fontWeight: '800' }}>{item.basePrice} PLN</div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}