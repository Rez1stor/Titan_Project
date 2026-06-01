import { ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import useTypeToSearch from '../../hooks/useTypeToSearch';
import useDropdownPosition from '../../hooks/useDropdownPosition';

export default function MultiSelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  options: Array<{ label: string; value: string; hint?: string }>;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuStyle = useDropdownPosition(open, rootRef);

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
      } catch {
        // ignore focus errors in non-browser environments
      }
    }
  }, [open]);

  const { onKeyDown } = useTypeToSearch(
    options.map((option) => ({ label: option.label })),
    optionRefs,
  );

  const selectedLabels = options.filter((option) => value.includes(option.value)).map((option) => option.label);
  const buttonLabel = selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder ?? 'Select options';

  return (
    <div ref={rootRef} className="relative w-full titan-select-field" data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="titan-select-field__button w-full border border-[#E7D8C4] bg-[#F7F1E8] text-text-main py-4 pr-12 pl-4.5 rounded-2xl text-[1rem] font-extrabold cursor-pointer flex items-center justify-between gap-3 transition-all duration-180 ease-in-out text-left"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="titan-select-field__label">{buttonLabel}</span>
        <ChevronDown size={18} color="#5D4037" className="titan-select-field__icon" />
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              className="titan-select-field__menu"
              style={{
                ...(menuStyle as CSSProperties),
                opacity: open ? 1 : 0,
                transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.98)',
                pointerEvents: open ? 'auto' : 'none',
                transition: 'opacity 180ms ease, transform 180ms ease, max-height 220ms ease',
              }}
              role="listbox"
              aria-multiselectable="true"
              tabIndex={-1}
              onKeyDown={onKeyDown}
            >
              {options.map((option, idx) => {
                const checked = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    className="titan-select-field__option"
                    ref={(el) => {
                      optionRefs.current[idx] = el;
                    }}
                    onClick={() => {
                      onChange(checked ? value.filter((item) => item !== option.value) : [...value, option.value]);
                    }}
                    aria-pressed={checked}
                  >
                    <span className="titan-select-field__option-label">{option.label}</span>
                    <span className={`w-4.5 h-4.5 rounded-full border border-[#CCB79D] inline-flex items-center justify-center text-orange-50 text-[12px] font-black ${checked ? 'bg-brand-color' : 'bg-white'}`}>
                      {checked ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
