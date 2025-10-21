/**
 * Sentence Segmentation Utility
 * Handles deterministic sentence splitting with proper handling of abbreviations,
 * quotes, and edge cases common in classic literature.
 */

// Common abbreviations that shouldn't trigger sentence breaks
const ABBREVIATIONS = [
  'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr', 'St', 'Rev',
  'Hon', 'Lt', 'Col', 'Gen', 'Capt', 'Sgt', 'Corp',
  'etc', 'vs', 'vol', 'no', 'chap', 'ch', 'fig', 'p', 'pp',
  'viz', 'i.e', 'e.g', 'cf', 'et al',
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Build regex pattern for abbreviations
const ABBREV_PATTERN = ABBREVIATIONS.map(abbr => abbr.replace('.', '\\.')).join('|');

/**
 * Normalize text by standardizing quotes, dashes, and whitespace
 */
function normalizeText(text) {
  return text
    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes to straight
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes to straight
    .replace(/[\u2013\u2014]/g, '-') // Em/en dashes to hyphens
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .trim();
}

/**
 * Segment a paragraph into sentences with character offsets
 * @param {string} paragraphText - The paragraph to segment
 * @param {string} paragraphId - Stable ID for the paragraph
 * @returns {Array} Array of sentence objects with id, text, start, and end
 */
function segmentParagraph(paragraphText, paragraphId) {
  const normalized = normalizeText(paragraphText);
  const sentences = [];

  // Split on sentence boundaries while preserving the delimiter
  // Handles: . ! ? followed by space/quote/end-of-string
  const parts = normalized.split(/([.!?]+[\s"'\u201D\u2019]|[.!?]+$)/);

  let currentPos = 0;
  let sentenceBuffer = '';
  let sentenceStart = 0;
  let sentenceIndex = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (!part) continue;

    // Check if this is a sentence delimiter
    const isDelimiter = /^[.!?]+[\s"'\u201D\u2019]?$/.test(part);

    if (isDelimiter) {
      sentenceBuffer += part.trim();

      // Check if the sentence ending is an abbreviation
      const lastWord = sentenceBuffer.match(new RegExp(`\\b(${ABBREV_PATTERN})\\.$`, 'i'));

      if (!lastWord) {
        // This is a real sentence boundary
        const sentenceText = sentenceBuffer.trim();

        if (sentenceText.length > 0) {
          sentences.push({
            sid: `${paragraphId}_s${sentenceIndex + 1}`,
            text: sentenceText,
            start: sentenceStart,
            end: sentenceStart + sentenceText.length
          });

          sentenceIndex++;
          sentenceBuffer = '';
          sentenceStart = currentPos + part.length;
        }
      }
    } else {
      sentenceBuffer += part;
    }

    currentPos += part.length;
  }

  // Handle any remaining text
  const remaining = sentenceBuffer.trim();
  if (remaining.length > 0) {
    sentences.push({
      sid: `${paragraphId}_s${sentenceIndex + 1}`,
      text: remaining,
      start: sentenceStart,
      end: sentenceStart + remaining.length
    });
  }

  return sentences;
}

/**
 * Extract paragraphs from HTML content
 * @param {string} htmlContent - HTML content with <p> tags
 * @returns {Array} Array of paragraph text strings
 */
function extractParagraphsFromHTML(htmlContent) {
  const paragraphs = [];
  const pTagRegex = /<p[^>]*>(.*?)<\/p>/gis;
  let match;

  while ((match = pTagRegex.exec(htmlContent)) !== null) {
    const text = match[1]
      .replace(/<[^>]+>/g, '') // Remove any inner HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();

    if (text.length > 0) {
      paragraphs.push(text);
    }
  }

  return paragraphs;
}

/**
 * Process a chapter into structured paragraph/sentence format
 * @param {Object} chapter - Chapter object with id, title, and original text
 * @returns {Object} Structured chapter with paragraphs and sentences
 */
function processChapter(chapter) {
  const paragraphTexts = extractParagraphsFromHTML(chapter.original);
  const paragraphs = [];

  paragraphTexts.forEach((paraText, index) => {
    const pid = `${chapter.id}_p${index + 1}`;
    const sentences = segmentParagraph(paraText, pid);

    paragraphs.push({
      pid,
      text: paraText,
      sentences
    });
  });

  return {
    chapter_id: chapter.id,
    title: chapter.title,
    paragraphs
  };
}

/**
 * Create context window for a sentence
 * @param {Array} sentences - All sentences in the paragraph
 * @param {number} sentenceIndex - Index of the target sentence
 * @param {string} paragraphText - Full paragraph text
 * @returns {Object} Context object with paragraph and neighboring sentences
 */
function createContextWindow(sentences, sentenceIndex, paragraphText) {
  const prevSentence = sentenceIndex > 0 ? sentences[sentenceIndex - 1] : null;
  const nextSentence = sentenceIndex < sentences.length - 1 ? sentences[sentenceIndex + 1] : null;

  return {
    paragraph: paragraphText,
    prev_sentence: prevSentence ? prevSentence.text : null,
    next_sentence: nextSentence ? nextSentence.text : null
  };
}

export {
  normalizeText,
  segmentParagraph,
  extractParagraphsFromHTML,
  processChapter,
  createContextWindow
};
