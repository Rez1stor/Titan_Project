import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';

export default function CreateProduct() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);

  const pageHeaderStyle = {
    textAlign: 'center' as const,
    marginBottom: '24px',
    padding: '12px 0 6px',
  };

  const pageTitleStyle = {
    margin: 0,
    fontSize: 'clamp(2rem, 3vw, 2.6rem)',
    lineHeight: 1.15,
    fontWeight: 900,
    letterSpacing: '-0.04em',
    color: '#2D2424',
  };

  const pageSubtitleStyle = {
    margin: '10px auto 0',
    maxWidth: '58ch',
    color: '#6B7280',
    fontSize: '1rem',
    lineHeight: 1.6,
  };

  const handleCreate = async (payload: any) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to create product');
      }

      const created = await res.json();
      const id = created?.id ?? created;
      navigate(`/product/${id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to create product. See console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => {
        if (!active) return null;
        if (!r.ok) return null;
        return r.json();
      })
      .then((u) => {
        if (!active) return;
        const role = u?.role ?? null;
        if (!role || !(role === 'Admin' || role === 'Moderator')) {
          alert('Access denied: administrators or moderators only');
          navigate('/login');
        }
      })
      .catch(() => {
        if (active) {
          alert('Access denied: administrators or moderators only');
          navigate('/login');
        }
      });

    return () => { active = false; };
  }, [navigate]);

  return (
    <div>
      <div style={pageHeaderStyle}>
        <h1 style={pageTitleStyle}>Create product</h1>
        <p style={pageSubtitleStyle}>Add a new product to the catalog. Fill in the main details, pricing, and category-specific attributes below.</p>
      </div>
      <ProductForm onSubmit={handleCreate} submitting={submitting} />
    </div>
  );
}
