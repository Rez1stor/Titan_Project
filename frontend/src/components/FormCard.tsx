import React from 'react';

export default function FormCard({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  return (
    <div className="bg-bg-card w-full max-w-[520px] p-9 rounded-2xl shadow-[0_20px_50px_rgba(93,64,55,0.05)] border border-gray-100">
      {title && (
        <div className="text-center mb-5">
          <h1 className="text-text-main text-[2rem] font-black mb-1.5">{title}</h1>
          {subtitle && <p className="text-gray-400">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
