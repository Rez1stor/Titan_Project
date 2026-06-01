import type { ReactNode } from 'react';

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
    <div className="bg-[#FAF8F5] border border-[#EFE7DB] rounded-[20px] p-[14px_16px_16px]">
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="text-text-main text-[1rem] font-black uppercase tracking-[0.05em]">{label}</div>
        {helperText ? <div className="text-[#8B7D73] text-[0.8rem] leading-[1.4] text-right">{helperText}</div> : null}
      </div>
      {children}
    </div>
  );
}
