import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductFormComposition from '../compositions/ProductFormComposition';
import useAdminGuard from '../hooks/useAdminGuard';
import type { ProductFormDto } from '../types';
import { apiRoutes } from '../api/routes';
import { apiFetch } from '../utils/api';
import { uploadProductImage } from '../utils/productImages';

export default function CreateProduct() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);

  useAdminGuard();

  const handleCreate = async (payload: ProductFormDto) => {
    setSubmitting(true);
    try {
      const { imageFile, ...productPayload } = payload;
      const created = await apiFetch<{ id?: number | string } | number | string>(apiRoutes.admin.products, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload),
      });

      const createdId: number | string | undefined =
        typeof created === 'object' && created !== null && 'id' in created
          ? (created as { id?: number | string }).id
          : (created as number | string);

      if (createdId !== undefined && imageFile) {
        await uploadProductImage(createdId, productPayload.name ?? '', imageFile);
      }

      navigate(`/product/${createdId}`);
    } catch (e) {
      console.error(e);
      alert('Failed to create product. See console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6 pt-3 pb-1.5">
        <h1 className="m-0 text-[clamp(2rem,3vw,2.6rem)] leading-[1.15] font-black tracking-[-0.04em] text-text-main">Create product</h1>
        <p className="mt-2.5 mx-auto mb-0 max-w-[58ch] text-gray-500 text-base leading-[1.6]">Add a new product to the catalog. Fill in the main details, pricing, and category-specific attributes below.</p>
      </div>
      <ProductFormComposition onSubmit={handleCreate} submitting={submitting} />
    </div>
  );
}
