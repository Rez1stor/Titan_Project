import React from 'react';
import { useLayoutEffect } from 'react';

type DropdownPosition = {
  position: 'fixed';
  left: number;
  width: number;
  zIndex: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
};

/**
 * Computes the position of a dropdown menu relative to a trigger element,
 * placing it below or above depending on available space.
 */
export default function useDropdownPosition(
  open: boolean,
  rootRef: React.RefObject<HTMLElement | null>,
  compact = false,
) {
  const [menuStyle, setMenuStyle] = React.useState<DropdownPosition | {}>({});

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;

    const updateMenuPosition = () => {
      if (!rootRef.current) return;
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
  }, [compact, open, rootRef]);

  return menuStyle;
}
