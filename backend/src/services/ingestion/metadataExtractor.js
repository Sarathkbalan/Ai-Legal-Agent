const { UK_COURTS, COURT_TIERS, LEGAL_DOMAINS, JURISDICTIONS } = require('../../config/constants');
const {
  UK_NEUTRAL_CITATION_PATTERNS,
  UK_LAW_REPORT_PATTERNS,
  UK_STATUTE_PATTERNS
} = require('../../utils/legalRegex');

class MetadataExtractor {
  /**
   * Extracts legal metadata from parsed UK legal document.
   */
  static extract(text, filename = '', jurisdictionInfo = {}) {
    const header = text.slice(0, 5000);
    const fullText = text.slice(0, 30000);

    // 1. Neutral Citation
    let neutralCitation = jurisdictionInfo.detectedCitation || null;
    if (!neutralCitation) {
      for (const pattern of UK_NEUTRAL_CITATION_PATTERNS) {
        const match = header.match(pattern);
        if (match) {
          neutralCitation = match[0].trim();
          break;
        }
      }
    }

    // 2. Alternative Law Report Citations
    const alternativeCitations = [];
    for (const pattern of UK_LAW_REPORT_PATTERNS) {
      const matches = fullText.match(new RegExp(pattern.source, 'gi')) || [];
      for (const m of matches) {
        if (!alternativeCitations.includes(m.trim())) {
          alternativeCitations.push(m.trim());
        }
      }
    }

    // 3. Year
    let year = null;
    if (neutralCitation) {
      const yearMatch = neutralCitation.match(/\[(\d{4})\]/);
      if (yearMatch) year = parseInt(yearMatch[1], 10);
    }
    if (!year) {
      const dateYearMatch = header.match(/\b(?:19|20)\d{2}\b/);
      if (dateYearMatch) year = parseInt(dateYearMatch[0], 10);
    }

    // 4. Case Title / Act Title
    let title = null;
    // Check if it's an Act of Parliament
    const actMatch = header.match(/\b([A-Z][A-Za-z0-9\s,'-]+)\s+Act\s+(1[89]\d\d|20[0-2]\d)\b/);
    if (actMatch) {
      title = `${actMatch[1].trim()} Act ${actMatch[2]}`;
    }

    // Check for "BETWEEN: ... AND ..." or party structure
    if (!title) {
      const betweenMatch = header.match(/BETWEEN\s*:\s*\n+([^\n]+)(?:[\s\S]*?)(?:and|-v-|\bv\b)\n+([^\n]+)/i);
      if (betweenMatch) {
        const cleanRole = (s) => s.replace(/\(.*?\)/g, '')
          .replace(/\b(Appellant|Respondent|Claimants?|Defendants?|Respondents?|Appellants?)\b/gi, '')
          .replace(/[\n\r]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const p1 = cleanRole(betweenMatch[1]);
        const p2 = cleanRole(betweenMatch[2]);
        if (p1 && p2) {
          title = `${p1} v ${p2}`;
        }
      }
    }

    // Check for "JUDGMENT\n Party1 v Party2\nbefore" (Standard in Find Case Law / UKSC PDFs)
    if (!title) {
      const judgmentVMatch = header.match(/JUDGMENT\s*\n\s*([A-Z][A-Za-z0-9\s,'&().-]+?)\s+(?:-v-|\bv\.?\b)\s+([A-Za-z0-9\s,'&().-]+?)(?=\n\s*(?:before|Before|Judgment Date|JUDGMENT GIVEN|Date:)|$)/i);
      if (judgmentVMatch) {
        const cleanRole = (s) => s.replace(/\b(Appellants?|Respondents?|Claimants?|Defendants?)\b/gi, '').replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').replace(/\(\s*\)/g, '').trim();
        const p1 = cleanRole(judgmentVMatch[1]);
        const p2 = cleanRole(judgmentVMatch[2]);
        if (p1 && p2 && p1.length < 120 && p2.length < 120) {
          title = `${p1} v ${p2}`;
        }
      }
    }

    // Check for "X v Y" pattern in first 1000 characters
    if (!title) {
      const vMatch = header.slice(0, 1500).match(/([A-Z][A-Za-z0-9\s,'&]+)\s+(?:-v-|\bv\.?\b)\s+([A-Z][A-Za-z0-9\s,'&]+)/);
      if (vMatch && vMatch[1].length < 60 && vMatch[2].length < 60) {
        const cleanRole = (s) => s.replace(/\b(Appellant|Respondent|Claimants?|Defendants?)\b/gi, '').trim();
        title = `${cleanRole(vMatch[1])} v ${cleanRole(vMatch[2])}`;
      }
    }

    // Fallback title from filename
    if (!title) {
      const cleanName = filename
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .trim();
      title = cleanName.length > 3 ? cleanName : (neutralCitation ? `Judgment ${neutralCitation}` : 'UK Legal Authority');
    }

    // 5. Parties
    let claimantAppellant = null;
    let defendantRespondent = null;
    if (title && title.includes(' v ')) {
      const parts = title.split(' v ');
      claimantAppellant = parts[0]?.trim() || null;
      defendantRespondent = parts[1]?.trim() || null;
    }

    // 6. Court & Court Tier
    let court = 'Other UK Court/Tribunal';
    if (neutralCitation) {
      if (/UKSC/i.test(neutralCitation)) court = 'UK Supreme Court';
      else if (/UKPC/i.test(neutralCitation)) court = 'Privy Council';
      else if (/EWCA\s+Civ/i.test(neutralCitation)) court = 'Court of Appeal (Civil Division)';
      else if (/EWCA\s+Crim/i.test(neutralCitation)) court = 'Court of Appeal (Criminal Division)';
      else if (/EWHC/i.test(neutralCitation)) {
        if (/Admin/i.test(neutralCitation)) court = 'High Court (King\'s Bench Division)';
        else if (/Ch/i.test(neutralCitation)) court = 'High Court (Chancery Division)';
        else if (/Fam/i.test(neutralCitation)) court = 'High Court (Family Division)';
        else court = 'High Court (King\'s Bench Division)';
      } else if (/CSIH/i.test(neutralCitation)) court = 'Court of Session (Inner House)';
      else if (/CSOH/i.test(neutralCitation)) court = 'Court of Session (Outer House)';
      else if (/HCJAC/i.test(neutralCitation)) court = 'High Court of Justiciary';
      else if (/NICA/i.test(neutralCitation)) court = 'Court of Appeal in Northern Ireland';
      else if (/NIKB|NIQB/i.test(neutralCitation)) court = 'High Court of Justice in Northern Ireland';
      else if (/UKUT/i.test(neutralCitation)) court = 'Upper Tribunal';
      else if (/CAT/i.test(neutralCitation)) court = 'Upper Tribunal';
    } else if (title && title.includes('Act ')) {
      court = 'UK Parliament (Act of Parliament)';
    }
    const courtTier = COURT_TIERS[court] || 4;

    // 7. Judges
    const judges = [];
    const judgePatterns = [
      /(?:LORD|LADY)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
      /([A-Z][a-z]+)\s+(?:LJ|J)\b/g,
      /(?:MR|MRS|MS)\s+JUSTICE\s+([A-Z][a-z]+)/gi
    ];
    for (const jp of judgePatterns) {
      let jMatch;
      while ((jMatch = jp.exec(header)) !== null) {
        const jName = jMatch[0].trim();
        if (!judges.includes(jName) && judges.length < 7) {
          judges.push(jName);
        }
      }
    }

    // 8. Legal Domains Classification
    const legalDomains = [];
    const lower = text.toLowerCase();
    const domainKeywords = {
      'Tort Law': ['tort', 'negligence', 'duty of care', 'vicarious liability', 'nuisance', 'trespass', 'defamation'],
      'Contract Law': ['breach of contract', 'consideration', 'offer and acceptance', 'misrepresentation', 'warranty', 'covenant'],
      'Constitutional & Administrative Law': ['judicial review', 'prerogative', 'ultra vires', 'unlawful', 'parliamentary sovereignty'],
      'Criminal Law': ['indictment', 'mens rea', 'actu reus', 'murder', 'manslaughter', 'theft', 'prosecution', 'crown court'],
      'Commercial & Company Law': ['director', 'shareholder', 'insolvency', 'winding up', 'companies act', 'fiduciary duty'],
      'Employment Law': ['unfair dismissal', 'redundancy', 'employment tribunal', 'contract of employment', 'worker status'],
      'Land & Property Law': ['leasehold', 'freehold', 'easement', 'land registration', 'mortgage', 'tenancy'],
      'Human Rights': ['human rights act', 'convention rights', 'article 8', 'article 6', 'echr', 'proportionality']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      let hits = 0;
      for (const kw of keywords) {
        if (lower.includes(kw)) hits++;
      }
      if (hits >= 2) legalDomains.push(domain);
    }
    if (legalDomains.length === 0) legalDomains.push('General UK Law');

    // 9. Statutes Cited
    const statutesCited = [];
    for (const statPattern of UK_STATUTE_PATTERNS) {
      let sm;
      while ((sm = statPattern.exec(text)) !== null) {
        const statName = sm[0].trim();
        if (!statutesCited.includes(statName) && statutesCited.length < 15) {
          statutesCited.push(statName);
        }
      }
    }

    return {
      title,
      neutralCitation,
      alternativeCitations: alternativeCitations.slice(0, 5),
      court,
      courtTier,
      jurisdiction: jurisdictionInfo.jurisdiction || JURISDICTIONS.UK_WIDE,
      judgmentDate: year ? new Date(year, 0, 1) : null,
      year,
      judges,
      parties: { claimantAppellant, defendantRespondent },
      legalDomains,
      statutesCited
    };
  }
}

module.exports = MetadataExtractor;
