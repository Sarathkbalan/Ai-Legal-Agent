import React from 'react';

export function Input({
  className = '',
  size = 'md',
  variant = 'outline',
  ...props
}) {
  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs rounded',
    md: 'px-3.5 py-2 text-sm rounded-md',
    lg: 'px-4 py-3 text-base rounded-lg'
  };

  return (
    <input
      className={`w-full bg-[#171923] border border-[#2D3748] text-slate-100 placeholder-[#718096] focus:outline-none focus:border-[#319795] focus:ring-1 focus:ring-[#319795] transition-all duration-150 shadow-inner ${sizeStyles[size]} ${className}`}
      {...props}
    />
  );
}

export function Select({
  children,
  className = '',
  size = 'md',
  ...props
}) {
  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs rounded',
    md: 'px-3 py-2 text-sm rounded-md',
    lg: 'px-4 py-3 text-base rounded-lg'
  };

  return (
    <select
      className={`bg-[#171923] border border-[#2D3748] text-slate-200 focus:outline-none focus:border-[#319795] focus:ring-1 focus:ring-[#319795] transition-all duration-150 cursor-pointer ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
