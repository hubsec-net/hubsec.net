'use client';

import { useRef, useEffect } from 'react';

export function MobileMenuButton({ menuId }: { menuId: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  function close() {
    const menu = document.getElementById(menuId);
    if (menu) menu.style.display = 'none';
    document.body.style.overflow = '';
    if (buttonRef.current) {
      buttonRef.current.setAttribute('aria-expanded', 'false');
    }
  }

  function toggle() {
    const menu = document.getElementById(menuId);
    if (!menu) return;

    const isOpen = menu.style.display !== 'none';

    if (isOpen) {
      close();
    } else {
      menu.style.display = 'block';
      document.body.style.overflow = 'hidden';
      if (buttonRef.current) {
        buttonRef.current.setAttribute('aria-expanded', 'true');
      }
    }
  }

  // Close menu when a link inside it is clicked (client-side navigation)
  useEffect(() => {
    const menu = document.getElementById(menuId);
    if (!menu) return;
    const handler = (e: Event) => {
      if ((e.target as HTMLElement).closest('a')) close();
    };
    menu.addEventListener('click', handler);
    return () => menu.removeEventListener('click', handler);
  });

  return (
    <button
      ref={buttonRef}
      type="button"
      className="md:hidden"
      onClick={toggle}
      aria-label="Menu"
      aria-expanded="false"
      aria-controls={menuId}
      style={{
        color: 'var(--color-text-secondary)',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '-10px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </svg>
    </button>
  );
}
