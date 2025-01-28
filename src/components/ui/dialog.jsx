import React from 'react';
import clsx from 'clsx';

/**
 * Podemos simular un dialog modal usando un estado open
 * y aplicando estilos fijos con un overlay + contenido centrado.
 */
export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={() => onOpenChange(false)}
    >
      {children}
    </div>
  );
}

// Contenido del Dialog que no cierra al hacer click
export function DialogContent({ className, children, ...props }) {
  const handleClick = (e) => {
    e.stopPropagation(); // evitar que cierre al hacer click dentro
  };
  return (
    <div
      className={clsx(
        'w-full max-w-lg rounded-md bg-white p-4 shadow-lg',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
}
