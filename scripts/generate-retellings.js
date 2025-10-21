/**
 * Script to generate modern retellings for book chapters with optimized batch translation
 * Uses GPT-5-mini with batching, parallel processing, and caching for speed
 * Usage: node scripts/generate-retellings.js <book-id> [--skip-cache]
 */

import fs from 'fs/promises';
import path from 'path';
import {
  translateBatch,
  loadTranslationCache,
  saveTranslationCache,
  filterCachedSentences
} from './translation-service.js';

async function generateRetellings(bookId, options = {}) {
  const { skipCache = false } = options;

  console.log(`\n📖 Generating modern retellings for: ${bookId}`);
  console.log('Using optimized batch translation with GPT-5-mini\n');

  const bookPath = path.join(process.cwd(), 'public', 'data', 'books', `${bookId}.json`);

  try {
    const bookData = JSON.parse(await fs.readFile(bookPath, 'utf-8'));

    console.log(`Found ${bookData.chapters.length} chapters`);

    // Load translation cache
    let translationCache = {};
    if (!skipCache) {
      translationCache = loadTranslationCache(bookId);
      const cacheSize = Object.keys(translationCache).length;
      if (cacheSize > 0) {
        console.log(`✓ Loaded ${cacheSize} cached translations\n`);
      }
    }

    // Extract all passages that need translation
    let sentencesToTranslate = [];
    const passageMap = {}; // Map sid -> { chapter, passage, index }

    for (const chapter of bookData.chapters) {
      const paragraphs = extractParagraphs(chapter.original);

      if (paragraphs.length > 0) {
        chapter.passages = paragraphs.slice(0, 5).map((p, i) => {
          const sid = `${chapter.id}-passage-${i + 1}`;
          const passage = {
            id: sid,
            originalText: p.text,
            modernText: translationCache[sid] || '[Translating...]',
            context: p.html
          };

          // Only translate if not cached
          if (!translationCache[sid]) {
            sentencesToTranslate.push({
              sentence: p.text,
              context: {
                paragraph: p.text,
                prev_sentence: paragraphs[i - 1]?.text || '',
                next_sentence: paragraphs[i + 1]?.text || ''
              },
              sid: sid
            });
            passageMap[sid] = { chapter, passage, index: i };
          }

          return passage;
        });
      }
    }

    // Translate in batches with caching
    if (sentencesToTranslate.length > 0) {
      console.log(`🔄 Translating ${sentencesToTranslate.length} new passages...`);
      console.log(`(${Object.keys(translationCache).length} already cached)\n`);

      const translations = await translateBatch(
        sentencesToTranslate,
        bookData.title || bookId,
        {
          onProgress: (progress) => {
            if (progress.current % 10 === 0 || progress.current === progress.total) {
              const percent = Math.round((progress.current / progress.total) * 100);
              process.stdout.write(`\r  Progress: ${progress.current}/${progress.total} (${percent}%)`);
            }
          },
          batchSize: 10,      // 10x faster than 1-by-1
          maxParallel: 3      // 3 parallel requests
        }
      );

      console.log('\n');

      // Update passages with translations
      for (const sid in translations) {
        translationCache[sid] = translations[sid];
        if (passageMap[sid]) {
          const { chapter, index } = passageMap[sid];
          chapter.passages[index].modernText = translations[sid];
        }
      }

      // Save updated cache
      saveTranslationCache(bookId, translationCache);
    } else {
      console.log('✓ All passages already cached!\n');
    }

    // Save updated book data
    await fs.writeFile(bookPath, JSON.stringify(bookData, null, 2));
    console.log(`✓ Updated ${bookPath}`);
    console.log(`✓ Generated ${bookData.chapters.reduce((sum, c) => sum + (c.passages?.length || 0), 0)} passages with translations\n`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

function extractParagraphs(html) {
  // Simple regex-based paragraph extraction
  const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi;
  const matches = [];
  let match;
  
  while ((match = paragraphRegex.exec(html)) !== null) {
    const text = match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (text.length > 50) { // Only include substantial paragraphs
      matches.push({
        html: match[0],
        text: text
      });
    }
  }
  
  return matches;
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const bookId = process.argv[2];
  const skipCache = process.argv.includes('--skip-cache');

  if (!bookId) {
    console.error('Usage: node generate-retellings.js <book-id> [--skip-cache]');
    console.error('Example: node generate-retellings.js frankenstein');
    console.error('Example: node generate-retellings.js frankenstein --skip-cache');
    process.exit(1);
  }

  generateRetellings(bookId, { skipCache }).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { generateRetellings };
