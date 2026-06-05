import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, ChevronLeft, Star, BadgeDollarSign, Percent, Info, MessageSquare, Send } from 'lucide-react';
import { getCategoryAveragePrice, getPriceBandForProduct } from '../utils/catalogFilters';
import { parseProductList } from '../utils/productApi';
import { resolveProductImageSrc } from '../utils/productImages';
import type {
  AuthUserDto,
  BeerCatalogResponse,
  FavoriteDto,
  ProductDetailsDto,
  ReviewDto,
  ReviewFeedback,
  WineCatalogResponse,
} from '../types';
import { isAdminRole } from '../types';
import { AUTH_CHANGED_EVENT, apiRoutes } from '../api/routes';
import { ApiError, apiFetch, userHeaders } from '../utils/api';
import { fetchBeerCatalogLabels, fetchWineCatalogLabels } from '../utils/catalogApi';

const getBadgeColor = (score: number) => {
  if (score >= 79) return 'bg-green-500 text-white';
  if (score >= 50) return 'bg-yellow-500 text-yellow-900';
  return 'bg-red-500 text-white';
};

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

export default function ProductDetailsView() {
  const { id: routeName } = useParams();
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
  const [deleteDialog, setDeleteDialog] = useState<{
    kind: 'product' | 'review';
    review?: ReviewDto;
  } | null>(null);
  const autoFilledReviewKeyRef = useRef<string | null>(null);

  const hasBeerDetails = beer?.beerIbu !== null && beer?.beerIbu !== undefined;
  const loadData = useCallback(() => {
    if (!routeName) return;
    void apiFetch<ProductDetailsDto>(apiRoutes.products.byName(routeName), { credentials: 'omit' }).then((data) => {
      setBeer(data);
      const productId = data.id;
      void apiFetch<ProductDetailsDto[]>(apiRoutes.recommendations.forProduct(productId), { credentials: 'omit' }).then((data) => setSimilar(data));
      void apiFetch<ReviewDto[]>(apiRoutes.reviews.byProductId(productId), { credentials: 'omit' }).then((data) => setReviews(data));
      void userHeaders().then((headers) =>
        apiFetch<FavoriteDto[]>(apiRoutes.favorites.list, { headers }).then((favs) =>
          setIsFav(favs.some((favorite) => String(favorite.id) === String(productId))),
        ),
      );
    });
  }, [routeName]);

  useEffect(() => {
    let isMounted = true;

    const fetchMe = () => {
      apiFetch<AuthUserDto>(apiRoutes.auth.me)
        .then((user) => {
          if (!isMounted) return;
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

    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);

    return () => {
      isMounted = false;
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
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
      <span className="flex items-center gap-1.5 text-[0.7rem] text-gray-400 mb-1">
        {label}
        <span className="relative inline-flex items-center">
          <button
            type="button"
            aria-label={label}
            onMouseEnter={() => setActiveTooltip(tooltipKey)}
            onMouseLeave={() => setActiveTooltip(null)}
            onFocus={() => setActiveTooltip(tooltipKey)}
            onBlur={() => setActiveTooltip(null)}
            className={`w-4.5 h-4.5 rounded-full border inline-flex items-center justify-center p-0 cursor-help transition-all duration-160 ease-in-out ${
              activeTooltip === tooltipKey
                ? 'bg-orange-50 border-gray-200 text-yellow-800 shadow-[0_6px_18px_rgba(45,36,36,0.12)] scale-108'
                : 'bg-gray-50 border-gray-200 text-gray-400 shadow-[0_1px_2px_rgba(45,36,36,0.06)] scale-100'
            }`}
          >
            <Info size={11} />
          </button>
          <div
            role="tooltip"
            aria-hidden={activeTooltip !== tooltipKey}
            className={`absolute left-1/2 bottom-[calc(100%+10px)] w-60 bg-linear-to-b from-text-main to-[#3B2F2A] text-orange-50 border border-white/10 border-t-4 border-t-amber-700 rounded-2xl p-3 shadow-[0_18px_40px_rgba(45,36,36,0.18)] z-20 text-[0.78rem] leading-snug normal-case tracking-normal whitespace-normal pointer-events-none transition-all duration-240 ease-[cubic-bezier(.16,.8,.24,1)] origin-bottom will-change-transform ${
              activeTooltip === tooltipKey
                ? 'opacity-100 pointer-events-auto -translate-x-1/2 translate-y-0 scale-100'
                : 'opacity-0 -translate-x-1/2 translate-y-2 scale-98'
            }`}
          >
            <div className="text-[0.68rem] font-bold tracking-[0.08em] text-[#F5D6B4] mb-1.5">
              {label}
            </div>
            <div>{description}</div>
          </div>
        </span>
      </span>
      <span className="font-bold text-text-main">{value}</span>
    </div>
  );

  useEffect(() => {
    loadData();
    // also load all products for computing category average/price band
    void apiFetch<unknown>(apiRoutes.products.list('page=1&pageSize=100'), { credentials: 'omit' })
      .then((data) => setAllProducts(parseProductList(data).items as ProductDetailsDto[]))
      .catch(() => setAllProducts([]));
  }, [loadData]);

  useEffect(() => {
    void Promise.all([fetchBeerCatalogLabels(), fetchWineCatalogLabels()])
      .then(([beer, wine]) => {
        setBeerCatalog(beer);
        setWineCatalog(wine);
      })
      .catch(() => {
        setBeerCatalog({ families: [], colors: [] });
        setWineCatalog({ styles: [], colors: [] });
      });
  }, []);

  const toggleFavorite = async () => {
    if (!beer) return;
    const headers = await userHeaders();
    await apiFetch(apiRoutes.favorites.byProductId(beer.id), {
      method: isFav ? 'DELETE' : 'POST',
      headers,
      parseJson: false,
    });
    setIsFav(!isFav);
  };

  const submitReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser || !beer) {
      setReviewFeedback({ kind: 'error', message: 'Please sign in to leave a review.' });
      return;
    }

    const isEditing = editingReviewId !== null;
    try {
      const headers = await userHeaders({ 'Content-Type': 'application/json' });
      await apiFetch(isEditing ? apiRoutes.reviews.byId(editingReviewId) : apiRoutes.reviews.list, {
        method: isEditing ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify({ productId: Number(beer.id), rating, comment }),
      });

      setComment('');
      setRating(5);
      setEditingReviewId(null);
      setReviewFeedback({
        kind: 'success',
        message: isEditing ? 'Your review has been updated successfully.' : 'Your review has been posted successfully.',
      });
      loadData();
    } catch (err) {
      console.error(err);
      setReviewFeedback({
        kind: 'error',
        message: err instanceof ApiError ? err.message : 'An error occurred while saving the review.',
      });
    }
  };

  const canDeleteReview = (review: ReviewDto) => {
    if (!currentUser) return false;
    const isOwner = review.userId != null && review.userId === currentUser.userId;
    const isPrivileged = isAdminRole(currentUser.role);
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
    if (!ownReview || !beer) return;

    const autoFillKey = `${currentUser.userId}:${beer.id}`;
    if (autoFilledReviewKeyRef.current === autoFillKey) return;

    autoFilledReviewKeyRef.current = autoFillKey;
    setEditingReviewId(ownReview.id);
    setRating(Number(ownReview.rating) || 5);
    setComment(ownReview.comment || '');
  }, [currentUser, beer, reviews]);

  const deleteReview = async (review: ReviewDto) => {
    try {
      setDeletingReviewId(review.id);
      await apiFetch(apiRoutes.reviews.byId(review.id), { method: 'DELETE', parseJson: false });

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

  const deleteProduct = async () => {
    if (!beer) return;

    try {
      await apiFetch(apiRoutes.admin.productById(beer.id), { method: 'DELETE', parseJson: false });
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Failed to delete product');
    }
  };

  const confirmDelete = async () => {
    const target = deleteDialog;
    setDeleteDialog(null);

    if (!target) return;

    if (target.kind === 'review' && target.review) {
      await deleteReview(target.review);
      return;
    }

    if (target.kind === 'product') {
      try {
        await deleteProduct();
      } catch (error) {
        console.error(error);
        alert('Failed to delete product');
      }
    }
  };

  if (!beer) return <div className="p-25 text-center text-brand-color">Loading...</div>;

  const formatReviewDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())} ${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
  };

  return (
    <div className="max-w-275 mx-auto py-10 px-5">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 bg-transparent border-none text-brand-color cursor-pointer mb-7 font-bold hover:opacity-80 transition-opacity"
      >
        <ChevronLeft size={20} /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-15 items-start mb-20">
          <div className="bg-transparent rounded-[40px] h-130 flex items-center justify-center border-none">
              {resolveProductImageSrc(beer.imageUrl) ? (
                <img src={resolveProductImageSrc(beer.imageUrl)} alt={beer.name} className="max-h-full max-w-full object-contain rounded-[18px]" />
              ) : (
                <span className="text-[8rem] opacity-10">🍷</span>
              )}
          </div>

        <div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-amber-700 font-bold uppercase text-[0.8rem] tracking-[2px]">
                {beer.categoryName}
              </span>
              <h1 className="text-[3.5rem] text-text-main font-black my-2.5 leading-[1.1]">
                {beer.name}
              </h1>
              
              <div className="flex items-center gap-2.5 mt-2.5">
                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                  <Star size={18} fill="#F59E0B" color="#F59E0B" />
                  <span className="text-[1.2rem] font-black text-amber-800">
                    {typeof beer.avgRating === 'number' ? beer.avgRating.toFixed(1) : '0.0'}
                  </span>
                </div>
                <span className="text-gray-400 text-[0.9rem]">
                    ({beer.reviewsCount || 0} {reviewLabel})
                </span>
              </div>
            </div>
            <div className="flex gap-2.5 items-center">
              <button onClick={toggleFavorite} className="bg-white border border-gray-200 p-4 rounded-lg cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-colors">
              <Heart size={30} fill={isFav ? "#EF4444" : "none"} color={isFav ? "#EF4444" : "#9CA3AF"} />
              </button>
              {!isAuthLoading && currentUser && isAdminRole(currentUser.role) ? (
                <>
                  <button onClick={() => setDeleteDialog({ kind: 'product' })} className="bg-red-50 text-red-700 px-3.5 py-2.5 rounded-xl border border-red-400 font-bold cursor-pointer hover:bg-red-100 transition-colors">Delete</button>

                  <button onClick={() => navigate(`/product/${beer.id}/edit`)} className="bg-indigo-50 text-indigo-800 px-3.5 py-2.5 rounded-xl border border-indigo-200 font-bold cursor-pointer hover:bg-indigo-100 transition-colors">Edit</button>
                </>
              ) : null}
            </div>
          </div>

          <p className="text-[1.15rem] text-text-muted leading-[1.7] my-7">{beer.description}</p>

           <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4">
              <BadgeDollarSign className="text-brand-color" />
               <div>
                  <span className="block text-[0.7rem] text-gray-400">PRICE</span>
                  <span className="font-bold text-text-main">{beer.basePrice} PLN</span>
                  {priceBandLabel && (
                    <span className="block mt-1 text-[0.8rem] font-bold text-gray-500">{priceBandLabel}</span>
                  )}
               </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4">
              <Percent className="text-brand-color" />
              <div>
                <span className="block text-[0.7rem] text-gray-400 mb-1">ABV</span>
                <span className="font-bold text-text-main">{beer.strengthAbv}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 mb-10">
            <h3 className="m-0 mb-4.5 text-[1.05rem] font-extrabold text-text-main">Product details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[0.7rem] text-gray-400 mb-1">COUNTRY</span>
                <span className="font-bold text-text-main">{beer.country || '—'}</span>
              </div>
              <div>
                <span className="block text-[0.7rem] text-gray-400 mb-1">CATEGORY</span>
                <span className="font-bold text-text-main">{beer.categoryName}</span>
              </div>
              <div>
                <TooltipField
                    label="STYLE"
                    value={styleLabel}
                    tooltipKey="style"
                    description={(
                      <div>
                        <div className="mb-1.5 font-semibold">
                          {beer.categoryName === 'Beer'
                            ? 'Beer style describes brewing method, typical ingredients, and characteristic aroma and flavor.'
                            : 'Wine style describes fermentation approach, sweetness/carbonation level and general flavor profile.'}
                        </div>
                        <div className="text-[#F8F2E8]">{styleDescription}</div>
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
                      <div className="mb-1.5 font-semibold">
                        {beer.categoryName === 'Beer'
                          ? 'Class indicates the beer color category, often driven by malt roast level.'
                          : 'Class indicates wine color category which reflects grape variety and winemaking.'}
                      </div>
                      <div className="text-[#F8F2E8]">{classDescription}</div>
                    </div>
                  )}
                />
              </div>
              {hasBeerDetails && (
                <>
                  <div>
                    <TooltipField
                      label="SRM"
                      value={String(beer.beerSrm ?? '—')}
                      tooltipKey="srm"
                      description={(
                        <div>
                          <div className="mb-1.5 font-semibold">SRM — color scale (global)</div>
                          <div className="text-[#F8F2E8]">
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
                          <div className="mb-1.5 font-semibold">IBU — bitterness categories (global)</div>
                          <div className="text-[#F8F2E8]">
                            IBU (International Bitterness Units) measures perceived bitterness. Typical categories:
                            <ul className="m-0 mt-1.5 ml-4">
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
              )}
            </div>
          </div>

        </div>
      </div>

      <div className="mb-20">
        <h3 className="text-3xl font-black mb-7 flex items-center gap-4">
          <MessageSquare size={30} /> Reviews ({reviews.length})
        </h3>

        <div className="bg-bg-main p-5 rounded-[18px] mb-5">
          {reviewFeedback && (
            <div
              className={`mb-3 p-3 rounded-xl border font-semibold ${
                reviewFeedback.kind === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {reviewFeedback.message}
            </div>
          )}

          {isAuthLoading ? (
            <div className="py-3 text-gray-400">Checking sign-in status...</div>
          ) : currentUser ? (
            <form onSubmit={submitReview}>
              {editingReviewId !== null && (
                <div className="mb-2.5 p-2.5 rounded-xl bg-blue-50 text-blue-700 font-bold flex justify-between items-center gap-3">
                  <span>Editing an existing review</span>
                  <button type="button" onClick={() => { setEditingReviewId(null); setRating(5); setComment(''); }} className="border-none bg-transparent text-blue-700 font-extrabold cursor-pointer hover:underline">Cancel</button>
                </div>
              )}
              <div className="flex gap-2.5 mb-2.5">
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
                className="w-full p-3 rounded-xl border border-gray-200 min-h-22.5 mb-2.5 font-inherit focus:outline-none focus:border-brand-color focus:ring-1 focus:ring-brand-color transition-colors"
              />
              <div className="flex gap-3">
                <button type="submit" className="flex items-center gap-2 bg-text-main text-white border-none px-4 py-2.5 rounded-xl font-bold cursor-pointer hover:bg-opacity-90 transition-opacity">
                  <Send size={16} /> {editingReviewId !== null ? 'Update review' : 'Submit review'}
                </button>
                <div className="self-center text-gray-400">Signed in as <strong className="text-brand-color">{currentUser.username}</strong></div>
              </div>
            </form>
          ) : (
            <div className="flex justify-between items-center">
              <div className="text-brand-color">Sign in to leave your review.</div>
              <Link to="/login" className="text-amber-700 font-extrabold no-underline hover:underline">Sign In</Link>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {reviews.length === 0 ? <p className="text-gray-400">No reviews yet. Be the first!</p> : reviews.map((rev) => (
            <div key={rev.id} className="bg-white p-5 rounded-lg border border-gray-100">
              <div className="flex justify-between gap-3 mb-2 items-center">
                <Link to={rev.userId ? `/profile/${rev.userId}` : '/profile'} className="font-bold text-text-main no-underline hover:underline">
                  {rev.username || 'Anonymous reviewer'}
                </Link>
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < Number(rev.rating) ? "#F59E0B" : "none"} color={i < Number(rev.rating) ? "#F59E0B" : "#D1D5DB"} />
                    ))}
                  </div>
                  {canDeleteReview(rev) && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEditReview(rev)}
                        className="bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg px-2.5 py-1.5 font-extrabold cursor-pointer hover:bg-indigo-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteDialog({ kind: 'review', review: rev })}
                        disabled={deletingReviewId === rev.id}
                        className={`bg-red-50 text-red-700 border border-red-400 rounded-lg px-2.5 py-1.5 font-extrabold transition-colors ${deletingReviewId === rev.id ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-red-100'}`}
                      >
                        {deletingReviewId === rev.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="m-0 text-text-muted leading-[1.6]">{rev.comment}</p>
              <small className="text-gray-300 mt-2 block">{formatReviewDate(rev.createdAt)}</small>
            </div>
          ))}
        </div>
      </div>

      {similar.length > 0 && (
        <div className="border-t border-gray-200 pt-21 pb-6">
          <h3 className="text-3xl font-black mb-6 text-text-main">Similar products</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {similar.map((item) => {
              const src = resolveProductImageSrc(item.imageUrl);
              const isHovered = hoveredSimilar === String(item.id);
              return (
                <Link
                  to={`/product/${encodeURIComponent(item.name)}`}
                  key={item.id}
                  onMouseEnter={() => setHoveredSimilar(String(item.id))}
                  onMouseLeave={() => setHoveredSimilar(null)}
                  className={`no-underline bg-white p-3 rounded-2xl border border-gray-100 min-w-55 shrink-0 flex flex-col gap-2 transition-all duration-160 ease-in-out ${
                    isHovered ? '-translate-y-1.5 scale-101 shadow-[0_14px_36px_rgba(0,0,0,0.10)]' : 'shadow-none'
                  }`}
                >
                  <div className="h-27.5 bg-bg-main rounded-xl overflow-hidden flex items-center justify-center relative">
                    {item.similarityScore !== undefined && (
                      <div className={`absolute top-1.5 right-1.5 z-10 ${getBadgeColor(item.similarityScore)} text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow-sm`}>
                        {Math.round(item.similarityScore)}% Match
                      </div>
                    )}
                    {src ? (
                      <img src={src} alt={item.name} className="max-w-full max-h-full object-contain block" />
                    ) : (
                      <div className="text-3xl">🍷</div>
                    )}
                  </div>
                  <div className="font-extrabold text-text-main">{item.name}</div>
                  <div className="text-brand-color font-extrabold">{item.basePrice} PLN</div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {deleteDialog && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/55 px-4" onClick={() => setDeleteDialog(null)}>
              <div className="w-full max-w-105 rounded-[28px] border border-[#EBDCC8] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.25)]" onClick={(event) => event.stopPropagation()}>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-brand-color mb-2">
                  Confirm deletion
                </div>
                <h2 className="m-0 text-[1.45rem] leading-[1.15] font-black text-text-main">
                  {deleteDialog.kind === 'product' ? 'Delete this product?' : 'Delete this review?'}
                </h2>
                <p className="mt-3 mb-0 text-text-muted leading-[1.7]">
                  {deleteDialog.kind === 'product'
                    ? 'This will permanently remove the product from the catalog.'
                    : 'This will permanently remove the review from the product page.'}
                </p>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteDialog(null)}
                    className="px-4.5 py-2.5 rounded-xl border border-[#E7D8C4] bg-white text-text-main font-bold cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmDelete()}
                    className="px-4.5 py-2.5 rounded-xl border border-red-400 bg-red-50 text-red-700 font-black cursor-pointer hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}