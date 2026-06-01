import { apiFetch } from './api';

type ProductImageUploadResponse = {
  productId: number | string;
  imageUrl?: string;
  localPath?: string;
};

export async function uploadProductImage(productId: number | string, productName: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('productName', productName);

  return apiFetch<ProductImageUploadResponse>(`/api/dev/alcohol-images/upload/${productId}`, {
    method: 'POST',
    body: formData,
  });
}

export function resolveProductImageSrc(imageUrl?: string | null) {
  if (!imageUrl) return undefined;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  const apiBase = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://127.0.0.1:5542';
  const base = apiBase.replace(/\/+$/, '');
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

  return `${base}${encodeURI(path)}`;
}