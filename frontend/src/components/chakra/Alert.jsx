import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export function Alert({
  children,
  status = 'info',
  variant = 'subtle',
  className = '',
  ...props
}) {
  const statusStyles = {
    info: 'bg-[#3182CE]/15 border-[#3182CE] text-[#BEE3F8]',
    success: 'bg-[#38A169]/15 border-[#38A169] text-[#C6F6D5]',
    warning: 'bg-[#DD6B20]/15 border-[#DD6B20] text-[#FEEBC8]',
    error: 'bg-[#E53E3E]/15 border-[#E53E3E] text-[#FED7D7]'
  };

  const borderVariant = {
    subtle: 'border-l-4 rounded-r-lg',
    'top-accent': 'border-t-4 rounded-b-lg',
    outline: 'border rounded-lg'
  };

  return (
    <div
      className={`p-4 flex items-start gap-3 text-sm ${statusStyles[status]} ${borderVariant[variant] || borderVariant.subtle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertIcon({ status = 'info', className = '' }) {
  const icons = {
    info: <Info className={`w-5 h-5 text-[#63B3ED] flex-shrink-0 mt-0.5 ${className}`} />,
    success: <CheckCircle2 className={`w-5 h-5 text-[#68D391] flex-shrink-0 mt-0.5 ${className}`} />,
    warning: <AlertTriangle className={`w-5 h-5 text-[#F6AD55] flex-shrink-0 mt-0.5 ${className}`} />,
    error: <AlertCircle className={`w-5 h-5 text-[#FC8181] flex-shrink-0 mt-0.5 ${className}`} />
  };

  return icons[status] || icons.info;
}

export function AlertTitle({ children, className = '' }) {
  return (
    <div className={`font-bold text-white mb-0.5 ${className}`}>
      {children}
    </div>
  );
}

export function AlertDescription({ children, className = '' }) {
  return (
    <div className={`text-xs sm:text-sm text-slate-300 leading-relaxed ${className}`}>
      {children}
    </div>
  );
}
