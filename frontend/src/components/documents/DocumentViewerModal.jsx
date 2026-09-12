import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, Search, FileText, Loader2, BookOpen, Type } from 'lucide-react';
import { fetchDocumentContent, getDocumentDownloadUrl } from '../../services/documentService';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from '../chakra/Modal';
import { Badge } from '../chakra/Badge';
import { Button } from '../chakra/Button';
import { Input } from '../chakra/Input';

export default function DocumentViewerModal({ isOpen, onClose, documentId, initialTitle }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSerif, setIsSerif] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && documentId) {
      setLoading(true);
      setSearchTerm('');
      fetchDocumentContent(documentId)
        .then((res) => setData(res.data || null))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  const content = data?.content || '';
  const downloadUrl = documentId ? getDocumentDownloadUrl(documentId) : '#';

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Highlight search matches
  const renderHighlightedContent = () => {
    if (!searchTerm.trim()) {
      return content;
    }

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = content.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-amber-400/30 text-amber-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const matchCount = searchTerm.trim()
    ? (content.match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
    : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent maxW="max-w-5xl" className="h-[90vh]">
        
        <ModalCloseButton onClick={onClose} />

        {/* Modal Header */}
        <ModalHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <Badge colorScheme="teal" variant="solid">
              {data?.neutralCitation || 'UK Legal Authority'}
            </Badge>
            <Badge colorScheme="purple" variant="subtle">
              {data?.court || 'UK Court'}
            </Badge>
            <Badge colorScheme="blue" variant="subtle">
              {data?.jurisdiction || 'UK Wide'}
            </Badge>
            <span className="text-[11px] text-[#718096] font-mono truncate max-w-xs">
              {data?.originalName || 'Document Reader'}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white font-serif leading-snug pr-8">
            {data?.title || initialTitle || 'Document Viewer'}
          </h3>

          {/* Search & Tool Ribbon */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            
            {/* Search inside Document */}
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#718096]" />
              <Input
                size="sm"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Find in document..."
                className="pl-8"
              />
              {searchTerm && (
                <span className="absolute right-2.5 top-2 text-[10px] font-mono text-[#A0AEC0]">
                  {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                </span>
              )}
            </div>

            {/* View Controls & Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                colorScheme="gray"
                onClick={() => setIsSerif(!isSerif)}
                leftIcon={<Type className="w-3 h-3" />}
                title="Toggle Serif / Sans font"
              >
                {isSerif ? 'Serif' : 'Sans'}
              </Button>

              <Button
                size="xs"
                variant="outline"
                colorScheme="gray"
                onClick={handleCopy}
                leftIcon={copied ? <Check className="w-3 h-3 text-[#68D391]" /> : <Copy className="w-3 h-3" />}
              >
                {copied ? 'Copied' : 'Copy Text'}
              </Button>

              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#319795] hover:bg-[#2C7A7B] text-white text-xs font-semibold rounded-md shadow-sm transition active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </a>
            </div>

          </div>
        </ModalHeader>

        {/* Modal Body with Document Text */}
        <ModalBody className="p-6 bg-[#171923]">
          {loading ? (
            <div className="p-16 text-center text-[#A0AEC0] flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#4FD1C5]" />
              <p className="text-xs">Loading complete judgment text...</p>
            </div>
          ) : !content ? (
            <div className="p-12 text-center text-[#718096] text-xs">
              No full text content available for this document.
            </div>
          ) : (
            <div
              className={`p-6 bg-[#1A202C] rounded-xl border border-[#2D3748] whitespace-pre-wrap leading-relaxed text-sm text-slate-200 shadow-inner select-text ${
                isSerif ? 'font-serif' : 'font-sans'
              }`}
            >
              {renderHighlightedContent()}
            </div>
          )}
        </ModalBody>

        {/* Modal Footer */}
        <ModalFooter>
          <div className="flex items-center justify-between w-full text-xs text-[#A0AEC0]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-[#4FD1C5]" />
              <span>
                {content.length.toLocaleString()} characters • {content.split(/\s+/).length.toLocaleString()} words
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={downloadUrl}
                download
                className="text-[#4FD1C5] hover:underline flex items-center gap-1 text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" /> Direct File Download
              </a>
              <Button size="sm" colorScheme="gray" variant="solid" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </ModalFooter>

      </ModalContent>
    </Modal>
  );
}
