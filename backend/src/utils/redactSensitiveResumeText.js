const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4,6}\b/g;
const urlRegex = /\b(?:https?:\/\/|www\.)\S+\b/gi;
const rollRegex = /\b(?:roll\s*(?:no|number)?|student\s*id|enrollment\s*(?:no|number)?|reg(?:istration)?\s*(?:no|number)?)\s*[:#-]?\s*[a-z0-9/-]+\b/gi;
const noisySymbolsRegex = /[ï§�]/g;

function normalizeLine(line = '') {
  return String(line)
    .replace(noisySymbolsRegex, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function looksLikeNameLine(line = '') {
  const cleaned = normalizeLine(line);
  if (!cleaned || cleaned.length > 70) return false;
  if (/[:@/\\|]/.test(cleaned)) return false;
  if (/\d/.test(cleaned)) return false;
  if (/\b(education|project|technical|skill|experience|certification|achievement|summary|profile)\b/i.test(cleaned)) return false;
  const words = cleaned.split(/\s+/);
  return words.length >= 2 && words.length <= 4 && words.every((word) => /^[A-Z][a-zA-Z.'-]+$/.test(word));
}

function isContactOnlyLine(line = '') {
  const cleaned = normalizeLine(line);
  if (!cleaned) return true;
  const lower = cleaned.toLowerCase();

  emailRegex.lastIndex = 0;
  phoneRegex.lastIndex = 0;
  rollRegex.lastIndex = 0;
  const hasContactIdentifier = emailRegex.test(cleaned) || phoneRegex.test(cleaned) || rollRegex.test(cleaned);
  emailRegex.lastIndex = 0;
  phoneRegex.lastIndex = 0;
  rollRegex.lastIndex = 0;
  if (hasContactIdentifier) return true;

  if (/\b(linkedin|github|portfolio)\b/i.test(cleaned) && !/\b(skill|project|built|using|tool|technology|technologies)\b/i.test(cleaned)) {
    return true;
  }

  if (urlRegex.test(cleaned) && !/\b(project|repository|api|deployed|built|using)\b/i.test(cleaned)) return true;
  urlRegex.lastIndex = 0;

  if (/^(address|location)\s*[:,-]/i.test(cleaned)) return true;
  if (/^[a-z\s]+,\s*[a-z\s]+(?:,\s*[a-z\s]+)?$/i.test(cleaned) && lower.length < 80) return true;

  return false;
}

export function redactSensitiveResumeText(rawText = '') {
  const raw = String(rawText || '').replace(/\r\n/g, '\n').replace(noisySymbolsRegex, '');
  const summary = {
    emailsRemoved: 0,
    phonesRemoved: 0,
    linksRemoved: 0,
    headerLinesRemoved: 0,
    nameRedacted: false,
  };

  const lines = raw
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean);

  const redactedLines = lines.map((line, index) => {
    let next = line;
    const inHeader = index < 12;

    if (inHeader && !summary.nameRedacted && looksLikeNameLine(next)) {
      summary.nameRedacted = true;
      summary.headerLinesRemoved += 1;
      return '[REDACTED_NAME]';
    }

    if (inHeader && isContactOnlyLine(next)) {
      summary.headerLinesRemoved += 1;
      emailRegex.lastIndex = 0;
      if ((next.match(emailRegex) || []).length) summary.emailsRemoved += 1;
      emailRegex.lastIndex = 0;
      const phoneMatches = next.match(phoneRegex) || [];
      if (phoneMatches.some((match) => match.replace(/\D/g, '').length >= 8)) summary.phonesRemoved += 1;
      phoneRegex.lastIndex = 0;
      if (/\blinkedin\b/i.test(next)) {
        summary.linksRemoved += 1;
        return '[REDACTED_LINKEDIN]';
      }
      if (/\bgithub\b/i.test(next)) {
        summary.linksRemoved += 1;
        return '[REDACTED_GITHUB]';
      }
      if (/\bportfolio\b/i.test(next) || urlRegex.test(next)) {
        summary.linksRemoved += 1;
        urlRegex.lastIndex = 0;
        return '[REDACTED_LINK]';
      }
      return '[REDACTED_CONTACT]';
    }

    next = next.replace(emailRegex, () => {
      summary.emailsRemoved += 1;
      return '[REDACTED_EMAIL]';
    });
    next = next.replace(phoneRegex, (match) => {
      if (match.replace(/\D/g, '').length < 8) return match;
      summary.phonesRemoved += 1;
      return '[REDACTED_PHONE]';
    });
    next = next.replace(rollRegex, '[REDACTED_STUDENT_ID]');
    next = next.replace(urlRegex, (match) => {
      if (/github/i.test(match)) {
        summary.linksRemoved += 1;
        return '[REDACTED_GITHUB]';
      }
      if (/linkedin/i.test(match)) {
        summary.linksRemoved += 1;
        return '[REDACTED_LINKEDIN]';
      }
      summary.linksRemoved += 1;
      return '[REDACTED_LINK]';
    });

    if (inHeader && isContactOnlyLine(next)) {
      summary.headerLinesRemoved += 1;
      return '';
    }

    return next;
  });

  const redactedText = redactedLines
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    rawText: raw.trim(),
    redactedText,
    redactionSummary: summary,
  };
}

export function containsSensitiveResumeData(value = '') {
  const text = String(value || '');
  emailRegex.lastIndex = 0;
  phoneRegex.lastIndex = 0;
  const hasSensitiveData = emailRegex.test(text) || phoneRegex.test(text) || /https?:\/\/(?:www\.)?(linkedin|github)\.com/i.test(text);
  emailRegex.lastIndex = 0;
  phoneRegex.lastIndex = 0;
  return hasSensitiveData;
}
