const { groqClient, GROQ_MODEL, hasGroqKey } = require('../../config/groq');
const logger = require('../../utils/logger');

class GroqLlmService {
  /**
   * Synthesizes legal analysis using openai/gpt-oss-120b on Groq API.
   * Enforces UK IRAC structure and pinpoint citations.
   */
  static async synthesize(prompt, retrievedChunks) {
    // 1. Format Context Blocks
    const contextBlocks = retrievedChunks.map((c, i) => {
      const p = c.payload;
      const meta = p.legal_metadata || {};
      const pinpoint = p.pinpoint || {};
      const paraInfo = pinpoint.paragraph_numbers?.length ? `Paragraphs: [${pinpoint.paragraph_numbers.join(', ')}]` : '';
      return `--- AUTHORITY [${i + 1}] ---
Title: ${meta.case_title || 'Unknown Authority'}
Neutral Citation: ${meta.neutral_citation || 'N/A'}
Court: ${meta.court || 'Unknown Court'} (${meta.jurisdiction || 'UK'}) | Year: ${meta.year || 'N/A'}
${paraInfo}
Content:
${p.text}
`;
    }).join('\n\n');

    const systemPrompt = `You are the UK Legal Research AI Agent, an authoritative legal reasoning assistant specializing in the law of the United Kingdom (England & Wales, Scotland, Northern Ireland, and UK Parliament).

CRITICAL INSTRUCTIONS:
1. METHODOLOGY: You MUST structure your answer strictly into the UK Legal IRAC Method using the following headings:
### ISSUE
State the precise legal issue(s) raised by the inquiry.

### RULE
State the applicable UK statutory provisions and binding precedents (UKSC, EWCA, EWHC, etc.) from the provided context. Note the court hierarchy and whether authorities are binding or persuasive.

### APPLICATION
Apply the legal rules and judicial reasoning to the user's scenario. Cite specific judicial dicta and factual comparisons from the context passages.

### CONCLUSION
Provide a concise, definitive conclusion summarizing the legal answer.

2. PINPOINT CITATIONS:
- You MUST cite every proposition of law with a precise Neutral Citation and paragraph number (e.g. "[2020] UKSC 13 at [27]" or "Human Rights Act 1998 s. 6").
- Every citation and quotation must be directly supported by the context passages below.
- NEVER invent, extrapolate, or hallucinate case citations or statutes not present in the context.
- If the authorities provided do not contain the answer, explicitly state the limitation.

3. RELEVANCE & LEGAL TOPIC RESTRICTION:
- If the user inquiry is completely non-legal and unrelated to UK law or the indexed materials (e.g. asking about automobiles, consumer electronics, recipes, sports, or gossip), your ENTIRE output MUST strictly and solely be:
The documents do not contain any topic related to this.
- If the provided context passages contain UK legal authorities, statutes, or judgments addressing the inquiry, synthesize a thorough IRAC legal analysis strictly grounded in those passages. Address the propositions substantiated in the passages with pinpoint citations.

AUTHORITATIVE CONTEXT PASSAGES:
${contextBlocks || 'No indexed legal context found.'}
`;

    if (hasGroqKey && groqClient) {
      try {
        logger.info(`Invoking Groq API model: ${GROQ_MODEL}`);
        const response = await groqClient.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 2500
        });

        const rawAnswer = response.choices[0]?.message?.content || '';
        const structuredIrac = this.parseIracSections(rawAnswer);

        return {
          rawAnswer,
          structuredIrac,
          model: GROQ_MODEL,
          isMock: false
        };
      } catch (err) {
        logger.error(`Groq API error with ${GROQ_MODEL}: ${err.message}. Falling back to deterministic legal synthesis engine.`);
      }
    }

    // Fallback Deterministic IRAC Synthesis Engine (Guarantees system operates seamlessly even before API key is entered)
    const fallbackAnswer = this.generateDeterministicSynthesis(prompt, retrievedChunks);
    const structuredIrac = this.parseIracSections(fallbackAnswer);

    return {
      rawAnswer: fallbackAnswer,
      structuredIrac,
      model: `${GROQ_MODEL} (Local Grounded Engine)`,
      isMock: true
    };
  }

  /**
   * Extracts IRAC sections from markdown text supporting all heading styles.
   * Handles ### ISSUE, ## ISSUE, **ISSUE**, **ISSUE:**, and numbered variants.
   */
  static parseIracSections(text) {
    const irac = {
      issue: '',
      rule: '',
      application: '',
      conclusion: ''
    };

    if (!text || typeof text !== 'string') return irac;

    // Normalizes narrow non-breaking spaces commonly emitted by LLMs
    const cleanText = text.replace(/[\u202F\u00A0]/g, ' ');

    // Flexible regex supporting ### ISSUE, ## ISSUE, **ISSUE**, **ISSUE:**, etc.
    const issueMatch = cleanText.match(/(?:^|\n)\s*(?:#{1,4}|\*\*)\s*(?:1\.\s*)?ISSUE(?:\*\*|:)?\s*([\s\S]*?)(?=(?:^|\n)\s*(?:#{1,4}|\*\*)\s*(?:2\.\s*)?RULE|$)/i);
    const ruleMatch = cleanText.match(/(?:^|\n)\s*(?:#{1,4}|\*\*)\s*(?:2\.\s*)?RULE(?:\*\*|:)?\s*([\s\S]*?)(?=(?:^|\n)\s*(?:#{1,4}|\*\*)\s*(?:3\.\s*)?APPLICATION|$)/i);
    const appMatch = cleanText.match(/(?:^|\n)\s*(?:#{1,4}|\*\*)\s*(?:3\.\s*)?APPLICATION(?:\*\*|:)?\s*([\s\S]*?)(?=(?:^|\n)\s*(?:#{1,4}|\*\*)\s*(?:4\.\s*)?CONCLUSION|$)/i);
    const concMatch = cleanText.match(/(?:^|\n)\s*(?:#{1,4}|\*\*)\s*(?:4\.\s*)?CONCLUSION(?:\*\*|:)?\s*([\s\S]*?)$/i);

    if (issueMatch) irac.issue = issueMatch[1].trim();
    if (ruleMatch) irac.rule = ruleMatch[1].trim();
    if (appMatch) irac.application = appMatch[1].trim();
    if (concMatch) irac.conclusion = concMatch[1].trim();

    // Clean any remaining heading markdown artifacts at start of blocks
    irac.issue = irac.issue.replace(/^\s*(?:\*\*|#{1,4})?\s*ISSUE(?:\*\*|:)?\s*/i, '').trim();
    irac.rule = irac.rule.replace(/^\s*(?:\*\*|#{1,4})?\s*RULE(?:\*\*|:)?\s*/i, '').trim();
    irac.application = irac.application.replace(/^\s*(?:\*\*|#{1,4})?\s*APPLICATION(?:\*\*|:)?\s*/i, '').trim();
    irac.conclusion = irac.conclusion.replace(/^\s*(?:\*\*|#{1,4})?\s*CONCLUSION(?:\*\*|:)?\s*/i, '').trim();

    // If headings weren't matched, handle direct refusal or fallback
    if (!irac.issue && !irac.rule) {
      if (cleanText.includes('The documents do not contain any topic related to this') || cleanText.includes('does not contain any topic related')) {
        irac.issue = 'Topic not contained in indexed documents';
        irac.rule = 'The documents do not contain any topic related to this.';
        irac.application = 'The documents do not contain any topic related to this.';
        irac.conclusion = 'The documents do not contain any topic related to this.';
      } else {
        irac.application = cleanText;
      }
    }

    return irac;
  }

  /**
   * Generates a fully grounded IRAC analysis directly from the top retrieved chunks.
   */
  static generateDeterministicSynthesis(prompt, chunks) {
    if (!chunks.length) {
      return `### ISSUE\nInquiry: "${prompt}"\n\n### RULE\nThe documents do not contain any topic related to this.\n\n### APPLICATION\nThe documents do not contain any topic related to this.\n\n### CONCLUSION\nThe documents do not contain any topic related to this.`;
    }

    const primaryChunk = chunks[0];
    const meta = primaryChunk.payload.legal_metadata || {};
    const pinpoint = primaryChunk.payload.pinpoint || {};
    const citation = meta.neutral_citation || 'UK Legal Authority';
    const rawText = primaryChunk.payload.text || '';
    
    // Extract concise title from Authority tag if available
    const authMatch = rawText.match(/\[Authority:\s*([^|\]]+)/i);
    const caseTitle = authMatch ? authMatch[1].trim() : (meta.case_title || 'Reported Authority');
    const court = meta.court || 'UK Court';

    // Strip bracketed header if present
    const cleanText = rawText.replace(/\[(?:Authority|UK Legal Authority):[^\]]+\]\s*/gi, '').trim();

    // Parse numbered paragraphs: [1], [2], [24], etc.
    const paras = [...cleanText.matchAll(/(?:^|\n)\s*\[(\d+)\]\s*([\s\S]*?)(?=(?:\n\s*\[\d+\])|$)/g)]
      .map((m) => ({ num: m[1], text: m[2].trim() }));

    let issueText = '';
    let ruleText = '';
    let applicationText = '';
    let conclusionText = '';

    if (paras.length >= 3) {
      // Para 1 or 2 is typically the Issue
      issueText = paras[0].text;
      if (paras[1] && paras.length > 3 && paras[1].text.length < 250) {
        issueText += `\n\n${paras[1].text}`;
      }

      // Middle paragraphs represent Rule and Application
      const middleParas = paras.slice(1, -1);
      if (middleParas.length === 1) {
        ruleText = `[${middleParas[0].num}] ${middleParas[0].text}`;
        applicationText = `Applying the principles articulated at [${middleParas[0].num}], the court examined the factual matrix in light of the statutory and common law framework.`;
      } else if (middleParas.length === 2) {
        ruleText = `[${middleParas[0].num}] ${middleParas[0].text}`;
        applicationText = `[${middleParas[1].num}] ${middleParas[1].text}`;
      } else {
        // First half of middle is rule, second half is application
        const midPoint = Math.ceil(middleParas.length / 2);
        ruleText = middleParas.slice(0, midPoint).map((p) => `[${p.num}] ${p.text}`).join('\n\n');
        applicationText = middleParas.slice(midPoint).map((p) => `[${p.num}] ${p.text}`).join('\n\n');
      }

      // Last paragraph is typically the Definitive Holding / Disposition
      const lastPara = paras[paras.length - 1];
      conclusionText = `[${lastPara.num}] ${lastPara.text}`;
    } else {
      // Fallback if paragraphs aren't numbered [1], [2]
      issueText = `The legal inquiry concerns: "${prompt}". Specifically, what principles of UK law govern this subject under ${citation}?`;
      ruleText = `In **${caseTitle}** ${citation} (${court}), the court established binding guidance regarding ${meta.legal_domains?.join(', ') || 'the applicable law'}.\n\nExtract from authority:\n"${cleanText.slice(0, 350)}..."`;
      applicationText = `Applying the principles of **${caseTitle}** ${citation} to the inquiry, the court adheres to established UK judicial doctrine.`;
      conclusionText = `Based on **${caseTitle}** ${citation}, the authoritative position in UK law is governed by the principles articulated in the judgment.`;
    }

    const paraCitationList = pinpoint.paragraph_numbers?.length ? `at [${pinpoint.paragraph_numbers.join(', ')}]` : '';

    return `### ISSUE
${issueText}

### RULE
According to **${caseTitle}** ${citation} (${court}) ${paraCitationList}:
${ruleText}

### APPLICATION
Applying the judicial analysis from **${caseTitle}** ${citation}:
${applicationText}

### CONCLUSION
${conclusionText}`;
  }
}

module.exports = GroqLlmService;
