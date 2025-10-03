const FALLBACK_BOOK_CONTENT = import.meta.glob('../data/books/*.json');
const FRANKENSTEIN_COVER = new URL('../assets/covers/frankenstein-placeholder.svg', import.meta.url).href;

// Book metadata
export const BOOKS_METADATA = [
  {
    id: 'frankenstein',
    title: 'Frankenstein',
    subtitle: 'or, The Modern Prometheus',
    author: 'Mary Shelley',
    year: 1818,
    coverImage: FRANKENSTEIN_COVER,
    description: 'The tragic story of Victor Frankenstein, a young scientist who creates a grotesque creature in an unorthodox scientific experiment.'
  }
];

// Get book by ID
export function getBookById(id) {
  return BOOKS_METADATA.find(book => book.id === id);
}

// Load book content
export async function loadBookContent(bookId) {
  const publicUrl = `/data/books/${bookId}.json`;

  try {
    const response = await fetch(publicUrl);
    if (!response.ok) {
      throw new Error(`Failed to load book: ${bookId}`);
    }
    return await response.json();
  } catch (fetchError) {
    console.warn(`Falling back to bundled content for book: ${bookId}`, fetchError);

    const fallbackKey = `../data/books/${bookId}.json`;
    const loader = FALLBACK_BOOK_CONTENT[fallbackKey];

    if (loader) {
      try {
        const module = await loader();
        return module.default;
      } catch (fallbackError) {
        console.error('Error loading fallback book content:', fallbackError);
      }
    }

    console.error('Error loading book content:', fetchError);
    throw fetchError;
  }
}

// Get chapter by ID
export function getChapterById(book, chapterId) {
  if (!book || !book.chapters) return null;
  return book.chapters.find(ch => ch.id === chapterId);
}

// Get chapter index
export function getChapterIndex(book, chapterId) {
  if (!book || !book.chapters) return -1;
  return book.chapters.findIndex(ch => ch.id === chapterId);
}

// Get next chapter
export function getNextChapter(book, currentChapterId) {
  const currentIndex = getChapterIndex(book, currentChapterId);
  if (currentIndex === -1 || currentIndex >= book.chapters.length - 1) {
    return null;
  }
  return book.chapters[currentIndex + 1];
}

// Get previous chapter
export function getPreviousChapter(book, currentChapterId) {
  const currentIndex = getChapterIndex(book, currentChapterId);
  if (currentIndex <= 0) {
    return null;
  }
  return book.chapters[currentIndex - 1];
}

// Process chapter HTML to wrap translatable passages
export function processChapterHtml(html, passages) {
  if (!passages || passages.length === 0) {
    return html;
  }

  let processedHtml = html;
  
  // Sort passages by length (longest first) to avoid partial replacements
  const sortedPassages = [...passages].sort((a, b) => 
    b.originalText.length - a.originalText.length
  );

  sortedPassages.forEach(passage => {
    const text = passage.originalText;
    
    // Simple string replacement - look for the exact text
    // We use a unique marker to avoid double-wrapping
    const marker = `[PASSAGE:${passage.id}]`;
    const replacement = `<span class="translatable-passage" data-passage-id="${passage.id}">${text}</span>`;
    
    // Replace the first occurrence only
    const index = processedHtml.indexOf(text);
    if (index !== -1) {
      processedHtml = 
        processedHtml.substring(0, index) + 
        replacement + 
        processedHtml.substring(index + text.length);
    }
  });

  return processedHtml;
}
