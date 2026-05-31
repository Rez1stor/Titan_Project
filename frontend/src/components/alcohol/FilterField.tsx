import type { CSSProperties, ReactNode } from 'react';

export function FilterField({
  label,
  helperText,
  children,
}: {
  label: ReactNode;
  helperText?: string;
  children: ReactNode;
}) {
  return (
    <div style={fieldStyle}>
      <div style={headerStyle}>
        <div style={labelStyle}>{label}</div>
        {helperText ? <div style={helperStyle}>{helperText}</div> : null}
      </div>
      {children}
    </div>
  );
}

const fieldStyle: CSSProperties = {
  background: '#FAF8F5',
  border: '1px solid #EFE7DB',
  borderRadius: '20px',
  padding: '14px 16px 16px',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'flex-start',
  marginBottom: '12px',
};

const labelStyle: CSSProperties = {
  color: '#2D2424',
  fontSize: '1rem',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const helperStyle: CSSProperties = {
  color: '#8B7D73',
  fontSize: '0.8rem',
  lineHeight: 1.4,
  textAlign: 'right',
};
