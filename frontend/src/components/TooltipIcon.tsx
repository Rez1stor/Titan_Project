import React, { useState } from 'react';
import { Info } from 'lucide-react';

export default function TooltipIcon({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        aria-label={label}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '999px',
          border: '1px solid #E5E7EB',
          background: '#F9FAFB',
          color: '#9CA3AF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          cursor: 'help',
          boxShadow: '0 1px 2px rgba(45, 36, 36, 0.06)'
        }}
      >
        <Info size={11} />
      </button>

      {open ? (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 'calc(100% + 10px)',
            transform: 'translateX(-50%)',
            width: '240px',
            background: 'linear-gradient(180deg, #2D2424 0%, #3B2F2A 100%)',
            color: '#FFF7ED',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderTop: '3px solid #A0522D',
            borderRadius: '16px',
            padding: '12px 14px',
            boxShadow: '0 18px 40px rgba(45, 36, 36, 0.18)',
            zIndex: 20,
            fontSize: '0.78rem',
            lineHeight: 1.5,
            textTransform: 'none',
            letterSpacing: '0',
            whiteSpace: 'normal',
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: '#F5D6B4', marginBottom: '6px' }}>{label}</div>
          <div>{children}</div>
        </div>
      ) : null}
    </span>
  );
}
