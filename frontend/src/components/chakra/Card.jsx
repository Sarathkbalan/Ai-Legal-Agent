import React from 'react';

export function Card({ children, className = '', variant = 'outline', ...props }) {
  const variantStyles = {
    outline: 'bg-[#1A202C] border border-[#2D3748] shadow-sm',
    elevated: 'bg-[#1A202C] border border-[#2D3748] shadow-lg shadow-black/40',
    filled: 'bg-[#171923] border border-transparent'
  };

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all duration-150 ${variantStyles[variant] || variantStyles.outline} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-5 pb-3 border-b border-[#2D3748]/60 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`p-5 pt-3 border-t border-[#2D3748]/60 flex items-center ${className}`} {...props}>
      {children}
    </div>
  );
}
