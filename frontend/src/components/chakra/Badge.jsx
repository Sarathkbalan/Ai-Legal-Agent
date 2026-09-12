import React from 'react';

export function Badge({
  children,
  colorScheme = 'gray',
  variant = 'subtle',
  className = '',
  ...props
}) {
  const schemes = {
    teal: {
      subtle: 'bg-[#319795]/20 text-[#4FD1C5] border border-[#319795]/40',
      solid: 'bg-[#319795] text-white',
      outline: 'border border-[#38B2AC] text-[#38B2AC]'
    },
    blue: {
      subtle: 'bg-[#3182CE]/20 text-[#90CDF4] border border-[#3182CE]/40',
      solid: 'bg-[#3182CE] text-white',
      outline: 'border border-[#4299E1] text-[#4299E1]'
    },
    purple: {
      subtle: 'bg-[#805AD5]/20 text-[#D6BCFA] border border-[#805AD5]/40',
      solid: 'bg-[#805AD5] text-white',
      outline: 'border border-[#9F7AEA] text-[#9F7AEA]'
    },
    green: {
      subtle: 'bg-[#38A169]/20 text-[#9AE6B4] border border-[#38A169]/40',
      solid: 'bg-[#38A169] text-white',
      outline: 'border border-[#48BB78] text-[#48BB78]'
    },
    red: {
      subtle: 'bg-[#E53E3E]/20 text-[#FEB2B2] border border-[#E53E3E]/40',
      solid: 'bg-[#E53E3E] text-white',
      outline: 'border border-[#F56565] text-[#F56565]'
    },
    orange: {
      subtle: 'bg-[#DD6B20]/20 text-[#FBD38D] border border-[#DD6B20]/40',
      solid: 'bg-[#DD6B20] text-white',
      outline: 'border border-[#ED8936] text-[#ED8936]'
    },
    cyan: {
      subtle: 'bg-[#00B5D8]/20 text-[#76E4F7] border border-[#00B5D8]/40',
      solid: 'bg-[#00B5D8] text-white',
      outline: 'border border-[#0BC5EA] text-[#0BC5EA]'
    },
    gray: {
      subtle: 'bg-[#4A5568]/30 text-[#E2E8F0] border border-[#4A5568]/60',
      solid: 'bg-[#4A5568] text-white',
      outline: 'border border-[#718096] text-[#CBD5E0]'
    }
  };

  const currentScheme = schemes[colorScheme] || schemes.gray;
  const currentVariant = currentScheme[variant] || currentScheme.subtle;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold font-mono uppercase tracking-wider ${currentVariant} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
