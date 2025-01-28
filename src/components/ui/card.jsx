import React from 'react';
import clsx from 'clsx';

export function Card({ className, children }) {
  return (
    <div
      className={clsx(
        'rounded-xl border shadow-sm transition-colors',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardContent({ className, children }) {
  return (
    <div className={clsx('p-4', className)}>
      {children}
    </div>
  );
}
