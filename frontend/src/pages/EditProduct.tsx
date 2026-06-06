import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductFormComposition from '../compositions/ProductFormComposition';
import useAdminGuard from '../hooks/useAdminGuard';
import type { ProductFormDto } from '../types';
import { apiRoutes } from '../api/routes';
import { apiFetch } from '../utils/api';
import { uploadProductImage } from '../utils/productImages';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [initial, setInitial] = React.useState<ProductFormDto | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  useAdminGuard();

  React.useEffect(() => {
    if (!id) return;
    apiFetch<ProductFormDto>(apiRoutes.products.byId(id), { credentials: 'omit' })
      .then((data) => setInitial(data))
      .catch(() => setInitial(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (payload: ProductFormDto) => {
    if (!id) return;
    setSubmitting(true);
    try {
      const { imageFile, ...productPayload } = payload;
      await apiFetch(apiRoutes.admin.productById(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload),
      });

      if (imageFile) {
        await uploadProductImage(id, productPayload.name ?? '', imageFile);
      }

      navigate(`/product/${encodeURIComponent(productPayload.name ?? '')}`);
    } catch (e) {
      console.error(e);
      alert('Failed to save product. See console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading…</div>;
  if (!initial) return <div>Product not found.</div>;

  return (
    <div>
      <div className="text-center mb-6 pt-3 pb-1.5">
        <h1 className="m-0 text-[clamp(2rem,3vw,2.6rem)] leading-[1.15] font-black tracking-[-0.04em] text-text-main">Edit product</h1>
        <p className="mt-2.5 mx-auto mb-0 max-w-[58ch] text-gray-500 text-base leading-[1.6]">Update the existing product details using the same form as creation.</p>
      </div>
      <ProductFormComposition initial={initial} onSubmit={handleSave} submitting={submitting} />
    </div>
  );
}
