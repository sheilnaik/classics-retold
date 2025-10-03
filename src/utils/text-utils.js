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
