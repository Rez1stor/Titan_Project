import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import type { FavoriteDto, ProductDto } from '../types';
import { apiRoutes } from '../api/routes';
import { apiFetch, userHeaders } from '../utils/api';

export default function FavoritesList() {
  const [favorites, setFavorites] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      const headers = await userHeaders();
      const data = await apiFetch<FavoriteDto[] | ProductDto[]>(apiRoutes.favorites.list, { headers });
      setFavorites(Array.isArray(data) ? (data as ProductDto[]) : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFavorites();
  }, []);

  const removeFromFavorites = async (id: number | string) => {
    const headers = await userHeaders();
    await apiFetch(apiRoutes.favorites.byProductId(id), { method: 'DELETE', headers, parseJson: false });
    setFavorites((current) => current.filter((favorite) => String(favorite.id) !== String(id)));
  };

  const toggleFavorite = (id: number | string) => {
    void removeFromFavorites(id);
  };

  if (loading) return <div className="p-24 text-center text-brand-color">Loading...</div>;

  return (
    <div className="max-w-[1200px] mx-auto py-10 px-5">
      <div className="text-center mb-12">
        <h1 className="text-text-main text-5xl font-black mb-1">
          My Favorites
        </h1>
        <p className="text-gray-400 text-base font-medium">
          You have {favorites.length} saved products
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center p-16 bg-white rounded-[30px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-gray-100">
          <p className="text-lg text-gray-500 mb-5">Your list is still empty.</p>
          <a href="/catalog" className="inline-block bg-brand-color text-white px-8 py-3 rounded-2xl no-underline font-bold hover:bg-opacity-90 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            Discover products
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-9 justify-center">
          {favorites.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorited
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
