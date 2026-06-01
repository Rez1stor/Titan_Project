import React, { useState } from 'react';
import { Info } from 'lucide-react';

export default function TooltipIcon({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center group">
      <button
        type="button"
        aria-label={label}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="w-[18px] h-[18px] rounded-full border border-gray-200 bg-gray-50 text-gray-400 inline-flex items-center justify-center p-0 cursor-help shadow-sm hover:bg-gray-100 hover:text-brand-color transition-colors"
      >
        <Info size={11} />
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute left-1/2 bottom-[calc(100%+10px)] -translate-x-1/2 w-[240px] bg-gradient-to-b from-[#2D2424] to-[#3B2F2A] text-orange-50 border border-white/10 border-t-[3px] border-t-[#A0522D] rounded-2xl px-3.5 py-3 shadow-[0_18px_40px_rgba(45,36,36,0.18)] z-20 text-[0.78rem] leading-relaxed whitespace-normal animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="text-[0.68rem] font-bold tracking-widest text-[#F5D6B4] mb-1.5 uppercase">{label}</div>
          <div>{children}</div>
        </div>
      )}
    </span>
  );
}
