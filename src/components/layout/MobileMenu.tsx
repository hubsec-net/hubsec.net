'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export function MobileMenuButton({ menuId }: { menuId: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const menu = document.getElementById(menuId);
    if (!menu) return;
    menu.style.display = open ? 'block' : 'none';
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, menuId]);

  // Close on any navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(`#${menuId} a`)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuId]);

  return (
    <button
      type="button"
      className="md:hidden flex items-center justify-center"
      onClick={() => setOpen((prev) => !prev)}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      aria-controls={menuId}
      style={{
        color: 'var(--color-text-secondary)',
        width: '44px',
        height: '44px',
        marginRight: '-10px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {open ? (
        <X size={22} style={{ pointerEvents: 'none' }} />
      ) : (
        <Menu size={22} style={{ pointerEvents: 'none' }} />
      )}
    </button>
  );
}
