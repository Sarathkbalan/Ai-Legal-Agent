import React, { useState, useEffect } from 'react';
import { Scale, Layers, User, Tag, Loader2, Download } from 'lucide-react';
import { fetchDocumentChunks, getDocumentDownloadUrl } from '../../services/documentService';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from '../chakra/Modal';
import { Badge } from '../chakra/Badge';
import { Button } from '../chakra/Button';

export default function DocumentDetailModal({ isOpen, onClose, document }) {
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && document?._id) {
      setLoading(true);
      fetchDocumentChunks(document._id)
        .then((res) => setChunks(res.data || []))
        .catch(() => setChunks([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  const meta = document.legalMetadata || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent maxW="max-w-4xl">
        <ModalCloseButton onClick={onClose} />

        <ModalHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge colorScheme="teal" variant="solid">
              {meta.neutralCitation || 'UK Statute'}
            </Badge>
            <Badge colorScheme="purple" variant="subtle">
              Tier {meta.courtTier || 1} Court
            </Badge>
            <Badge colorScheme="blue" variant="subtle">
              {meta.jurisdiction || 'UK Wide'}
            </Badge>
          </div>
          <h3 className="text-lg font-bold text-white">
            {meta.title}
          </h3>
          <p className="text-xs text-[#A0AEC0]">
            {meta.court} • Year {meta.year || 'N/A'}
          </p>
        </ModalHeader>

        <ModalBody className="space-y-5 text-xs text-slate-300">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#171923] p-4 rounded-xl border border-[#2D3748]">
            <div className="space-y-1">
              <span className="text-[11px] uppercase font-bold text-[#A0AEC0] flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#4FD1C5]" /> Parties
              </span>
              <p className="text-slate-200">
                <strong>Claimant:</strong> {meta.parties?.claimantAppellant || 'N/A'}
              </p>
              <p className="text-slate-200">
                <strong>Defendant:</strong> {meta.parties?.defendantRespondent || 'N/A'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] uppercase font-bold text-[#A0AEC0] flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-[#4FD1C5]" /> Judicial Bench
              </span>
              <p className="text-slate-300">
                {meta.judges?.length ? meta.judges.join(', ') : 'Not explicitly listed in header'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] uppercase font-bold text-[#A0AEC0] flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#4FD1C5]" /> Legal Domains
              </span>
              <div className="flex flex-wrap gap-1">
                {meta.legalDomains?.map((d) => (
                  <Badge key={d} colorScheme="teal" variant="subtle" className="text-[10px]">
                    {d}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Statutes Cited */}
          {meta.statutesCited && meta.statutesCited.length > 0 && (
            <div className="p-3 bg-[#171923] rounded-lg border border-[#2D3748]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0] block mb-2">
                Statutes Cited in Authority:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {meta.statutesCited.map((st) => (
                  <Badge key={st} colorScheme="gray" variant="subtle">
                    {st}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Chunks List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#4FD1C5]" />
                Indexed Chunks & Paragraph Anchors ({chunks.length})
              </h4>
              <Badge colorScheme="cyan" variant="subtle">
                1024-dim BGE-M3 Dense
              </Badge>
            </div>

            {loading ? (
              <div className="p-8 text-center text-[#A0AEC0] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#4FD1C5]" />
                Loading indexed chunks...
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-2">
                {chunks.map((chunk, i) => (
                  <div
                    key={chunk._id || i}
                    className="p-3 bg-[#171923] border border-[#2D3748] rounded-lg space-y-1.5 hover:border-[#4FD1C5]/50 transition"
                  >
                    <div className="flex items-center justify-between text-xs text-[#A0AEC0] pb-1 border-b border-[#2D3748]/50">
                      <span className="font-mono text-[#4FD1C5] font-bold">
                        Chunk #{chunk.chunkIndex + 1}
                      </span>
                      <Badge colorScheme="teal" variant="subtle" className="text-[10px]">
                        {chunk.paragraphNumbers?.length
                          ? `Paragraphs: [${chunk.paragraphNumbers.join(', ')}]`
                          : 'General Section'}
                      </Badge>
                      <span className="text-[#718096] text-[11px]">
                        {chunk.tokenCount} tokens
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </ModalBody>

        <ModalFooter>
          <div className="flex items-center justify-between w-full">
            <a
              href={document?._id ? getDocumentDownloadUrl(document._id) : '#'}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#319795] hover:bg-[#2C7A7B] text-white text-xs font-semibold rounded-md shadow-sm transition active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </a>

            <Button colorScheme="gray" variant="solid" size="sm" onClick={onClose}>
              Close Inspector
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
