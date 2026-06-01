import { useEffect, useState } from 'react';

const MAX_ABV = 96;
const MAX_NAME = 120;
const MAX_DESCRIPTION = 2000;

export type ProductFormValidationValues = {
  name: string;
  description: string;
  strengthAbv: number;
  basePrice: number;
};

export default function useProductFormValidation({
  name,
  description,
  strengthAbv,
  basePrice,
}: ProductFormValidationValues) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};

    if (!name || name.trim().length === 0) next.name = 'Name is required.';
    else if (name.length > MAX_NAME) next.name = `Name must be ≤ ${MAX_NAME} characters.`;

    if (description && description.length > MAX_DESCRIPTION) {
      next.description = `Description must be ≤ ${MAX_DESCRIPTION} characters.`;
    }

    if (strengthAbv !== null && strengthAbv !== undefined) {
      if (Number.isNaN(Number(strengthAbv))) next.strengthAbv = 'ABV must be a number.';
      else if (strengthAbv < 0) next.strengthAbv = 'ABV cannot be negative.';
      else if (strengthAbv > MAX_ABV) next.strengthAbv = `ABV must be ≤ ${MAX_ABV}%.`;
    }

    if (Number.isNaN(Number(basePrice)) || basePrice < 0) {
      next.basePrice = 'Price must be a non-negative number.';
    }

    setErrors(next);
  }, [name, description, strengthAbv, basePrice]);

  return { errors, setErrors, MAX_ABV, MAX_NAME, MAX_DESCRIPTION };
}
