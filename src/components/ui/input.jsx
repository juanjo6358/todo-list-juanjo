import React from 'react';
import clsx from 'clsx';

export function Input({ className, ...props }) {
  return (
    <input
      className={clsx(
        'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none',
        className
      )}
      {...props}
    />
  );
}
