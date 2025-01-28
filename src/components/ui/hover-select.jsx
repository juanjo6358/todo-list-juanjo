import React, { useState } from 'react';
import { Select, SelectTrigger, SelectContent } from './select';

export function HoverSelect({ children, ...props }) {
  const [open, setOpen] = useState(false);
  let timeoutId = null;

  const handleMouseEnter = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutId = setTimeout(() => {
      setOpen(false);
    }, 100); // pequeño delay para mejor UX
  };

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Select open={open} onOpenChange={setOpen} {...props}>
        {children}
      </Select>
    </div>
  );
}

export { SelectTrigger, SelectContent }; 