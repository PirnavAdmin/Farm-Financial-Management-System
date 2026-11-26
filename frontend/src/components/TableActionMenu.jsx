import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './TableActionMenu.css';

function renderIcon(icon, type) {
  if (React.isValidElement(icon)) return icon;
  const iconType = icon || type;
  if (iconType === 'view') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  if (iconType === 'edit') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    );
  }
  if (iconType === 'delete') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    );
  }
  if (iconType === 'pay') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    );
  }
  return null;
}

export default function TableActionMenu({
  items = [],
  align = 'right',
  title = 'Actions',
  ariaLabel = 'Actions',
  buttonClassName = '',
  children,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClose = () => {
      setIsOpen(false);
      setPosition(null);
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('resize', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, [isOpen]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      setPosition(null);
      return;
    }
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 148;
    const menuHeight = items.length * 36 + 12;

    let left = align === 'left' ? rect.left : rect.right - menuWidth;
    left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));

    const top =
      rect.bottom + 4 + menuHeight > window.innerHeight
        ? Math.max(8, rect.top - 4 - menuHeight)
        : rect.bottom + 4;

    setPosition({ top, left });
    setIsOpen(true);
  };

  const validItems = items.filter(Boolean);
  if (validItems.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`table-action-menu-btn ${isOpen ? 'active' : ''} ${buttonClassName}`.trim()}
        title={title}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={handleToggle}
      >
        {children || '⋮'}
      </button>

      {isOpen && position && createPortal(
        <div
          className="table-action-menu-dropdown"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
          onClick={(e) => e.stopPropagation()}
          role="menu"
        >
          {validItems.map((item, idx) => {
            const isDanger = item.danger || item.type === 'delete' || item.icon === 'delete';
            const itemType =
              item.type ||
              (item.icon === 'view'
                ? 'view'
                : item.icon === 'edit'
                ? 'edit'
                : item.icon === 'delete'
                ? 'delete'
                : item.icon === 'pay'
                ? 'pay'
                : '');
            return (
              <button
                key={idx}
                type="button"
                className={`table-action-menu-item ${itemType} ${isDanger ? 'delete' : ''} ${
                  item.disabled ? 'disabled' : ''
                }`.trim()}
                title={item.title || item.label}
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  setPosition(null);
                  if (item.onClick && !item.disabled) {
                    item.onClick(e);
                  }
                }}
                role="menuitem"
              >
                {renderIcon(item.icon, item.type)}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}
