const { v4: uuidv4 } = require('uuid');

class LegalChunker {
  /**
   * Splits legal text into paragraph-aware chunks preserving statutory numbers and judicial citations.
   * Target: ~500-800 tokens (~2500-3500 chars) with contextual legal breadcrumb headers.
   */
  static chunk(text, metadata = {}) {
    const rawParagraphs = this.splitIntoParagraphs(text);
    const chunks = [];

    let currentBuffer = [];
    let currentChars = 0;
    let currentParas = [];
    let currentSections = [];

    const MAX_CHARS = 3000;
    const MIN_CHARS = 1000;

    for (let i = 0; i < rawParagraphs.length; i++) {
      const item = rawParagraphs[i];
      const paraLen = item.text.length;

      // If single paragraph is massive (exceeds MAX_CHARS), split it further
      if (paraLen > MAX_CHARS) {
        if (currentBuffer.length > 0) {
          chunks.push(this.createChunkRecord(currentBuffer, currentParas, currentSections, metadata, chunks.length));
          currentBuffer = [];
          currentChars = 0;
          currentParas = [];
          currentSections = [];
        }

        const subChunks = this.splitLongParagraph(item, metadata, chunks.length);
        chunks.push(...subChunks);
        continue;
      }

      // Check if adding this paragraph exceeds limit
      if (currentChars + paraLen > MAX_CHARS && currentChars >= MIN_CHARS) {
        chunks.push(this.createChunkRecord(currentBuffer, currentParas, currentSections, metadata, chunks.length));
        
        // Overlap: keep the last paragraph for context continuity
        const lastItem = currentBuffer[currentBuffer.length - 1];
        currentBuffer = [lastItem, item];
        currentChars = lastItem.text.length + paraLen;
        currentParas = [...(lastItem.paraNum ? [lastItem.paraNum] : []), ...(item.paraNum ? [item.paraNum] : [])];
        currentSections = [...(lastItem.section ? [lastItem.section] : []), ...(item.section ? [item.section] : [])];
      } else {
        currentBuffer.push(item);
        currentChars += paraLen;
        if (item.paraNum && !currentParas.includes(item.paraNum)) {
          currentParas.push(item.paraNum);
        }
        if (item.section && !currentSections.includes(item.section)) {
          currentSections.push(item.section);
        }
      }
    }

    // Flush remaining buffer
    if (currentBuffer.length > 0) {
      chunks.push(this.createChunkRecord(currentBuffer, currentParas, currentSections, metadata, chunks.length));
    }

    // Safety fallback: ensure at least one chunk is always created for valid text
    if (chunks.length === 0 && text && text.trim().length > 0) {
      chunks.push(this.createChunkRecord([{ text: text.trim(), paraNum: null, section: null }], [], [], metadata, 0));
    }

    return chunks;
  }

  /**
   * Splits raw text by paragraph anchors ([1], [2], or numbered judicial lists).
   */
  static splitIntoParagraphs(text) {
    const lines = text.split('\n');
    const paragraphs = [];
    let currentPara = { text: '', paraNum: null, section: null };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Match [1], [23], etc.
      const bracketMatch = trimmed.match(/^\[(\d+)\]\s*(.*)/);
      // Match 1., 23. at start of line
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      // Match section headings (e.g. "Section 14" or "Background")
      const sectionMatch = trimmed.match(/^(?:Section|Part|Schedule)\s+(\d+[A-Za-z]?|[IVXLCDM]+)\b/i);

      if (bracketMatch) {
        if (currentPara.text) paragraphs.push(currentPara);
        currentPara = {
          text: line,
          paraNum: parseInt(bracketMatch[1], 10),
          section: currentPara.section
        };
      } else if (numMatch && parseInt(numMatch[1], 10) < 500) {
        if (currentPara.text) paragraphs.push(currentPara);
        currentPara = {
          text: line,
          paraNum: parseInt(numMatch[1], 10),
          section: currentPara.section
        };
      } else if (sectionMatch) {
        if (currentPara.text) paragraphs.push(currentPara);
        currentPara = {
          text: line,
          paraNum: null,
          section: trimmed
        };
      } else {
        currentPara.text += (currentPara.text ? '\n' : '') + line;
      }
    }

    if (currentPara.text) {
      paragraphs.push(currentPara);
    }

    return paragraphs.length > 0 ? paragraphs : [{ text, paraNum: null, section: null }];
  }

  static splitLongParagraph(item, metadata, startIndex) {
    const chunks = [];
    const text = item.text;
    const size = 2500;
    const overlap = 300;
    let start = 0;
    let idx = startIndex;

    while (start < text.length) {
      const end = Math.min(start + size, text.length);
      const slice = text.slice(start, end);
      const qdrantPointId = uuidv4();

      const breadcrumb = this.buildBreadcrumb(metadata, item.paraNum ? [item.paraNum] : [], item.section);
      const content = `${breadcrumb}\n\n${slice}`;

      chunks.push({
        qdrantPointId,
        chunkIndex: idx++,
        content,
        tokenCount: Math.ceil(content.length / 4),
        paragraphNumbers: item.paraNum ? [item.paraNum] : [],
        sectionTitle: item.section || null,
        metadata: {
          caseTitle: metadata.title,
          neutralCitation: metadata.neutralCitation,
          court: metadata.court,
          jurisdiction: metadata.jurisdiction,
          year: metadata.year
        }
      });

      start += size - overlap;
    }

    return chunks;
  }

  static createChunkRecord(buffer, paras, sections, metadata, chunkIndex) {
    const rawContent = buffer.map((b) => b.text).join('\n\n');
    const qdrantPointId = uuidv4();
    const sectionTitle = sections.length > 0 ? sections[0] : null;

    const breadcrumb = this.buildBreadcrumb(metadata, paras, sectionTitle);
    const content = `${breadcrumb}\n\n${rawContent}`;

    return {
      qdrantPointId,
      chunkIndex,
      content,
      tokenCount: Math.ceil(content.length / 4),
      paragraphNumbers: paras,
      sectionTitle,
      metadata: {
        caseTitle: metadata.title,
        neutralCitation: metadata.neutralCitation,
        court: metadata.court,
        jurisdiction: metadata.jurisdiction,
        year: metadata.year
      }
    };
  }

  static buildBreadcrumb(metadata, paras, section) {
    const parts = [];
    if (metadata.title) parts.push(`Authority: ${metadata.title}`);
    if (metadata.neutralCitation) parts.push(`Citation: ${metadata.neutralCitation}`);
    if (metadata.court) parts.push(`Court: ${metadata.court}`);
    if (section) parts.push(`Section: ${section}`);
    if (paras && paras.length > 0) parts.push(`Paragraphs: [${paras.join(', ')}]`);
    return `[${parts.join(' | ')}]`;
  }
}

module.exports = LegalChunker;
