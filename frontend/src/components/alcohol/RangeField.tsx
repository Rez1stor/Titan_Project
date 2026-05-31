import type { CSSProperties, ReactNode } from 'react';
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
  const range = max - min || 1;

  return (
    <FilterField
      label={label}
      helperText={helperText}
    >
      <div style={headerStyle}>
        <span style={edgeLabelStyle}>{leftLabel}</span>
        <span style={pillStyle}>{`${Number(value).toFixed(step < 1 ? 1 : 0)}${valueSuffix}`}</span>
        <span style={edgeLabelStyle}>{rightLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={sliderStyle}
      />
      <div style={marksStyle}>
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
                style={{
                  ...(active ? activeMarkStyle : markStyle),
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {mark.label}
              </span>
            );
          }

          return (
            <span key={mark.label} style={active ? activeMarkStyle : markStyle}>
              {mark.label}
            </span>
          );
        })}
      </div>
    </FilterField>
  );
}

const headerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto auto auto',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '12px',
};

const edgeLabelStyle: CSSProperties = {
  color: '#5D4037',
  fontSize: '0.82rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const pillStyle: CSSProperties = {
  minWidth: '56px',
  textAlign: 'center',
  padding: '6px 10px',
  borderRadius: '999px',
  background: '#FFFFFF',
  color: '#5D4037',
  border: '1px solid #E7D8C4',
  fontWeight: 800,
};

const sliderStyle: CSSProperties = {
  width: '100%',
  accentColor: '#5D4037',
};

const marksStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '8px',
  flexWrap: 'wrap',
  marginTop: '10px',
};

const markStyle: CSSProperties = {
  padding: '4px 8px',
  borderRadius: '999px',
  background: '#F4F1EC',
  color: '#8B7D73',
  fontSize: '0.74rem',
};

const activeMarkStyle: CSSProperties = {
  ...markStyle,
  background: '#5D4037',
  color: '#FFFFFF',
};
