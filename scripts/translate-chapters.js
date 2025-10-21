/**
 * Script to translate full chapters from classic to modern English
 * Updates the 'modern' field in book JSON files
 * Usage: node scripts/translate-chapters.js <book-id> [--skip-cache]
 */

import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';

/**
 * Initialize OpenAI client
 */
function createClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable is required. ' +
      'Set it with: export OPENAI_API_KEY=your_api_key'
    );
  }

  return new OpenAI({ apiKey });
}

/**
 * Strip HTML tags but preserve basic structure
 */
function stripHtmlTags(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build prompt for translating a full chapter
 */
function buildChapterTranslationPrompt(chapterHtml, chapterTitle, bookName) {
  const plainText = stripHtmlTags(chapterHtml);

  return `You are translating a classic literature chapter to modern English. You are working on "${bookName}".

Chapter Title: "${chapterTitle}"

Please translate the following chapter from classic/archaic English into clear, modern English while preserving:
- The original meaning and nuance
- Literary quality and tone
- Cultural and historical context
- Character voice and style
- Paragraph structure and breaks

CHAPTER TEXT:
${plainText}

Guidelines:
1. Modernize archaic vocabulary and phrasing
2. Simplify complex sentence structures if needed for clarity
3. Keep the same emotional tone and literary style
4. Preserve any proper nouns, character names, and place names
5. Maintain paragraph breaks
6. Do NOT include HTML tags in your response - just plain text

Provide ONLY the modernized chapter text with proper paragraph breaks (use double newlines between paragraphs). No explanations or commentary.`;
}

/**
 * Translate a full chapter
 */
async function translateChapter(client, chapterHtml, chapterTitle, bookName, options = {}) {
  const { model = 'gpt-4o-mini' } = options; // Using gpt-4o-mini as gpt-5-mini may not be available yet

  const prompt = buildChapterTranslationPrompt(chapterHtml, chapterTitle, bookName);

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert translator specializing in modernizing classic literature while preserving literary quality and meaning.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const translation = response.choices[0].message.content.trim();
    return translation;
  } catch (error) {
    console.error(`Translation error for chapter "${chapterTitle}":`, error.message);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

/**
 * Convert plain text to HTML with paragraph preservation
 */
function textToHtml(text) {
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  const htmlParagraphs = paragraphs.map(p => `<p>${p.trim()}</p>`);
  return htmlParagraphs.join('\n');
}

/**
 * Get cache file path for translations
 */
function getCachePath(bookId) {
  return path.join(process.cwd(), '.chapter-translation-cache', `${bookId}.json`);
}

/**
 * Load chapter translations from cache
 */
function loadChapterCache(bookId) {
  const cachePath = getCachePath(bookId);
  try {
    if (fs.existsSync(cachePath)) {
      const data = fs.readFileSync(cachePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn(`Warning: Could not load cache for ${bookId}:`, error.message);
  }
  return {};
}

/**
 * Save chapter translations to cache
 */
function saveChapterCache(bookId, cache) {
  try {
    const cacheDir = path.join(process.cwd(), '.chapter-translation-cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    const cachePath = getCachePath(bookId);
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
    console.log(`✓ Cache saved for ${bookId}`);
  } catch (error) {
    console.warn(`Warning: Could not save cache for ${bookId}:`, error.message);
  }
}

/**
 * Main function to translate all chapters
 */
async function translateAllChapters(bookId, options = {}) {
  const { skipCache = false } = options;

  console.log(`\n📖 Translating chapters for: ${bookId}`);
  console.log('Translating full chapter content to modern English\n');

  const bookPath = path.join(process.cwd(), 'public', 'data', 'books', `${bookId}.json`);

  try {
    const bookData = JSON.parse(await fs.readFile(bookPath, 'utf-8'));
    const client = createClient();

    console.log(`Found ${bookData.chapters.length} chapters\n`);

    // Load cache
    let chapterCache = {};
    if (!skipCache) {
      chapterCache = loadChapterCache(bookId);
      const cacheSize = Object.keys(chapterCache).length;
      if (cacheSize > 0) {
        console.log(`✓ Loaded ${cacheSize} cached chapter translations\n`);
      }
    }

    // Track which chapters need translation
    const chaptersToTranslate = [];
    for (const chapter of bookData.chapters) {
      if (skipCache || !chapterCache[chapter.id] || chapterCache[chapter.id] === chapter.modern) {
        // Only translate if not cached or if it's still the placeholder
        if (chapter.modern && chapter.modern.includes('Modern retelling')) {
          chaptersToTranslate.push(chapter);
        }
      }
    }

    if (chaptersToTranslate.length === 0) {
      console.log('✓ All chapters already translated!\n');
      return;
    }

    console.log(`🔄 Translating ${chaptersToTranslate.length} chapters...\n`);

    // Translate each chapter
    let translatedCount = 0;
    for (const chapter of chaptersToTranslate) {
      translatedCount++;
      const percent = Math.round((translatedCount / chaptersToTranslate.length) * 100);

      process.stdout.write(`  [${translatedCount}/${chaptersToTranslate.length}] (${percent}%) Translating "${chapter.title}"...`);

      try {
        const modernText = await translateChapter(
          client,
          chapter.original,
          chapter.title,
          bookData.title || bookId,
          { model: 'gpt-4o-mini' }
        );

        // Convert to HTML format
        const modernHtml = textToHtml(modernText);

        // Update chapter and cache
        chapter.modern = modernHtml;
        chapterCache[chapter.id] = modernHtml;

        console.log(' ✓');

        // Add a small delay between requests to avoid rate limiting
        if (translatedCount < chaptersToTranslate.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.log(` ✗ (Error: ${error.message})`);
        // Keep the placeholder on error
      }
    }

    console.log('\n');

    // Save updated cache
    saveChapterCache(bookId, chapterCache);

    // Save updated book data
    await fs.writeFile(bookPath, JSON.stringify(bookData, null, 2));
    console.log(`✓ Updated ${bookPath}`);
    console.log(`✓ Translated ${translatedCount} chapters\n`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const bookId = process.argv[2];
  const skipCache = process.argv.includes('--skip-cache');

  if (!bookId) {
    console.error('Usage: node translate-chapters.js <book-id> [--skip-cache]');
    console.error('Example: node translate-chapters.js frankenstein');
    console.error('Example: node translate-chapters.js frankenstein --skip-cache');
    process.exit(1);
  }

  translateAllChapters(bookId, { skipCache }).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { translateAllChapters };
