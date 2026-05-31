import { ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useTypeToSearch from '../../hooks/useTypeToSearch';
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
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
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
    if (!open || !rootRef.current) {
      return;
    }

    const updateMenuPosition = () => {
      if (!rootRef.current) {
        return;
      }

      const rect = rootRef.current.getBoundingClientRect();
      const gap = 10;
      const preferredHeight = compact ? 220 : 280;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const placeAbove = spaceBelow < preferredHeight && spaceAbove > spaceBelow;
      const maxHeight = Math.max(160, Math.min(preferredHeight, placeAbove ? spaceAbove : spaceBelow));

      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
        top: placeAbove ? undefined : rect.bottom + gap,
        bottom: placeAbove ? window.innerHeight - rect.top + gap : undefined,
        maxHeight,
      });
    };

    updateMenuPosition();

    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [compact, open]);

  useLayoutEffect(() => {
    if (open) {
      // focus menu so it receives keyboard events
      try {
        menuRef.current?.focus();
      } catch (e) {
        console.debug?.(e);
      }
    }
  }, [open]);

  const visibleOptions = filter ? options.filter((o) => o.label.toLowerCase().includes(filter.toLowerCase())) : options;

  const { onKeyDown } = useTypeToSearch(visibleOptions.map((o) => ({ label: o.label })), optionRefs);

  const selectedOption = options.find((option) => option.value === value);
  const buttonLabel = selectedOption?.label ?? placeholder ?? 'Select option';

  return (
    <div ref={rootRef} style={rootStyle} data-open={open ? 'true' : 'false'}>
      <style>{dropdownStyles}</style>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="titan-select-field__button"
        style={variant === 'field' ? inputStyle : compact ? compactSelectStyle : selectStyle}
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
              style={{ ...getMenuStyle(open), ...menuStyle }}
              role="listbox"
              aria-hidden={!open}
              tabIndex={-1}
              onKeyDown={onKeyDown}
            >
              {searchable ? (
                <div style={{ padding: '8px 12px' }}>
                  <input
                    aria-label="Filter options"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #E7D8C4' }}
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

const rootStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
};

const selectStyle: CSSProperties = {
  width: '100%',
  border: '1px solid #E7D8C4',
  background: '#F7F1E8',
  color: '#2D2424',
  padding: '16px 48px 16px 18px',
  borderRadius: '16px',
  fontSize: '1rem',
  fontWeight: 800,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease, background 180ms ease',
  textAlign: 'left',
};

const compactSelectStyle: CSSProperties = {
  ...selectStyle,
  padding: '12px 42px 12px 14px',
  borderRadius: '14px',
  fontSize: '0.95rem',
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid #E5E7EB',
  backgroundColor: '#FAF9F6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  color: '#111827',
  fontWeight: 700,
};

const dropdownStyles = `
  .titan-select-field__button:hover {
    transform: translateY(-1px);
    border-color: #CCB79D;
    box-shadow: 0 10px 22px rgba(93, 64, 55, 0.08);
  }

  .titan-select-field__button:focus-visible {
    outline: 2px solid #5D4037;
    outline-offset: 2px;
  }

  .titan-select-field__label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .titan-select-field__icon {
    flex-shrink: 0;
    transition: transform 220ms ease;
  }

  .titan-select-field[data-open='true'] .titan-select-field__icon {
    transform: rotate(180deg);
  }

  .titan-select-field[data-open='true'] {
    z-index: 50;
  }

  .titan-select-field__menu {
    position: fixed;
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow-x: hidden;
    overflow-y: auto;
    background: #FFFDF9;
    border: 1px solid #E7D8C4;
    box-shadow: 0 18px 36px rgba(45, 36, 36, 0.12);
    border-radius: 18px;
    padding: 8px;
    transition: opacity 180ms ease, transform 180ms ease, max-height 220ms ease;
    margin-top: 0;
    will-change: transform, opacity;
  }

  .titan-select-field__option {
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
    border-radius: 12px;
    padding: 12px 14px;
    color: #2D2424;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 160ms ease, color 160ms ease, transform 160ms ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .titan-select-field__option-label {
    min-width: 0;
  }

  .titan-select-field__option-hint {
    font-size: 0.74rem;
    font-weight: 600;
    color: #8B7A6A;
    text-align: right;
    flex-shrink: 0;
  }

  .titan-select-field__option:hover,
  .titan-select-field__option:focus-visible {
    background: #2D2424;
    color: #FFF7ED;
    transform: translateX(2px);
    outline: none;
  }
`;

function getMenuStyle(open: boolean): CSSProperties {
  return {
    opacity: open ? 1 : 0,
    transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.98)',
    pointerEvents: open ? 'auto' : 'none',
    maxHeight: open ? '280px' : '0px',
  };
}
