import type { ReactNode } from 'react';
import { FilterField } from './FilterField';

export default function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  leftLabel,
  rightLabel,
  marks,
  valueSuffix = '',
  helperText,
  onClassSelect,
}: {
  label: ReactNode;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  leftLabel: string;
  rightLabel: string;
  marks: Array<{ label: string; value: number }>;
  valueSuffix?: string;
  helperText?: string;
  onClassSelect?: (key: string, mid: number) => void;
}) {

  return (
    <FilterField
      label={label}
      helperText={helperText}
    >
      <div className="grid grid-cols-[auto_auto_auto] justify-between items-center gap-2.5 mb-3">
        <span className="text-brand-color text-[0.82rem] uppercase tracking-[0.08em]">{leftLabel}</span>
        <span className="min-w-[56px] text-center px-2.5 py-1.5 rounded-full bg-white text-brand-color border border-[#E7D8C4] font-extrabold">{`${Number(value).toFixed(step < 1 ? 1 : 0)}${valueSuffix}`}</span>
        <span className="text-brand-color text-[0.82rem] uppercase tracking-[0.08em]">{rightLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-brand-color"
      />
      <div className="flex justify-between gap-2 flex-wrap mt-2.5">
        {marks.map((mark, index) => {
          // clickable class ranges mapping
          const classRanges: Record<string, [number, number]> = {
            Pale: [2, 7],
            Amber: [8, 14],
            Brown: [15, 25],
            Dark: [26, 50],
          };

          const isClassLabel = mark.label in classRanges;
          let active = false;

          if (isClassLabel) {
            const rangeForLabel = classRanges[mark.label as keyof typeof classRanges];
            active = value >= rangeForLabel[0] && value <= rangeForLabel[1];
          } else {
            const previousValue = index > 0 ? marks[index - 1].value : min;
            const nextValue = index < marks.length - 1 ? marks[index + 1].value : max;
            const lowerBound = index === 0 ? -Infinity : (previousValue + mark.value) / 2;
            const upperBound = index === marks.length - 1 ? Infinity : (mark.value + nextValue) / 2;
            active = value >= lowerBound && value < upperBound;
          }

          if (isClassLabel) {
            const rangeForLabel = classRanges[mark.label as keyof typeof classRanges];
            const mid = Math.round((rangeForLabel[0] + rangeForLabel[1]) / 2);
            return (
              <span
                key={mark.label}
                role="button"
                tabIndex={0}
                onClick={() => { onClassSelect?.(mark.label, mid); onChange(mid); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onClassSelect?.(mark.label, mid); onChange(mid); e.preventDefault(); } }}
                className={`px-2 py-1 rounded-full text-[0.74rem] select-none cursor-pointer ${active ? 'bg-brand-color text-white' : 'bg-[#F4F1EC] text-[#8B7D73]'}`}
              >
                {mark.label}
              </span>
            );
          }

          return (
            <span key={mark.label} className={`px-2 py-1 rounded-full text-[0.74rem] ${active ? 'bg-brand-color text-white' : 'bg-[#F4F1EC] text-[#8B7D73]'}`}>
              {mark.label}
            </span>
          );
        })}
      </div>
    </FilterField>
  );
}
