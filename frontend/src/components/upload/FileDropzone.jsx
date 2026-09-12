import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2, PlayCircle, ShieldCheck, Lock, Globe, Link2 } from 'lucide-react';
import { uploadDocument, uploadDocumentFromUrl } from '../../services/documentService';
import RejectionNoticeModal from './RejectionNoticeModal';
import { Card, CardHeader, CardBody } from '../chakra/Card';
import { Button } from '../chakra/Button';
import { Badge } from '../chakra/Badge';
import { Alert, AlertIcon, AlertDescription } from '../chakra/Alert';

const INGESTION_STAGES = [
  '1. File Integrity & Format Inspection',
  '2. Document Refresh & Duplicate Check',
  '3. Structured Layout & Text Extraction',
  '4. UK Legal Relevance & Classification',
  '5. Jurisdiction Verification & Authority Check',
  '6. Neutral Citation & Metadata Extraction',
  '7. Structure-Aware Legal Chunking',
  '8. BGE-M3 Dense 1024-dim Embedding',
  '9. Qdrant Vector & MongoDB Indexing'
];

export default function FileDropzone({ onUploadSuccess, currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [rejectionData, setRejectionData] = useState(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'url'
  const [onlineUrl, setOnlineUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const fileInputRef = useRef(null);

  const handleUrlSubmit = async (targetUrl = onlineUrl) => {
    const finalUrl = (targetUrl || '').trim();
    if (!finalUrl || isProcessing) return;
    setRejectionData(null);
    setUploadSuccessMsg(null);
    setIsProcessing(true);
    setCurrentStageIndex(0);

    const stageInterval = setInterval(() => {
      setCurrentStageIndex((prev) => (prev < 8 ? prev + 1 : prev));
    }, 280);

    try {
      const response = await uploadDocumentFromUrl(finalUrl, customName.trim() || undefined);
      clearInterval(stageInterval);
      setCurrentStageIndex(8);
      setTimeout(() => {
        setIsProcessing(false);
        const title = response.data.document?.legalMetadata?.title || response.meta?.title || 'Online Legal Authority';
        setUploadSuccessMsg(`Indexed online authority: ${title}`);
        setOnlineUrl('');
        setCustomName('');
        if (onUploadSuccess) onUploadSuccess();
      }, 500);
    } catch (err) {
      clearInterval(stageInterval);
      setIsProcessing(false);
      setRejectionData(err);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    setRejectionData(null);
    setUploadSuccessMsg(null);
    setIsProcessing(true);
    setCurrentStageIndex(0);

    const stageInterval = setInterval(() => {
      setCurrentStageIndex((prev) => (prev < 8 ? prev + 1 : prev));
    }, 280);

    try {
      const response = await uploadDocument(file);
      clearInterval(stageInterval);
      setCurrentStageIndex(8);
      setTimeout(() => {
        setIsProcessing(false);
        setUploadSuccessMsg(`Indexed authority: ${response.data.document?.legalMetadata?.title || file.name}`);
        if (onUploadSuccess) onUploadSuccess();
      }, 500);
    } catch (err) {
      clearInterval(stageInterval);
      setIsProcessing(false);
      setRejectionData(err);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleTestFixture = (type) => {
    let filename = 'test.txt';
    let content = '';

    if (type === 'valid_uk') {
      filename = 'Donoghue_v_Stevenson_1932_AC_562.txt';
      content = `IN THE HOUSE OF LORDS (UK JURISDICTION)
Neutral Citation Number: [1932] UKHL 100
Also reported at: [1932] AC 562

BETWEEN:
Donoghue (Pauper)
Appellant
-v-
Stevenson
Respondent

Before: Lord Buckmaster, Lord Atkin, Lord Tomlin, Lord Thankerton, Lord Macmillan
Date: 26 May 1932

JUDGMENT

LORD ATKIN:
[1] My Lords, the question of law in this appeal is whether the manufacturer of an article of drink sold by him to a distributor is under any legal duty to the ultimate purchaser or consumer to take reasonable care that the article is free from defect injurious to health.

[44] The rule that you are to love your neighbour becomes in law, you must not injure your neighbour; and the lawyer's question, Who is my neighbour? receives a restricted reply. You must take reasonable care to avoid acts or omissions which you can reasonably foresee would be likely to injure your neighbour.

[45] Who, then, in law is my neighbour? The answer seems to be - persons who are so closely and directly affected by my act that I ought reasonably to have them in contemplation as being so affected when I am directing my mind to the acts or omissions which are called in question.

[46] A manufacturer owes a duty to the consumer to take that reasonable care. Appeal allowed.`;
    } else if (type === 'uk_statute') {
      filename = 'Human_Rights_Act_1998.txt';
      content = `Human Rights Act 1998
1998 CHAPTER 42

An Act to give further effect to rights and freedoms guaranteed under the European Convention on Human Rights; to make provision with respect to holders of certain judicial offices who become judges of the European Court of Human Rights; and for connected purposes.
[9th November 1998]

Be it enacted by the Queen's most Excellent Majesty, by and with the advice and consent of the Lords Spiritual and Temporal, and Commons, in this present Parliament assembled, and by the authority of the same, as follows:—

Section 1: The Convention Rights
(1) In this Act “the Convention rights” means the rights and fundamental freedoms set out in—
(a) Articles 2 to 12 and 14 of the Convention,
(b) Articles 1 to 3 of the First Protocol, and
(c) Article 1 of the Thirteenth Protocol, as read with Articles 16 to 18 of the Convention.

Section 3: Interpretation of legislation
(1) So far as it is possible to do so, primary legislation and subordinate legislation must be read and given effect in a way which is compatible with the Convention rights.

Section 6: Acts of public authorities
(1) It is unlawful for a public authority to act in a way which is incompatible with a Convention right.`;
    } else if (type === 'uk_contract') {
      filename = 'Commercial_Services_Agreement_English_Law.txt';
      content = `COMMERCIAL SERVICES AGREEMENT

THIS AGREEMENT is made on 15 January 2024
BETWEEN:
(1) MERIDIAN LOGISTICS LIMITED (Company No. 04829102), whose registered office is at 100 Bishopsgate, London EC2N 4AG ("Service Provider"); and
(2) CAMDEN RETAIL GROUP PLC (Company No. 01928374), whose registered office is at High Street, Camden, London NW1 8QL ("Client").

WHEREAS:
(A) The Service Provider provides supply chain and fulfillment management services.
(B) The Client desires to retain the Service Provider in accordance with English law.

NOW IT IS HEREBY AGREED as follows:
Clause 1: Obligations of the Parties
1.1 The Service Provider shall perform the services with reasonable care and skill pursuant to the Supply of Goods and Services Act 1982.
1.2 The Client shall remit payment within thirty (30) days of invoice submission.

Clause 14: Indemnity and Limitation of Liability
14.1 Neither party excludes liability for death or personal injury caused by negligence or fraud pursuant to the Unfair Contract Terms Act 1977.

Clause 22: Governing Law and Jurisdiction
22.1 This Agreement and any dispute or claim arising out of or in connection with it shall be governed by and construed in accordance with the laws of England and Wales.
22.2 Each party irrevocably submits to the exclusive jurisdiction of the High Court of England and Wales.`;
    } else if (type === 'uk_tenancy') {
      filename = 'Assured_Shorthold_Tenancy_Agreement.txt';
      content = `ASSURED SHORTHOLD TENANCY AGREEMENT
Under Part 1 of the Housing Act 1988 as amended by the Housing Act 1996

PARTICULARS:
Date of Agreement: 1 February 2024
Landlord: Kensington Residential Estates Limited, London
Tenant: Oliver James Bennett

Premises: Flat 4, 18 Queens Gate, London SW7 5EX
Term: A fixed term of 12 months commencing 1 March 2024
Rent: £2,400.00 per calendar month payable in advance

STATUTORY PROVISIONS:
1. The Tenancy created by this Agreement is an Assured Shorthold Tenancy within the meaning of the Housing Act 1988.
2. The Landlord agrees to comply with the Landlord and Tenant Act 1985 regarding repairing obligations.
3. The Deposit shall be protected within a government-approved tenancy deposit scheme pursuant to the Housing Act 2004.
4. Jurisdiction: This Tenancy Agreement is governed by the laws of England and Wales.`;
    } else if (type === 'legal_opinion') {
      filename = 'Counsel_Opinion_Commercial_Injunction.txt';
      content = `IN THE MATTER OF AN INTENDED ARBITRATION
AND IN THE MATTER OF ENGLISH ARBITRATION ACT 1996

ADVICE & OPINION OF COUNSEL

1. I am instructed by Messrs Sterling & Partners, Solicitors, on behalf of the Claimant, to advise on the prospects of obtaining an interim injunction pursuant to section 44 of the Arbitration Act 1996 and CPR Part 25.

2. The substantive dispute arises under a charterparty agreement governed by English law. The Respondent has threatened to dissipate maritime assets situated within the jurisdiction of England and Wales.

3. Under the established principles of American Cyanamid Co v Ethicon Ltd [1975] AC 396, the court requires:
(i) A serious issue to be tried;
(ii) That damages would not be an adequate remedy;
(iii) That the balance of convenience favours granting relief.

4. In my opinion, the High Court of Justice (Commercial Court) possesses clear jurisdiction to grant interim preservative relief to safeguard the arbitral proceedings.

Dated: 18 April 2024
Temple, London EC4Y 7BB`;
    }

    const blob = new Blob([content], { type: filename.endsWith('.pdf') ? 'application/pdf' : 'text/plain' });
    const file = new File([blob], filename, { type: filename.endsWith('.pdf') ? 'application/pdf' : 'text/plain' });
    handleFileSelect(file);
  };

  if (!isAdmin) {
    return (
      <Card variant="outline" className="text-left border-[#4A5568] bg-gradient-to-r from-[#1A202C] to-[#2D3748]/60">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#2D3748] border border-[#4A5568] flex items-center justify-center shrink-0 shadow-md">
                <Lock className="w-5 h-5 text-[#FEB2B2]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Document Ingestion & RAG Data (Admin Only)</h3>
                  <Badge colorScheme="red" variant="subtle">Upload Restricted</Badge>
                </div>
                <p className="text-xs text-[#A0AEC0] leading-relaxed max-w-2xl">
                  You are viewing the platform as a <strong className="text-slate-200">Legal Researcher (User)</strong>. Standard users can query indexed authorities in the Legal Research Chat. Uploading and indexing new document data for RAG requires <strong className="text-[#B794F4]">Administrator</strong> privileges (login with <span className="font-mono text-white">admin123@gmail.com</span>).
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card variant="outline" className="text-left">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#4FD1C5]" />
              UK Legal Document Ingestion & RAG Gateway
            </h2>
            <p className="text-xs text-[#A0AEC0] mt-0.5">
              Upload any documents related to the UK (judgments, statutes, commercial agreements, regulatory policies, and reports).
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge colorScheme="teal">PDF</Badge>
            <Badge colorScheme="blue">DOCX</Badge>
            <Badge colorScheme="purple">TXT</Badge>
            <span className="text-[11px] text-[#718096] ml-1">Max 25MB</span>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-5">
        {/* Ingestion Mode Toggle */}
        <div className="flex items-center gap-2 border-b border-[#2D3748] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'file'
                ? 'bg-[#0E2328] border border-[#244E52] text-[#2DD4BF]'
                : 'text-[#718096] hover:text-white hover:bg-[#1A202C]'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Local File</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'url'
                ? 'bg-[#0E2328] border border-[#244E52] text-[#2DD4BF]'
                : 'text-[#718096] hover:text-white hover:bg-[#1A202C]'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Import from Online URL</span>
            <Badge colorScheme="teal" variant="subtle" className="text-[10px]">WEB RAG</Badge>
          </button>
        </div>

        {activeTab === 'file' ? (
          /* Drag & Drop Box styled with Chakra focus aesthetics */
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-[#319795] bg-[#319795]/10 scale-[0.99]'
                : 'border-[#2D3748] hover:border-[#4FD1C5]/60 bg-[#171923]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files[0])}
              accept=".pdf,.docx,.txt"
              className="hidden"
            />

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#1A202C] border border-[#2D3748] flex items-center justify-center text-[#4FD1C5] mb-3 shadow-inner">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Drag & drop UK documents or click to browse
              </p>
              <p className="text-xs text-[#718096] mt-1">
                Accepts any documents related to the UK: judgments, statutes, contracts, regulatory policies, and reports.
              </p>
            </div>
          </div>
        ) : (
          /* Online URL Ingestion Panel */
          <div className="p-6 bg-[#171923] border border-[#2D3748] rounded-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0E1F24] border border-[#1A3B3E] flex items-center justify-center text-[#2DD4BF] shrink-0 shadow-md">
                <Link2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Fetch UK Authority Directly from the Web</h3>
                <p className="text-xs text-[#A0AEC0] leading-relaxed">
                  Enter a public URL to an authentic UK judgment or statute (PDF, DOCX, or TXT). The system downloads the authority and streams it through the 9-stage validation, chunking, and BGE-M3 vector embedding pipeline.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#A0AEC0] mb-1.5">
                  Legal Document URL (e.g. The National Archives / Legislation.gov.uk)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={onlineUrl}
                    onChange={(e) => setOnlineUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleUrlSubmit();
                      }
                    }}
                    placeholder="https://caselaw.nationalarchives.gov.uk/uksc/2023/24/data.pdf"
                    disabled={isProcessing}
                    className="flex-1 bg-[#101726] border border-[#2D3748] focus:border-[#2DD4BF] text-sm text-white px-3.5 py-2.5 rounded-xl outline-none transition"
                  />
                  <Button
                    colorScheme="teal"
                    onClick={() => handleUrlSubmit()}
                    disabled={!onlineUrl.trim() || isProcessing}
                    isLoading={isProcessing}
                    leftIcon={<UploadCloud className="w-4 h-4" />}
                  >
                    Fetch & Ingest
                  </Button>
                </div>
              </div>

              {/* Quick Preset Online UK Authorities */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-2">
                  Featured Online UK Supreme Court Authorities (The National Archives):
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      name: 'Officer W80 [2023] UKSC 24 (Police Conduct & Tort)',
                      url: 'https://caselaw.nationalarchives.gov.uk/uksc/2023/24/data.pdf'
                    },
                    {
                      name: 'Barton v Morris [2023] UKSC 1 (Contract & Unjust Enrichment)',
                      url: 'https://caselaw.nationalarchives.gov.uk/uksc/2023/1/data.pdf'
                    },
                    {
                      name: 'SkyKick UK [2023] UKSC 42 (IP & Trademarks)',
                      url: 'https://caselaw.nationalarchives.gov.uk/uksc/2023/42/data.pdf'
                    }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        setOnlineUrl(preset.url);
                        handleUrlSubmit(preset.url);
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-[#1A202C] hover:bg-[#2D3748] border border-[#2D3748] hover:border-[#2DD4BF]/50 text-[#CBD5E0] hover:text-white transition flex items-center gap-1.5"
                    >
                      <Globe className="w-3 h-3 text-[#2DD4BF]" />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-Time 9-Stage Ingestion Tracker */}
        {isProcessing && (
          <div className="p-4 bg-[#171923] rounded-xl border border-[#2D3748] space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4FD1C5] flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Active Ingestion Pipeline (Stage {currentStageIndex + 1}/9)
              </span>
              <Badge colorScheme="teal" variant="solid">
                {Math.round(((currentStageIndex + 1) / 9) * 100)}%
              </Badge>
            </div>

            {/* Chakra Progress Bar */}
            <div className="w-full bg-[#2D3748] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#319795] h-full transition-all duration-300 rounded-full"
                style={{ width: `${((currentStageIndex + 1) / 9) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {INGESTION_STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                return (
                  <div
                    key={stage}
                    className={`p-2 rounded-md border text-[11px] transition ${
                      isCompleted
                        ? 'border-[#38A169]/40 bg-[#38A169]/10 text-[#9AE6B4]'
                        : isCurrent
                        ? 'border-[#319795] bg-[#319795]/20 text-[#4FD1C5] font-semibold'
                        : 'border-[#2D3748]/60 bg-[#1A202C]/60 text-[#718096]'
                    } flex items-center space-x-2`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#48BB78] flex-shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#4FD1C5] animate-spin flex-shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-[#4A5568] inline-block flex-shrink-0" />
                    )}
                    <span className="truncate">{stage}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Success Alert */}
        {uploadSuccessMsg && (
          <Alert status="success" variant="subtle">
            <AlertIcon status="success" />
            <div className="flex-1">
              <AlertDescription>{uploadSuccessMsg}</AlertDescription>
            </div>
            <button onClick={() => setUploadSuccessMsg(null)} className="text-[#9AE6B4] hover:text-white text-xs">
              ✕
            </button>
          </Alert>
        )}

        {/* UK Legal Fixture Quick Ingestion Matrix */}
        <div className="pt-3 border-t border-[#2D3748]/60">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A0AEC0] flex items-center gap-1.5 mb-3">
            <PlayCircle className="w-4 h-4 text-[#4FD1C5]" />
            Quick Test & Sample UK Legal Ingestion Fixtures:
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              colorScheme="teal"
              variant="subtle"
              onClick={() => handleTestFixture('valid_uk')}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              UK Landmark (*Donoghue v Stevenson*)
            </Button>

            <Button
              size="sm"
              colorScheme="blue"
              variant="subtle"
              onClick={() => handleTestFixture('uk_statute')}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              UK Statute (*Human Rights Act 1998*)
            </Button>

            <Button
              size="sm"
              colorScheme="purple"
              variant="subtle"
              onClick={() => handleTestFixture('uk_contract')}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              English Law Commercial Contract
            </Button>

            <Button
              size="sm"
              colorScheme="cyan"
              variant="subtle"
              onClick={() => handleTestFixture('uk_tenancy')}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              UK Assured Tenancy Agreement
            </Button>

            <Button
              size="sm"
              colorScheme="gray"
              variant="subtle"
              onClick={() => handleTestFixture('legal_opinion')}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              UK Counsel Legal Opinion
            </Button>
          </div>
        </div>

      </CardBody>

      {/* Rejection Notice Modal */}
      <RejectionNoticeModal
        isOpen={Boolean(rejectionData)}
        onClose={() => setRejectionData(null)}
        errorData={rejectionData}
      />
    </Card>
  );
}
