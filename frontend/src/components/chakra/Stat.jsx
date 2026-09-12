import React from 'react';

export function Stat({ children, className = '', ...props }) {
  return (
    <div
      className={`p-4 bg-[#1A202C] border border-[#2D3748] rounded-xl shadow-sm space-y-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatLabel({ children, className = '', ...props }) {
  return (
    <div className={`text-xs font-medium text-[#A0AEC0] flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}

export function StatNumber({ children, className = '', ...props }) {
  return (
    <div className={`text-2xl font-bold font-mono text-white ${className}`} {...props}>
      {children}
    </div>
  );
}

export function StatHelpText({ children, className = '', ...props }) {
  return (
    <div className={`text-[11px] text-[#718096] flex items-center gap-1 ${className}`} {...props}>
      {children}
    </div>
  );
}
