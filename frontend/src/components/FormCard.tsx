import React from 'react';

export default function FormCard({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  return (
    <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '520px', padding: '36px', borderRadius: '20px', boxShadow: '0 20px 50px rgba(93, 64, 55, 0.05)', border: '1px solid #F3F4F6' }}>
      {title ? (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#2D2424', fontSize: '2rem', fontWeight: '900', marginBottom: '6px' }}>{title}</h1>
          {subtitle ? <p style={{ color: '#9CA3AF' }}>{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
