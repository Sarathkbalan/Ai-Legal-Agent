import React from 'react';
import { AlertOctagon, FileX, Copy, Globe2, ShieldAlert } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from '../chakra/Modal';
import { Alert, AlertIcon, AlertTitle, AlertDescription } from '../chakra/Alert';
import { Badge } from '../chakra/Badge';
import { Button } from '../chakra/Button';

export default function RejectionNoticeModal({ isOpen, onClose, errorData }) {
  if (!isOpen || !errorData) return null;

  const error = errorData.error || errorData;
  const code = error.code || 'REJECTION_ERROR';
  const message = error.message || 'Document upload rejected by legal validation gates.';
  const stage = error.stage || 'VALIDATION_GATE';
  const details = error.details || {};

  const getCodeBadge = () => {
    switch (code) {
      case 'NON_UK_LEGAL_DOCUMENT':
        return <Badge colorScheme="red">Non-UK Jurisdiction</Badge>;
      case 'NON_LEGAL_DOCUMENT':
        return <Badge colorScheme="orange">Non-Legal Content</Badge>;
      case 'DUPLICATE_DOCUMENT':
      case 'NEAR_DUPLICATE_DOCUMENT':
        return <Badge colorScheme="blue">Duplicate Authority</Badge>;
      case 'CORRUPTED_FILE':
        return <Badge colorScheme="red">Corrupted File Structure</Badge>;
      case 'EMPTY_DOCUMENT':
        return <Badge colorScheme="red">Empty Document</Badge>;
      default:
        return <Badge colorScheme="red">Validation Rejection</Badge>;
    }
  };

  const getTitle = () => {
    switch (code) {
      case 'NON_UK_LEGAL_DOCUMENT':
        return 'Rejection: Non-UK Legal Jurisdiction';
      case 'NON_LEGAL_DOCUMENT':
        return 'Rejection: Non-Legal Content Detected';
      case 'DUPLICATE_DOCUMENT':
        return 'Rejection: Exact Duplicate Document';
      case 'NEAR_DUPLICATE_DOCUMENT':
        return 'Rejection: Near-Duplicate Text Content';
      case 'CORRUPTED_FILE':
        return 'Rejection: Corrupted File Structure';
      case 'EMPTY_DOCUMENT':
        return 'Rejection: Empty Document (<50 chars)';
      default:
        return 'Document Validation Gate Rejection';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent maxW="max-w-lg">
        
        <ModalCloseButton onClick={onClose} />

        <ModalHeader className="space-y-1">
          <div className="flex items-center gap-2">
            {getCodeBadge()}
            <span className="text-[11px] font-mono text-[#A0AEC0]">
              Gate: {stage}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">
            {getTitle()}
          </h3>
        </ModalHeader>

        <ModalBody className="space-y-4">
          
          {/* Chakra Alert Component */}
          <Alert status="error" variant="subtle">
            <AlertIcon status="error" />
            <div>
              <AlertTitle>Upload Rejected</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </div>
          </Alert>

          {/* Diagnostic Details */}
          {details && Object.keys(details).length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#A0AEC0]">
                Diagnostic Audit Metadata:
              </span>
              <div className="bg-[#171923] p-3 rounded-lg border border-[#2D3748] font-mono text-xs text-slate-300 space-y-1 overflow-x-auto">
                {Object.entries(details).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-[#4FD1C5] font-semibold">{k}:</span>
                    <span className="text-slate-300">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Policy Information Box */}
          <Alert status="warning" variant="subtle">
            <AlertIcon status="warning" />
            <div>
              <AlertTitle>Strict Common Law Isolation</AlertTitle>
              <AlertDescription>
                To maintain precedent integrity and avoid judicial hallucination, only legal documents from England & Wales, Scotland, Northern Ireland, and the UK Parliament are indexed.
              </AlertDescription>
            </div>
          </Alert>

        </ModalBody>

        <ModalFooter>
          <Button colorScheme="gray" variant="solid" onClick={onClose}>
            Acknowledge & Close
          </Button>
        </ModalFooter>

      </ModalContent>
    </Modal>
  );
}
