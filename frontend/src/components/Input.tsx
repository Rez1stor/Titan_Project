import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode };

export default function Input({ icon, style, ...rest }: Props) {
  const base: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FAF9F6' };
  return (
    <div style={{ position: 'relative' }}>
      {icon && <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>{icon}</div>}
      <input {...rest} style={icon ? { ...base, paddingLeft: 40, ...style } : { ...base, ...style }} />
    </div>
  );
}
