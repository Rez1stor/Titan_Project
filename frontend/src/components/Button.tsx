import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' };

export default function Button({ variant = 'primary', style, children, ...rest }: Props) {
  const base: React.CSSProperties = { padding: '12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' };
  const primary: React.CSSProperties = { background: '#2D2424', color: 'white', border: 'none' };
  const ghost: React.CSSProperties = { background: 'transparent', color: '#5D4037', border: 'none' };
  return (
    <button {...rest} style={{ ...base, ...(variant === 'primary' ? primary : ghost), ...style }}>
      {children}
    </button>
  );
}
