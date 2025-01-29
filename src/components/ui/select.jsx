import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

// Suponemos un "Select" muy sencillo: abrimos/cerramos una lista de Items.

export function Select({ value, onValueChange, children, className, open: controlledOpen, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const containerRef = useRef(null);
  
  // Usar open controlado si se proporciona, de lo contrario usar estado interno
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const trigger = React.Children.toArray(children).find(
    child => child.type?.displayName === 'SelectTrigger'
  );
  
  const content = React.Children.toArray(children).find(
    child => child.type?.displayName === 'SelectContent'
  );

  // Manejar clics fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setOpen]);

  const handleMouseEnter = () => {
    setOpen(true);
  };

  const handleMouseLeave = () => {
    setOpen(false);
  };

  return (
    <div 
      ref={containerRef}
      className={clsx('relative', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {trigger && React.cloneElement(trigger, { 
        onClick: () => setOpen(!open),
      })}
      {open && content && React.cloneElement(content, { 
        onValueChange: (newValue) => {
          onValueChange(newValue);
          setOpen(false);
        }
      })}
    </div>
  );
}

// Trigger: Lo que se muestra antes de desplegar
export function SelectTrigger({ children, className, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex w-full items-center justify-between px-4 py-2 text-sm',
        'bg-white text-gray-900 hover:bg-gray-50',
        'border border-gray-200 rounded-full',
        'relative pr-8', // Espacio para el icono
        className
      )}
    >
      {children}
      <svg 
        className="absolute right-3 h-4 w-4 opacity-50" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}
SelectTrigger.displayName = 'SelectTrigger';

// Content: lista de ítems
export function SelectContent({ children, onValueChange, className }) {
  if (!children) return null;

  return (
    <div className={clsx(
      'absolute z-[9999]',
      'mt-1 w-full rounded-lg border bg-white shadow-lg overflow-hidden',
      'border-gray-200',
      className
    )}>
      <div className="py-1">
        {React.Children.map(children, child => {
          if (!React.isValidElement(child)) return null;
          return React.cloneElement(child, { onValueChange });
        })}
      </div>
    </div>
  );
}
SelectContent.displayName = 'SelectContent';

// Item: cada opción
export function SelectItem({ children, value, onValueChange }) {
  return (
    <div
      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-50"
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </div>
  );
}
SelectItem.displayName = 'SelectItem';
