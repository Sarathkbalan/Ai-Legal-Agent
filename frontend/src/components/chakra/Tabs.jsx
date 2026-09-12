import React from 'react';

export function Tabs({ children, className = '', ...props }) {
  return (
    <div className={`w-full ${className}`} {...props}>
      {children}
    </div>
  );
}

export function TabList({ children, className = '', ...props }) {
  return (
    <div className={`flex items-center space-x-2 border-b border-[#2D3748] ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Tab({
  children,
  isSelected = false,
  onClick,
  variant = 'line',
  className = '',
  ...props
}) {
  const lineStyles = isSelected
    ? 'border-b-2 border-[#319795] text-[#4FD1C5] font-semibold'
    : 'border-b-2 border-transparent text-[#A0AEC0] hover:text-white hover:border-[#4A5568]';

  const roundedStyles = isSelected
    ? 'bg-[#319795]/20 text-[#4FD1C5] font-semibold border border-[#319795]/40'
    : 'text-[#A0AEC0] hover:text-white hover:bg-[#2D3748]/50';

  const style = variant === 'line' ? lineStyles : roundedStyles;

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-xs sm:text-sm transition-all duration-150 flex items-center gap-2 outline-none focus:outline-none ${style} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
