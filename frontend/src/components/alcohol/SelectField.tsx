import { ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useTypeToSearch from '../../hooks/useTypeToSearch';
import useDropdownPosition from '../../hooks/useDropdownPosition';
import type { CSSProperties } from 'react';

export default function SelectField({
  value,
  onChange,
  options,
  placeholder,
  compact = false,
  searchable = false,
  variant = 'select',
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string; hint?: string }>;
  placeholder?: string;
  compact?: boolean;
  searchable?: boolean;
  variant?: 'select' | 'field';
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuStyle = useDropdownPosition(open, rootRef, compact);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (rootRef.current && !rootRef.current.contains(target) && menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useLayoutEffect(() => {
    if (open) {
      try {
        menuRef.current?.focus();
      } catch (e) {
        console.debug?.(e);
      }
    }
  }, [open]);

  const visibleOptions = filter ? options.filter((option) => option.label.toLowerCase().includes(filter.toLowerCase())) : options;

  const { onKeyDown } = useTypeToSearch(visibleOptions.map((option) => ({ label: option.label })), optionRefs);

  const selectedOption = options.find((option) => option.value === value);
  const buttonLabel = selectedOption?.label ?? placeholder ?? 'Select option';

  return (
    <div ref={rootRef} className="relative w-full titan-select-field" data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`titan-select-field__button text-left w-full border ${variant === 'field' ? 'border-gray-200 bg-[#FAF9F6] text-gray-900 rounded-[10px] p-[12px_14px] font-bold flex items-center justify-between gap-3' : compact ? 'border-[#E7D8C4] bg-[#F7F1E8] text-text-main rounded-[14px] p-[12px_42px_12px_14px] text-[0.95rem] font-extrabold cursor-pointer flex items-center justify-between gap-3 transition-all duration-180 ease-in-out' : 'border-[#E7D8C4] bg-[#F7F1E8] text-text-main rounded-2xl p-[16px_48px_16px_18px] text-[1rem] font-extrabold cursor-pointer flex items-center justify-between gap-3 transition-all duration-180 ease-in-out'}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="titan-select-field__label">{buttonLabel}</span>
        <ChevronDown size={compact ? 16 : 18} color="#5D4037" className="titan-select-field__icon" />
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              className="titan-select-field__menu"
              style={{ ...getMenuStyle(open), ...(menuStyle as CSSProperties) }}
              role="listbox"
              aria-hidden={!open}
              tabIndex={-1}
              onKeyDown={onKeyDown}
            >
              {searchable ? (
                <div className="p-2 px-3">
                  <input
                    aria-label="Filter options"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full p-2 px-3 rounded-[10px] border border-[#E7D8C4] focus:outline-none focus:ring-1 focus:ring-brand-color transition-colors"
                  />
                </div>
              ) : null}

              {placeholder ? (
                <button
                  type="button"
                  className="titan-select-field__option"
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  {placeholder}
                </button>
              ) : null}

              {visibleOptions.map((option, idx) => (
                <button
                  key={option.value}
                  type="button"
                  className="titan-select-field__option"
                  ref={(el) => {
                    optionRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="titan-select-field__option-label">{option.label}</span>
                  {option.hint ? <span className="titan-select-field__option-hint">{option.hint}</span> : null}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function getMenuStyle(open: boolean): CSSProperties {
  return {
    opacity: open ? 1 : 0,
    transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.98)',
    pointerEvents: open ? 'auto' : 'none',
    maxHeight: open ? '280px' : '0px',
  };
}
