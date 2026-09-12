import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  colorScheme = 'teal',
  variant = 'solid',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  className = '',
  disabled = false,
  ...props
}) {
  const sizeStyles = {
    xs: 'px-2 py-1 text-xs rounded',
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-md',
    md: 'px-4 py-2 text-sm font-semibold rounded-md',
    lg: 'px-6 py-3 text-base font-semibold rounded-lg'
  };

  const schemes = {
    teal: {
      solid: 'bg-[#319795] hover:bg-[#2C7A7B] active:bg-[#285E61] text-white shadow-sm shadow-[#319795]/20',
      outline: 'border border-[#319795] text-[#4FD1C5] hover:bg-[#319795]/15 active:bg-[#319795]/25',
      ghost: 'text-[#4FD1C5] hover:bg-[#319795]/15 active:bg-[#319795]/25',
      subtle: 'bg-[#319795]/20 text-[#4FD1C5] hover:bg-[#319795]/30'
    },
    blue: {
      solid: 'bg-[#3182CE] hover:bg-[#2B6CB0] active:bg-[#2C5282] text-white shadow-sm',
      outline: 'border border-[#3182CE] text-[#90CDF4] hover:bg-[#3182CE]/15',
      ghost: 'text-[#90CDF4] hover:bg-[#3182CE]/15',
      subtle: 'bg-[#3182CE]/20 text-[#90CDF4] hover:bg-[#3182CE]/30'
    },
    red: {
      solid: 'bg-[#E53E3E] hover:bg-[#C53030] active:bg-[#9B2C2C] text-white shadow-sm',
      outline: 'border border-[#E53E3E] text-[#FEB2B2] hover:bg-[#E53E3E]/15',
      ghost: 'text-[#FEB2B2] hover:bg-[#E53E3E]/15',
      subtle: 'bg-[#E53E3E]/20 text-[#FEB2B2] hover:bg-[#E53E3E]/30'
    },
    gray: {
      solid: 'bg-[#2D3748] hover:bg-[#4A5568] active:bg-[#1A202C] text-[#E2E8F0]',
      outline: 'border border-[#4A5568] text-[#CBD5E0] hover:bg-[#2D3748]/50',
      ghost: 'text-[#A0AEC0] hover:text-[#E2E8F0] hover:bg-[#2D3748]/60',
      subtle: 'bg-[#2D3748]/60 text-[#CBD5E0] hover:bg-[#2D3748]'
    }
  };

  const currentScheme = schemes[colorScheme] || schemes.teal;
  const currentVariant = currentScheme[variant] || currentScheme.solid;

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#319795]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${sizeStyles[size]} ${currentVariant} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          {loadingText ? <span>{loadingText}</span> : children}
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
