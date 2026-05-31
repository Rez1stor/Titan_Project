import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductForm from '../components/ProductForm';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [initial, setInitial] = React.useState<any>(null);
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

  React.useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`).then((r) => r.json()).then((d) => setInitial(d)).catch(() => setInitial(null)).finally(() => setLoading(false));
  }, [id]);

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

  const handleSave = async (payload: any) => {
    if (!id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to save product');
      }

      navigate(`/product/${id}`);
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
      <div style={pageHeaderStyle}>
        <h1 style={pageTitleStyle}>Edit product</h1>
        <p style={pageSubtitleStyle}>Update the existing product details using the same form as creation.</p>
      </div>
      <ProductForm initial={initial} onSubmit={handleSave} submitting={submitting} />
    </div>
  );
}
