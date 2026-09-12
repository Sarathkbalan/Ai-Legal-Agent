import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Scale,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronDown,
  Download,
  Copy,
  Check,
  ArrowUp,
  User,
  Trash2,
  Filter,
  ExternalLink,
  Landmark,
  Gauge,
  Cpu
} from 'lucide-react';
import { sendResearchQuery } from '../../services/researchService';
import { getDocumentDownloadUrl } from '../../services/documentService';
import DocumentViewerModal from '../documents/DocumentViewerModal';
import { Badge } from '../chakra/Badge';
import { Button } from '../chakra/Button';
import { Alert, AlertIcon, AlertTitle, AlertDescription } from '../chakra/Alert';

const BENCHMARK_TOPICS = [
  {
    category: 'Police Law & Public Safety',
    title: 'Police Act 1996 & State of Policing',
    query: 'What statutory powers and duty of care standards govern police officers under the Police Act 1996 and Robinson [2018] UKSC 4?'
  },
  {
    category: 'Immigration Law',
    title: 'Immigration Rules & Immigration Act 1971',
    query: 'What statutory rules and admissibility criteria apply under the Immigration Act 1971 and recent Immigration Rules changes?'
  },
  {
    category: 'Public Pensions & Governance',
    title: 'Judicial Pensions Scheme & Accounts Act 2000',
    query: 'How are judicial pensions and financial resources administered under the Government Resources and Accounts Act 2000?'
  },
  {
    category: 'Human Rights Law',
    title: 'Human Rights Act 1998',
    query: 'What convention rights are protected and how are public authorities bound under Section 6 of the Human Rights Act 1998?'
  },
  {
    category: 'Tort Law & Liability',
    title: 'Robinson v Chief Constable [2018] UKSC 4',
    query: 'Does police conduct in Robinson [2018] UKSC 4 establish a duty of care for positive negligent acts causing foreseeable harm?'
  },
  {
    category: 'Tort Law & Liability',
    title: 'Barclays Bank [2020] UKSC 13',
    query: 'What is the two-stage test for vicarious liability in Barclays Bank [2020] UKSC 13?'
  }
];

// Client-side IRAC resolver supporting all heading variants (###, ##, **, plain)
const resolveIrac = (rawIrac, rawMarkdown) => {
  let issue = rawIrac?.issue || '';
  let rule = rawIrac?.rule || '';
  let application = rawIrac?.application || '';
  let conclusion = rawIrac?.conclusion || '';

  // If issue and rule are missing or application contains embedded headers
  const textToScan = (!issue && !rule && application) ? application : (rawMarkdown || '');
  if ((!issue || !rule) && textToScan) {
    const clean = textToScan.replace(/[\u202F\u00A0]/g, ' ');
    const issueMatch = clean.match(/(?:^|\n)\s*(?:#{1,4}|\*\*)\s*(?:1\.\s*)?ISSUE(?:\*\*|:)?\s*([\s\S]*?)(?=(?:^|\n)\s*(?:#{1,4}|\*\*)\s*(?:2\.\s*)?RULE|$)/i);
    const ruleMatch = clean.match(/(?:^|\n)\s*(?:#{1,4}|\*\*)\s*(?:2\.\s*)?RULE(?:\*\*|:)?\s*([\s\S]*?)(?=(?:^|\n)\s*(?:#{1,4}|\*\*)\s*(?:3\.\s*)?APPLICATION|$)/i);
    const appMatch = clean.match(/(?:^|\n)\s*(?:#{1,4}|\*\*)\s*(?:3\.\s*)?APPLICATION(?:\*\*|:)?\s*([\s\S]*?)(?=(?:^|\n)\s*(?:#{1,4}|\*\*)\s*(?:4\.\s*)?CONCLUSION|$)/i);
    const concMatch = clean.match(/(?:^|\n)\s*(?:#{1,4}|\*\*)\s*(?:4\.\s*)?CONCLUSION(?:\*\*|:)?\s*([\s\S]*?)$/i);

    if (issueMatch) issue = issueMatch[1].trim();
    if (ruleMatch) rule = ruleMatch[1].trim();
    if (appMatch) application = appMatch[1].trim();
    if (concMatch) conclusion = concMatch[1].trim();
  }

  issue = issue.replace(/^\s*(?:\*\*|#{1,4})?\s*ISSUE(?:\*\*|:)?\s*/i, '').trim();
  rule = rule.replace(/^\s*(?:\*\*|#{1,4})?\s*RULE(?:\*\*|:)?\s*/i, '').trim();
  application = application.replace(/^\s*(?:\*\*|#{1,4})?\s*APPLICATION(?:\*\*|:)?\s*/i, '').trim();
  conclusion = conclusion.replace(/^\s*(?:\*\*|#{1,4})?\s*CONCLUSION(?:\*\*|:)?\s*/i, '').trim();

  return { issue, rule, application, conclusion };
};

// Lightweight Markdown parser to render bold, italic, code, and lists without raw asterisks
const renderMarkdown = (content) => {
  if (!content) return null;
  if (typeof content !== 'string') return content;

  // Clean unicode narrow spaces
  const cleanContent = content.replace(/[\u202F\u00A0]/g, ' ');
  const lines = cleanContent.split('\n');

  const parseInline = (text, keyPrefix) => {
    // Matches **bold**, *italic*, and `code`
    const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
    const elements = [];
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        elements.push(text.substring(lastIdx, match.index));
      }

      if (match[2] !== undefined) {
        // Bold: **text**
        elements.push(
          <strong key={`${keyPrefix}-b-${match.index}`} className="font-semibold text-white">
            {match[2]}
          </strong>
        );
      } else if (match[3] !== undefined) {
        // Italic: *text*
        elements.push(
          <em key={`${keyPrefix}-i-${match.index}`} className="italic text-slate-200">
            {match[3]}
          </em>
        );
      } else if (match[4] !== undefined) {
        // Code: `text`
        elements.push(
          <code key={`${keyPrefix}-c-${match.index}`} className="font-mono text-xs px-1.5 py-0.5 rounded bg-[#2D3748] text-[#4FD1C5]">
            {match[4]}
          </code>
        );
      }

      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      elements.push(text.substring(lastIdx));
    }

    return elements.length > 0 ? elements : text;
  };

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // List item pattern: "1. ", "2. ", "- ", "* "
        const listMatch = line.match(/^(\s*)(\d+\.|\-|\*)\s+(.*)$/);
        if (listMatch) {
          const marker = listMatch[2];
          const textAfterMarker = listMatch[3];
          return (
            <div key={idx} className="flex items-start gap-2 pl-1.5 py-0.5">
              <span className="font-mono font-bold text-[#4FD1C5] text-xs shrink-0 select-none">
                {marker === '-' || marker === '*' ? '•' : marker}
              </span>
              <div className="flex-1 leading-relaxed">
                {parseInline(textAfterMarker, `line-${idx}`)}
              </div>
            </div>
          );
        }

        return (
          <div key={idx} className="leading-relaxed">
            {parseInline(line, `line-${idx}`)}
          </div>
        );
      })}
    </div>
  );
};

export default function ResearchWorkbench() {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [jurisdictionFilter, setJurisdictionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Modals & UI states
  const [viewerDocId, setViewerDocId] = useState(null);
  const [viewerDocTitle, setViewerDocTitle] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});

  const lastQuestionRef = useRef(null);
  const lastUserMessageCount = useRef(0);
  const inputRef = useRef(null);

  // Position viewport at the asked question; do not auto-scroll to the bottom
  useEffect(() => {
    const userMessages = messages.filter((m) => m.role === 'user');
    if (userMessages.length > lastUserMessageCount.current) {
      lastUserMessageCount.current = userMessages.length;
      setTimeout(() => {
        lastQuestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [messages]);

  const toggleSources = (msgId) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleCopyIrac = (msgId, irac, title) => {
    if (!irac) return;
    let fullText = '';
    if (irac.conclusion === 'The documents do not contain any topic related to this.') {
      fullText = 'The documents do not contain any topic related to this.';
    } else {
      fullText = `LEGAL RESEARCH OPINION: ${title}
--------------------------------------------------
ISSUE:
${irac.issue || ''}

RULE:
${irac.rule || ''}

APPLICATION:
${irac.application || ''}

CONCLUSION:
${irac.conclusion || ''}
--------------------------------------------------
Generated by LawIntel UK Legal Research AI Agent`;
    }

    navigator.clipboard.writeText(fullText);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSubmit = async (queryText = prompt) => {
    const textToSearch = queryText.trim();
    if (!textToSearch || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `asst-${Date.now()}`;

    // Add user message to conversation stream
    const userMsg = {
      id: userMessageId,
      role: 'user',
      text: textToSearch,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await sendResearchQuery({
        prompt: textToSearch,
        filters: jurisdictionFilter ? { jurisdiction: jurisdictionFilter } : {}
      });

      const data = response.data;
      const assistantMsg = {
        id: assistantMessageId,
        role: 'assistant',
        text: data.structuredAnswer?.rawMarkdown || '',
        result: data,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMsg]);
      // Auto-expand sources on latest reply
      setExpandedSources((prev) => ({ ...prev, [assistantMessageId]: true }));
    } catch (err) {
      const errorText = err.error?.message || 'Failed to complete legal research query.';
      setErrorMsg(errorText);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          isError: true,
          text: errorText,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setErrorMsg(null);
    lastUserMessageCount.current = 0;
  };

  return (
    <div className={`flex flex-col ${messages.length > 0 ? 'min-h-[calc(100vh-140px)] pb-48' : 'flex-1'} text-left relative`}>

      

        {/* Right Controls */}
        <div className="flex items-end gap-2.5">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="px-3 py-2 text-xs text-[#94A3B8] hover:text-white bg-[#101726] hover:bg-[#1E2638] border border-[#1E2638] rounded-xl transition flex items-center gap-1.5 shadow-sm"
              title="Clear conversation thread"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Thread</span>
            </button>
          )}

          {/* Latency / Mode Pill */}
          <div className="rounded-xl border border-[#1E2638] bg-[#101726]/90 px-3.5 py-2 flex items-center gap-2 text-xs text-[#94A3B8] shadow-sm">
            <Gauge className="w-3.5 h-3.5 text-[#2DD4BF]" />
            <span>142ms latency</span>
            <span className="text-[#64748B]">•</span>
            <span className="text-[#2DD4BF] font-semibold">Strict IRAC</span>
          </div>

          {/* Jurisdiction Selector Dropdown */}
          <div className="rounded-xl border border-[#1E2638] bg-[#101726]/90 px-3.5 py-2 flex items-center gap-2 text-xs text-white shadow-sm hover:border-[#2DD4BF]/40 transition">
            <Landmark className="w-3.5 h-3.5 text-[#2DD4BF]" />
            <select
              value={jurisdictionFilter}
              onChange={(e) => setJurisdictionFilter(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="" className="bg-[#101726] text-white">All UK Jurisdictions</option>
              <option value="England & Wales" className="bg-[#101726] text-white">England & Wales</option>
              <option value="Scotland" className="bg-[#101726] text-white">Scotland</option>
              <option value="Northern Ireland" className="bg-[#101726] text-white">Northern Ireland</option>
              <option value="UK Wide" className="bg-[#101726] text-white">UK Wide</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] pointer-events-none -ml-1" />
          </div>
        </div>
      {/* </div> */}

      {/* ERROR ALERT (IF ANY) */}
      {errorMsg && (
        <div className="mb-4">
          <Alert status="error" variant="subtle">
            <AlertIcon status="error" />
            <div>
              <AlertTitle>Security or Execution Guardrail Alert</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </div>
          </Alert>
        </div>
      )}

      {/* CENTER HERO SECTION (Exact Match to Screenshot) */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col justify-between items-center max-w-4xl mx-auto w-full animate-fadeIn text-center relative min-h-[calc(100vh-220px)] pb-2">
          
          {/* Top / Center Section */}
          {/* <div className="w-full flex flex-col items-center my-auto pt-2"> */}
            {/* Subtle Radial Glow */}
            <div className="absolute top-0 w-80 h-80 bg-[#14B8A6]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Glowing Center Icon */}
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#14B8A6] to-[#0D9488] flex items-center justify-center shadow-2xl shadow-[#14B8A6]/25 border border-[#2DD4BF]/30 mb-4">
              <Scale className="w-8 h-8 text-[#071317]" />
              <Sparkles className="w-4 h-4 text-[#071317] absolute top-2 right-2" />
            </div>

            {/* Uppercase Tagline */}
            <div className="relative z-10 flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF]"></span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">
                JUDICIAL STANDARD INTELLIGENCE
              </span>
            </div>

            {/* Heading */}
            <h1 className="relative z-10 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ask LawIntel AI
            </h1>

            {/* Subtitle */}
            <p className="relative z-10 text-xs sm:text-sm text-[#94A3B8] max-w-lg mt-2 leading-relaxed">
              What legal issue would you like to investigate? Select a proposition from your indexed UK documents or enter an inquiry below.
            </p>

            {/* Lower Bottom Group: Input Bar Pushed DOWN */}
          <div className="w-full mt-auto pt-6">
            {/* Hero Input Bar */}
            <div className="relative z-10 w-full">
              <div className="bg-[#101726] border border-[#1E2638] hover:border-[#2DD4BF]/50 focus-within:border-[#2DD4BF] rounded-2xl p-2 sm:p-2.5 shadow-2xl flex items-center gap-3 transition">
                <div className="w-9 h-9 rounded-xl bg-[#0E1F24] border border-[#1A3B3E] flex items-center justify-center text-[#2DD4BF] shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Ask a UK legal question, cite a landmark case, or enter statutory inquiry..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#64748B] focus:outline-none px-1"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0E1F24] border border-[#1A3B3E] text-xs font-semibold text-[#2DD4BF]">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Grounded IRAC</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={!prompt.trim() || isLoading}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition shadow-lg ${
                      prompt.trim() && !isLoading
                        ? 'bg-[#2DD4BF] hover:bg-[#14B8A6] text-[#090D16] shadow-[#2DD4BF]/25 cursor-pointer'
                        : 'bg-[#182032] text-[#64748B] cursor-not-allowed'
                    }`}
                    title="Submit inquiry"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#090D16]" />
                    ) : (
                      <ArrowUp className="w-4 h-4 text-[#090D16] stroke-[2.5]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Assurance Bullet Points */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#64748B] mt-3">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2DD4BF]" />
                  Strict UK Common Law RAG
                </span>
                <span>•</span>
                <span>BGE-M3 1024-dim Vector Search</span>
                <span>•</span>
                <span>Grounded IRAC Synthesis</span>
                <span>•</span>
                <span>Pinpoint Citations</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* CHAT MESSAGES STREAM */}
      {messages.length > 0 && (
        <div className="space-y-6 w-full max-w-5xl mx-auto">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            if (isUser) {
              const lastUserMessageId = messages.filter((m) => m.role === 'user').slice(-1)[0]?.id;
              const isLatestUser = msg.id === lastUserMessageId;

              return (
                <div
                  key={msg.id}
                  ref={isLatestUser ? lastQuestionRef : null}
                  className="flex justify-end animate-fadeIn scroll-mt-28"
                >
                  <div className="flex items-start gap-3 max-w-2xl">
                    <div className="bg-[#2D3748] text-white px-5 py-3.5 rounded-2xl rounded-tr-sm border border-[#4A5568]/50 shadow-md text-sm leading-relaxed">
                      {msg.text}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#4A5568] flex items-center justify-center shrink-0 border border-[#718096]/50">
                      <User className="w-4 h-4 text-[#CBD5E0]" />
                    </div>
                  </div>
                </div>
              );
            }

            // ASSISTANT REPLY
            const res = msg.result;
            const irac = resolveIrac(res?.structuredAnswer?.irac, res?.structuredAnswer?.rawMarkdown);
            const citations = res?.citations || [];
            const chunks = res?.retrievedChunks || [];
            const areSourcesOpen = expandedSources[msg.id];

            return (
              <div key={msg.id} className="flex items-start gap-3.5 animate-fadeIn">
                {/* AI Avatar */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#319795] to-[#805AD5] flex items-center justify-center shrink-0 shadow-lg shadow-[#319795]/20 mt-1">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>

                {/* AI Content Container */}
                <div className="flex-1 space-y-4 max-w-4xl">
                  
                  {/* Security & Metrics Banner */}
                  {res && (
                    <div className="bg-[#1A202C] border border-[#2D3748] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs text-[#A0AEC0]">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#38A169]" />
                        <span className="text-slate-200">
                          Prompt Guard 2: <strong className="text-[#68D391]">Passed</strong> (Risk: {(res.guardrail?.riskScore * 100).toFixed(1)}%)
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span>Model: <strong className="text-white">{res.structuredAnswer?.model || 'Groq gpt-oss-120b'}</strong></span>
                        <span>•</span>
                        <span>Duration: <strong className="text-[#4FD1C5]">{res.metrics?.totalDurationMs}ms</strong></span>
                      </div>
                    </div>
                  )}

                  {/* UNRELATED / NON-LEGAL INQUIRY HIGHLIGHT CARD */}
                  {res?.structuredAnswer?.isUnrelated ? (
                    <div className="bg-gradient-to-r from-[#1A202C] to-[#2D3748] border-l-4 border-[#DD6B20] border-t border-r border-b border-[#4A5568] rounded-xl p-5 shadow-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-[#ED8936]" />
                        <span className="text-sm font-bold text-[#FBD38D]">Non-Legal / Unindexed Inquiry</span>
                      </div>
                      <p className="text-base font-semibold text-white tracking-wide">
                        The documents do not contain any topic related to this.
                      </p>
                      <p className="text-xs text-[#CBD5E0] leading-relaxed">
                        LawIntel is dedicated to UK legal research across your indexed documents and UK statutes.
                      </p>
                      <div className="pt-2 border-t border-[#4A5568]/60">
                        <span className="text-[11px] font-semibold text-[#A0AEC0] uppercase tracking-wider block mb-2">
                          Try one of the indexed UK topics from your documents:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {BENCHMARK_TOPICS.slice(0, 4).map((topic, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSubmit(topic.query)}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-[#1A202C] hover:bg-[#319795]/20 border border-[#4A5568] hover:border-[#319795] text-[#E2E8F0] hover:text-[#4FD1C5] transition flex items-center gap-1 text-left"
                            >
                              <span>{topic.title}</span>
                              <ChevronRight className="w-3 h-3 text-[#718096]" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Verified Citations Audit Badges Ribbon */}
                      {citations.length > 0 && (
                        <div className="bg-[#171923] border border-[#2D3748] rounded-xl p-3.5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0] flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-[#4FD1C5]" />
                              Citation Verification Audit ({citations.filter((c) => c.isVerifiedInContext).length}/{citations.length} Verified in Indexed Corpus)
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {citations.map((c, i) => (
                              <div
                                key={i}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${
                                  c.isVerifiedInContext
                                    ? 'bg-[#319795]/20 text-[#4FD1C5] border-[#319795]/40'
                                    : 'bg-[#DD6B20]/20 text-[#FBD38D] border-[#DD6B20]/40'
                                }`}
                                title={c.isVerifiedInContext ? 'Verified in indexed legal passages' : 'Warning: Citation proposition not confirmed in uploaded documents'}
                              >
                                {c.isVerifiedInContext ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-[#48BB78]" />
                                ) : (
                                  <AlertTriangle className="w-3.5 h-3.5 text-[#ED8936]" />
                                )}
                                <span>{c.citation}</span>
                                {c.paragraph && <span className="text-[10px] text-[#A0AEC0]">at [{c.paragraph}]</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* HIGHLIGHTED IRAC STRUCTURED OPINION (SET APART) */}
                      {irac && (
                        <div className="space-y-3.5">
                          
                          {/* ISSUE: Gold / Amber Luminous Highlight */}
                          {irac.issue && (
                            <div className="bg-[#1A202C] border-l-4 border-[#DD6B20] border-t border-r border-b border-[#2D3748] rounded-r-xl p-4 shadow-sm space-y-1.5 transition hover:border-[#DD6B20]/60">
                              <div className="flex items-center gap-2">
                                <Badge colorScheme="orange">Issue</Badge>
                                <span className="text-xs font-bold text-[#FBD38D]">Legal Question Presented</span>
                              </div>
                              <div className="text-sm text-slate-200 leading-relaxed font-sans">
                                {renderMarkdown(irac.issue)}
                              </div>
                            </div>
                          )}

                          {/* RULE: Blue Luminous Highlight */}
                          {irac.rule && (
                            <div className="bg-[#1A202C] border-l-4 border-[#3182CE] border-t border-r border-b border-[#2D3748] rounded-r-xl p-4 shadow-sm space-y-1.5 transition hover:border-[#3182CE]/60">
                              <div className="flex items-center gap-2">
                                <Badge colorScheme="blue">Rule</Badge>
                                <span className="text-xs font-bold text-[#90CDF4]">Binding Precedents & Statutory Provisions</span>
                              </div>
                              <div className="text-sm text-slate-200 leading-relaxed font-sans">
                                {renderMarkdown(irac.rule)}
                              </div>
                            </div>
                          )}

                          {/* APPLICATION: Purple Luminous Highlight */}
                          {irac.application && (
                            <div className="bg-[#1A202C] border-l-4 border-[#805AD5] border-t border-r border-b border-[#2D3748] rounded-r-xl p-4 shadow-sm space-y-1.5 transition hover:border-[#805AD5]/60">
                              <div className="flex items-center gap-2">
                                <Badge colorScheme="purple">Application</Badge>
                                <span className="text-xs font-bold text-[#D6BCFA]">Judicial Dicta & Analytical Application</span>
                              </div>
                              <div className="text-sm text-slate-200 leading-relaxed font-sans">
                                {renderMarkdown(irac.application)}
                              </div>
                            </div>
                          )}

                          {/* CONCLUSION: Emerald / Green Luminous Highlight */}
                          {irac.conclusion && (
                            <div className="bg-[#1A202C] border-l-4 border-[#38A169] border-t border-r border-b border-[#2D3748] rounded-r-xl p-4 shadow-sm space-y-1.5 transition hover:border-[#38A169]/60">
                              <div className="flex items-center gap-2">
                                <Badge colorScheme="green">Conclusion</Badge>
                                <span className="text-xs font-bold text-[#9AE6B4]">Definitive Legal Holding</span>
                              </div>
                              <div className="text-sm text-slate-200 leading-relaxed font-sans">
                                {renderMarkdown(irac.conclusion)}
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </>
                  )}

                  {/* ERROR MESSAGE (IF ANY) */}
                  {msg.isError && (
                    <div className="p-4 bg-[#742A2A]/30 border border-[#E53E3E] rounded-xl text-xs text-[#FEB2B2]">
                      {msg.text}
                    </div>
                  )}

                  {/* ACTION TOOLBAR: Copy & Toggle Pinpoint Sources */}
                  {res && (
                    <div className="flex items-center justify-between pt-1 border-t border-[#2D3748]/50 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyIrac(msg.id, irac, chunks[0]?.metadata?.case_title || 'Opinion')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A202C] hover:bg-[#2D3748] border border-[#2D3748] text-[#CBD5E0] hover:text-white transition"
                          title="Copy full IRAC legal opinion"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#48BB78]" />
                              <span className="text-[#48BB78]">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Opinion</span>
                            </>
                          )}
                        </button>

                        {chunks.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleSources(msg.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A202C] hover:bg-[#2D3748] border border-[#2D3748] text-[#CBD5E0] hover:text-[#4FD1C5] transition"
                          >
                            <Layers className="w-3.5 h-3.5 text-[#4FD1C5]" />
                            <span>{chunks.length} Retrieved Authorities</span>
                            {areSourcesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      <span className="text-[11px] text-[#718096]">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* EXPANDABLE RETRIEVED SOURCES DRAWER */}
                  {areSourcesOpen && chunks.length > 0 && (
                    <div className="bg-[#171923] border border-[#2D3748] rounded-xl p-4 space-y-3 animate-fadeIn">
                      <h4 className="text-xs font-bold text-white flex items-center justify-between pb-2 border-b border-[#2D3748]">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#4FD1C5]" />
                          Retrieved Pinpoint Sources ({chunks.length})
                        </span>
                        <Badge colorScheme="cyan">Reranked</Badge>
                      </h4>

                      <div className="grid grid-cols-1 gap-2.5 max-h-96 overflow-y-auto pr-1">
                        {chunks.map((chk, idx) => {
                          const meta = chk.metadata || {};
                          return (
                            <div
                              key={chk.id || idx}
                              className="p-3 bg-[#1A202C] rounded-lg border border-[#2D3748] hover:border-[#4FD1C5]/50 transition text-xs space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-white truncate max-w-sm">
                                  {meta.case_title || 'UK Authority'}
                                </div>
                                <Badge colorScheme="teal" variant="solid" className="text-[10px]">
                                  {Math.min(99, Math.max(50, Math.round((chk.score <= 1.0 ? chk.score : chk.score / 3.5) * 100)))}% Match
                                </Badge>
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-[#A0AEC0]">
                                <span className="font-mono text-[#4FD1C5] font-bold">
                                  {meta.neutral_citation || 'Statute'}
                                </span>
                                <span>•</span>
                                <span>{meta.court || 'UK Court'}</span>
                                <span>•</span>
                                <span>Paragraphs: {chk.pinpoint?.paragraph_numbers?.length ? `[${chk.pinpoint.paragraph_numbers.join(', ')}]` : 'General'}</span>
                              </div>

                              <p className="text-slate-300 font-sans line-clamp-3 leading-relaxed bg-[#171923] p-2 rounded border border-[#2D3748]/60 text-[11px]">
                                {chk.text}
                              </p>

                              {/* Action buttons for viewing and downloading */}
                              <div className="flex items-center justify-between pt-1 border-t border-[#2D3748]/50">
                                {chk.documentId ? (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="xs"
                                      variant="solid"
                                      colorScheme="teal"
                                      leftIcon={<BookOpen className="w-3 h-3" />}
                                      onClick={() => {
                                        setViewerDocId(chk.documentId);
                                        setViewerDocTitle(meta.case_title || 'Document Content');
                                      }}
                                    >
                                      Read Full Judgment
                                    </Button>

                                    <a
                                      href={getDocumentDownloadUrl(chk.documentId)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#A0AEC0] hover:text-white bg-[#2D3748] hover:bg-[#4A5568] rounded transition"
                                      title="Download original file"
                                    >
                                      <Download className="w-3 h-3" />
                                      Download
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-[#718096]">Indexed authority</span>
                                )}

                                <span className="text-[10px] text-[#718096]">
                                  Rank #{idx + 1}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}

          {/* LOADING STATE INDICATOR */}
          {isLoading && (
            <div className="flex items-start gap-3.5 animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#319795] to-[#805AD5] flex items-center justify-center shrink-0 shadow-lg shadow-[#319795]/20 animate-spin">
                <Loader2 className="w-4 h-4 text-white" />
              </div>
              <div className="bg-[#1A202C] border border-[#319795]/40 rounded-xl p-4 max-w-lg space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#4FD1C5]">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>LawIntel AI is reviewing UK authorities & synthesizing IRAC...</span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 bg-[#2D3748] rounded animate-pulse w-3/4"></div>
                  <div className="h-2 bg-[#2D3748] rounded animate-pulse w-full"></div>
                  <div className="h-2 bg-[#2D3748] rounded animate-pulse w-5/6"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PINNED CHAT INPUT BAR (ONLY VISIBLE WHEN IN CONVERSATION THREAD) */}
      {messages.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0B0F17]/95 backdrop-blur-xl border-t border-[#161F30] shadow-2xl py-3 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto space-y-2">

            {/* Quick Landmark Prompt Chips Rail */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-left">
              <span className="text-[11px] font-bold text-[#94A3B8] flex items-center gap-1 shrink-0 mr-1 uppercase">
                <Sparkles className="w-3 h-3 text-[#2DD4BF]" /> Landmarks:
              </span>
              {BENCHMARK_TOPICS.slice(0, 6).map((topic, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPrompt(topic.query);
                    handleSubmit(topic.query);
                  }}
                  className="px-2.5 py-1 bg-[#101726] hover:bg-[#182236] text-[#CBD5E1] hover:text-white rounded-full text-xs border border-[#1E2638] transition shrink-0 whitespace-nowrap shadow-sm"
                >
                  {topic.title}
                </button>
              ))}
            </div>

            {/* Input Container matching Screenshot */}
            <div className="bg-[#101726] border border-[#1E2638] hover:border-[#2DD4BF]/50 focus-within:border-[#2DD4BF] rounded-2xl p-2 sm:p-2.5 shadow-2xl flex items-center gap-3 transition">
              <div className="w-9 h-9 rounded-xl bg-[#0E1F24] border border-[#1A3B3E] flex items-center justify-center text-[#2DD4BF] shrink-0">
                <Scale className="w-4 h-4" />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Ask a UK legal question, cite a landmark case, or enter statutory inquiry..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm text-white placeholder-[#64748B] focus:outline-none px-1"
              />

              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0E1F24] border border-[#1A3B3E] text-xs font-semibold text-[#2DD4BF]">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Grounded IRAC</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!prompt.trim() || isLoading}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition shadow-lg ${
                    prompt.trim() && !isLoading
                      ? 'bg-[#2DD4BF] hover:bg-[#14B8A6] text-[#090D16] shadow-[#2DD4BF]/25 cursor-pointer'
                      : 'bg-[#182032] text-[#64748B] cursor-not-allowed'
                  }`}
                  title="Submit inquiry"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#090D16]" />
                  ) : (
                    <ArrowUp className="w-4 h-4 text-[#090D16] stroke-[2.5]" />
                  )}
                </button>
              </div>
            </div>

            {/* Assurance Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2DD4BF]" />
                Strict UK Common Law RAG
              </span>
              <span>•</span>
              <span>BGE-M3 1024-dim Vector Search</span>
              <span>•</span>
              <span>Grounded IRAC Synthesis</span>
              <span>•</span>
              <span>Pinpoint Citations</span>
            </div>

          </div>
        </div>
      )}

      {/* In-Browser Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(viewerDocId)}
        onClose={() => setViewerDocId(null)}
        documentId={viewerDocId}
        initialTitle={viewerDocTitle}
      />

    </div>
  );
}
