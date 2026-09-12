import React, { useState } from 'react';
import { Search, Trash2, Eye, Scale, FileText, Download, BookOpen, Info } from 'lucide-react';
import DocumentDetailModal from './DocumentDetailModal';
import DocumentViewerModal from './DocumentViewerModal';
import { getDocumentDownloadUrl } from '../../services/documentService';
import { Card, CardHeader, CardBody } from '../chakra/Card';
import { Badge } from '../chakra/Badge';
import { Input, Select } from '../chakra/Input';
import { Button } from '../chakra/Button';

export default function DocumentTable({ documents, onDelete, onRefresh, currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewerDoc, setViewerDoc] = useState(null);

  const filteredDocs = documents.filter((doc) => {
    const meta = doc.legalMetadata || {};
    const matchesSearch =
      !searchTerm ||
      meta.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meta.neutralCitation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.originalName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesJurisdiction =
      !selectedJurisdiction || meta.jurisdiction === selectedJurisdiction;

    return matchesSearch && matchesJurisdiction;
  });

  return (
    <Card variant="outline" className="text-left">
      {/* Table Header Controls */}
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#4FD1C5]" />
                Indexed UK Legal Vault ({filteredDocs.length} Authorities)
              </h3>
              {isAdmin ? (
                <Badge colorScheme="purple" variant="solid" className="text-[10px]">
                  Admin Manage Mode
                </Badge>
              ) : (
                <Badge colorScheme="teal" variant="subtle" className="text-[10px]">
                  Viewer Mode (Read & Download)
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#A0AEC0] mt-0.5">
              Authoritative decisions and statutes. View full text in-browser or download files directly.
            </p>
          </div>

          {/* Filter inputs styled as Chakra Input and Select */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#718096]" />
              <Input
                size="sm"
                type="text"
                placeholder="Search title, citation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select
              size="sm"
              value={selectedJurisdiction}
              onChange={(e) => setSelectedJurisdiction(e.target.value)}
            >
              <option value="">All Jurisdictions</option>
              <option value="England & Wales">England & Wales</option>
              <option value="Scotland">Scotland</option>
              <option value="Northern Ireland">Northern Ireland</option>
              <option value="UK Wide">UK Wide</option>
            </Select>
          </div>
        </div>
      </CardHeader>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-200">
          <thead className="bg-[#171923] uppercase text-[11px] text-[#A0AEC0] border-b border-[#2D3748] tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3.5">Legal Authority</th>
              <th className="px-4 py-3.5">Citation</th>
              <th className="px-4 py-3.5">Court / Tier</th>
              <th className="px-4 py-3.5">Jurisdiction</th>
              <th className="px-4 py-3.5 text-center">Chunks</th>
              <th className="px-4 py-3.5">Indexed Date</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2D3748]/50">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-[#718096] text-xs">
                  No indexed legal documents found matching filter. Upload a judgment above to index it.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => {
                const meta = doc.legalMetadata || {};
                const downloadUrl = getDocumentDownloadUrl(doc._id);

                return (
                  <tr key={doc._id} className="hover:bg-[#2D3748]/30 transition">
                    <td className="px-5 py-3.5 max-w-xs truncate">
                      <div className="font-semibold text-white truncate cursor-pointer hover:text-[#4FD1C5] transition" onClick={() => setViewerDoc(doc)} title="Click to Read Document">
                        {meta.title}
                      </div>
                      <div className="text-[11px] text-[#718096] truncate font-mono">
                        {doc.originalName}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {meta.neutralCitation ? (
                        <Badge colorScheme="teal" variant="subtle">
                          {meta.neutralCitation}
                        </Badge>
                      ) : (
                        <Badge colorScheme="gray" variant="subtle">Statute</Badge>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="text-slate-200 font-medium">{meta.court}</div>
                      <div className="text-[10px] text-[#718096]">Tier {meta.courtTier || 4} Court</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge colorScheme="purple" variant="subtle">
                        {meta.jurisdiction || 'UK Wide'}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono text-slate-300">
                      {doc.stats?.chunkCount || 1}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-[#A0AEC0] text-[11px]">
                      {new Date(doc.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1.5">
                      {/* Read / View Document Button */}
                      <Button
                        size="xs"
                        variant="solid"
                        colorScheme="teal"
                        onClick={() => setViewerDoc(doc)}
                        title="Read Full Judgment Text"
                        leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                      >
                        Read
                      </Button>

                      {/* Download Button */}
                      <a
                        href={downloadUrl}
                        download
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[#2D3748] hover:bg-[#4A5568] text-[#90CDF4] transition active:scale-[0.98]"
                        title="Download Authority File"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>

                      {/* Chunks / Metadata Inspector */}
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="gray"
                        onClick={() => setSelectedDoc(doc)}
                        title="Inspect Chunks and Metadata"
                      >
                        <Info className="w-3.5 h-3.5 text-[#A0AEC0]" />
                      </Button>

                      {/* Delete Button (Admin Only) */}
                      {isAdmin && (
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => onDelete(doc._id)}
                          title="Delete from Mongo & Qdrant (Admin Only)"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#FEB2B2]" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Metadata Detail Inspector Modal */}
      <DocumentDetailModal
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
      />

      {/* Full Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(viewerDoc)}
        onClose={() => setViewerDoc(null)}
        documentId={viewerDoc?._id}
        initialTitle={viewerDoc?.legalMetadata?.title || viewerDoc?.originalName}
      />
    </Card>
  );
}
