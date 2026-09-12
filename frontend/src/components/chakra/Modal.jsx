import React from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {children}
    </div>
  );
}

export function ModalContent({ children, className = '', maxW = 'max-w-2xl', ...props }) {
  return (
    <div
      className={`bg-[#1A202C] border border-[#2D3748] rounded-2xl w-full ${maxW} shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh] text-left ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function ModalHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-6 pb-4 border-b border-[#2D3748]/60 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function ModalBody({ children, className = '', ...props }) {
  return (
    <div className={`p-6 overflow-y-auto flex-1 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className = '', ...props }) {
  return (
    <div className={`p-5 pt-4 border-t border-[#2D3748]/60 flex items-center justify-end gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function ModalCloseButton({ onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-5 right-5 p-1.5 rounded-lg text-[#A0AEC0] hover:text-white hover:bg-[#2D3748] transition ${className}`}
    >
      <X className="w-5 h-5" />
    </button>
  );
}
