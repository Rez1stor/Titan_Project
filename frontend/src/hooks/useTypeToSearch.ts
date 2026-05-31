import { useRef } from 'react';

const DEFAULT_TYPE_TIMEOUT = 1200;

export default function useTypeToSearch<T extends { label: string }>(
  options: T[],
  optionRefs: React.MutableRefObject<Array<HTMLElement | null>>,
  typeTimeout = DEFAULT_TYPE_TIMEOUT,
) {
  const bufferRef = useRef('');
  const lastTypeRef = useRef<number | null>(null);

  const clearBuffer = () => {
    bufferRef.current = '';
    lastTypeRef.current = null;
  };

  const handleType = (key: string) => {
    const now = Date.now();
    if (lastTypeRef.current && now - lastTypeRef.current < typeTimeout) {
      bufferRef.current += key;
    } else {
      bufferRef.current = key;
    }
    lastTypeRef.current = now;

    const q = bufferRef.current.toLowerCase();
    const idx = options.findIndex((o) => o.label.toLowerCase().startsWith(q));
    if (idx >= 0) {
      const el = optionRefs.current[idx];
      if (el && typeof el.focus === 'function') {
        el.focus();
        try {
          if (typeof (el as HTMLElement).scrollIntoView === 'function') {
            (el as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        } catch (e) {
          console.debug?.(e);
        }
      }
    }

    // schedule clear
    setTimeout(() => {
      const later = Date.now();
      if (lastTypeRef.current && later - lastTypeRef.current >= typeTimeout) {
        clearBuffer();
      }
    }, typeTimeout + 20);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const { key } = event;
    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // printable character
      handleType(key);
      return;
    }

    // allow navigation keys to move focus
    if (key === 'ArrowDown') {
      event.preventDefault();
      const currentIndex = optionRefs.current.findIndex((el) => el === document.activeElement);
      const next = Math.min(optionRefs.current.length - 1, Math.max(0, currentIndex + 1));
      const el = optionRefs.current[next];
      el?.focus();
      el?.scrollIntoView({ block: 'nearest' });
      clearBuffer();
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault();
      const currentIndex = optionRefs.current.findIndex((el) => el === document.activeElement);
      const prev = Math.min(optionRefs.current.length - 1, Math.max(0, currentIndex - 1));
      const el = optionRefs.current[prev];
      el?.focus();
      el?.scrollIntoView({ block: 'nearest' });
      clearBuffer();
      return;
    }

    if (key === 'Home') {
      event.preventDefault();
      const el = optionRefs.current[0];
      el?.focus();
      el?.scrollIntoView({ block: 'nearest' });
      clearBuffer();
      return;
    }

    if (key === 'End') {
      event.preventDefault();
      const el = optionRefs.current[optionRefs.current.length - 1];
      el?.focus();
      el?.scrollIntoView({ block: 'nearest' });
      clearBuffer();
      return;
    }

    if (key === 'Escape') {
      clearBuffer();
    }
  };

  return { onKeyDown, clearBuffer };
}
