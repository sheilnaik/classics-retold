// Debounce utility for scroll position saving
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Find passage data for selected text
export function findPassageForSelection(selectedText, passages) {
  if (!selectedText || !passages) return null;
  
  const normalizedSelection = normalizeText(selectedText);
  console.log('Normalized selection:', normalizedSelection);
  
  // Try exact match first
  for (const passage of passages) {
    const normalizedOriginal = normalizeText(passage.originalText);
    console.log('Comparing with:', normalizedOriginal.substring(0, 100));
    if (normalizedOriginal.includes(normalizedSelection)) {
      console.log('Exact match found!');
      return passage;
    }
    // Also try if selection is contained in original
    if (normalizedSelection.includes(normalizedOriginal)) {
      console.log('Selection contains passage!');
      return passage;
    }
  }
  
  // Try fuzzy match (contains at least 60% of significant words)
  const selectionWords = normalizedSelection.split(/\s+/).filter(w => w.length > 3);
  console.log('Selection words:', selectionWords);
  
  for (const passage of passages) {
    const normalizedOriginal = normalizeText(passage.originalText);
    const matchingWords = selectionWords.filter(word => 
      normalizedOriginal.includes(word)
    );
    
    const matchRatio = matchingWords.length / selectionWords.length;
    console.log('Match ratio for passage:', matchRatio, 'matching words:', matchingWords.length, '/', selectionWords.length);
    
    if (matchRatio >= 0.6) {
      console.log('Fuzzy match found!');
      return passage;
    }
  }
  
  return null;
}

// Normalize text for comparison
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Get selected text from window selection
export function getSelectedText() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  
  const text = selection.toString().trim();
  if (text.length < 10) return null; // Ignore very short selections
  
  return text;
}

// Clear text selection
export function clearSelection() {
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  }
}

// Scroll to saved position
export function scrollToPosition(position, behavior = 'auto') {
  if (typeof position === 'number') {
    window.scrollTo({ top: position, behavior });
  }
}

// Get current scroll position
export function getCurrentScrollPosition() {
  return window.pageYOffset || document.documentElement.scrollTop;
}

// Find the modern translation for a sentence by matching it to the original text
// and extracting the corresponding portion from the modern text
export function findModernTranslation(originalSentence, originalChapter, modernChapter) {
  if (!originalSentence || !originalChapter || !modernChapter) return null;

  // Strip HTML tags to get plain text
  const originalText = stripHtml(originalChapter);
  const modernText = stripHtml(modernChapter);

  const normalizedSentence = normalizeText(originalSentence);

  // Try to find the sentence in the original text
  const sentences = originalText.match(/[^.!?]+[.!?]+/g) || [];

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (normalizeText(sentence).includes(normalizedSentence)) {
      // Found the sentence - now extract the corresponding portion from modern text
      const modernSentences = modernText.match(/[^.!?]+[.!?]+/g) || [];
      if (i < modernSentences.length) {
        return {
          originalText: originalSentence,
          modernText: modernSentences[i].trim()
        };
      }
    }
  }

  // Fallback: Try fuzzy matching with the modern text
  const originalWords = normalizedSentence.split(/\s+/).filter(w => w.length > 3);
  if (originalWords.length > 0) {
    const searchText = originalWords.slice(0, 3).join(' ');
    const modernIndex = modernText.toLowerCase().indexOf(searchText.toLowerCase());

    if (modernIndex !== -1) {
      // Extract a reasonable portion around the match
      let start = Math.max(0, modernIndex - 50);
      let end = Math.min(modernText.length, modernIndex + 200);

      // Adjust to sentence boundaries
      start = modernText.lastIndexOf('.', start) + 1;
      end = modernText.indexOf('.', end) + 1;

      if (end > start) {
        return {
          originalText: originalSentence,
          modernText: modernText.substring(start, end).trim()
        };
      }
    }
  }

  return null;
}

// Strip HTML tags from text
function stripHtml(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}
