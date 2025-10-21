#!/usr/bin/env node

/**
 * Preprocessing Pipeline for Classic Literature
 *
 * This script processes a book JSON file to:
 * 1. Segment text into paragraphs and sentences with stable IDs
 * 2. Translate classic text to modern English using GPT-5-mini
 * 3. Create alignment mappings between original and modern sentences
 * 4. Generate context windows for each sentence
 * 5. Export structured, translation-ready JSON bundles
 *
 * Usage:
 *   node scripts/preprocess-book.js <book-id> [options]
 *
 * Options:
 *   --input <path>       Input book JSON file (default: public/data/books/<book-id>.json)
 *   --output <path>      Output file (default: public/data/books/<book-id>-processed.json)
 *   --translate          Enable translation using GPT-5-mini (requires OPENAI_API_KEY)
 *   --model <name>       Model to use (default: gpt-5-mini)
 *   --chapters <range>   Process specific chapters (e.g., "1-3" or "1,3,5")
 *   --estimate           Show cost estimate without translating
 *   --dry-run            Process structure without translation
 *
 * Examples:
 *   # Process structure only (no translation)
 *   node scripts/preprocess-book.js frankenstein
 *
 *   # Translate with GPT-5-mini
 *   export OPENAI_API_KEY=your_api_key
 *   node scripts/preprocess-book.js frankenstein --translate
 *
 *   # Estimate costs first
 *   node scripts/preprocess-book.js frankenstein --estimate
 *
 *   # Process specific chapters
 *   node scripts/preprocess-book.js frankenstein --chapters 1-3 --translate
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  processChapter,
  createContextWindow
} from './sentence-segmenter.js';
import {
  translateBatch,
  estimateCost
} from './translation-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node preprocess-book.js <book-id> [options]');
    process.exit(1);
  }

  const config = {
    bookId: args[0],
    input: null,
    output: null,
    translate: false,
    model: 'gpt-5-mini',
    chapters: null,
    estimate: false,
    dryRun: false
  };

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        config.input = args[++i];
        break;
      case '--output':
        config.output = args[++i];
        break;
      case '--translate':
        config.translate = true;
        break;
      case '--model':
        config.model = args[++i];
        break;
      case '--chapters':
        config.chapters = args[++i];
        break;
      case '--estimate':
        config.estimate = true;
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      default:
        console.warn(`Unknown option: ${args[i]}`);
    }
  }

  // Set defaults
  if (!config.input) {
    config.input = path.join(__dirname, '..', 'public', 'data', 'books', `${config.bookId}.json`);
  }

  if (!config.output) {
    config.output = path.join(__dirname, '..', 'public', 'data', 'books', `${config.bookId}-processed.json`);
  }

  return config;
}

/**
 * Parse chapter range (e.g., "1-3" or "1,3,5")
 */
function parseChapterRange(rangeStr, totalChapters) {
  if (!rangeStr) {
    return Array.from({ length: totalChapters }, (_, i) => i);
  }

  if (rangeStr.includes('-')) {
    const [start, end] = rangeStr.split('-').map(Number);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i - 1);
  }

  return rangeStr.split(',').map(n => Number(n) - 1);
}

/**
 * Load book JSON file
 */
function loadBook(inputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const content = fs.readFileSync(inputPath, 'utf8');
  return JSON.parse(content);
}

/**
 * Process chapters into structured format with sentence segmentation
 */
function processBookStructure(book, chapterIndices) {
  const processedChapters = [];
  const metadata = { ...book };
  delete metadata.chapters;

  for (const index of chapterIndices) {
    const chapter = book.chapters[index];

    if (!chapter) {
      console.warn(`Chapter index ${index} not found, skipping`);
      continue;
    }

    console.log(`Processing structure for chapter ${index + 1}: ${chapter.title}`);

    const processed = processChapter(chapter);
    processedChapters.push(processed);
  }

  return {
    metadata,
    chapters: processedChapters
  };
}

/**
 * Prepare sentences for translation with context
 */
function prepareSentencesForTranslation(processedBook) {
  const sentences = [];

  for (const chapter of processedBook.chapters) {
    for (const paragraph of chapter.paragraphs) {
      paragraph.sentences.forEach((sentence, index) => {
        const context = createContextWindow(
          paragraph.sentences,
          index,
          paragraph.text
        );

        sentences.push({
          sid: sentence.sid,
          sentence: sentence.text,
          context,
          chapterId: chapter.chapter_id,
          paragraphId: paragraph.pid
        });
      });
    }
  }

  return sentences;
}

/**
 * Apply translations to processed book structure
 */
function applyTranslations(processedBook, translations) {
  const result = JSON.parse(JSON.stringify(processedBook)); // Deep clone

  for (const chapter of result.chapters) {
    // Create modern paragraphs array
    chapter.modern_paragraphs = [];

    for (const paragraph of chapter.paragraphs) {
      const modernSentences = [];
      let modernText = '';

      for (const sentence of paragraph.sentences) {
        const modernSentence = translations[sentence.sid] || sentence.text;

        modernSentences.push({
          sid: `m_${sentence.sid}`,
          text: modernSentence,
          start: modernText.length,
          end: modernText.length + modernSentence.length
        });

        modernText += (modernText ? ' ' : '') + modernSentence;
      }

      chapter.modern_paragraphs.push({
        pid: `m_${paragraph.pid}`,
        text: modernText,
        sentences: modernSentences
      });
    }

    // Create alignment mapping
    chapter.alignment = {
      original_to_modern: {}
    };

    for (const paragraph of chapter.paragraphs) {
      for (const sentence of paragraph.sentences) {
        chapter.alignment.original_to_modern[sentence.sid] = `m_${sentence.sid}`;
      }
    }
  }

  return result;
}

/**
 * Main processing function
 */
async function main() {
  const config = parseArgs();

  console.log('='.repeat(60));
  console.log('Classic Literature Preprocessing Pipeline');
  console.log('='.repeat(60));
  console.log(`Book ID: ${config.bookId}`);
  console.log(`Input: ${config.input}`);
  console.log(`Output: ${config.output}`);
  console.log(`Model: ${config.model}`);
  console.log('='.repeat(60));

  // Load book
  console.log('\n[1/5] Loading book...');
  const book = loadBook(config.input);
  const bookName = book.title || config.bookId;
  console.log(`Loaded: ${bookName} by ${book.author || 'Unknown'}`);
  console.log(`Chapters: ${book.chapters.length}`);

  // Parse chapter range
  const chapterIndices = parseChapterRange(config.chapters, book.chapters.length);
  console.log(`Processing chapters: ${chapterIndices.map(i => i + 1).join(', ')}`);

  // Process structure
  console.log('\n[2/5] Processing structure (paragraphs & sentences)...');
  const processedBook = processBookStructure(book, chapterIndices);

  let totalParagraphs = 0;
  let totalSentences = 0;

  for (const chapter of processedBook.chapters) {
    totalParagraphs += chapter.paragraphs.length;
    totalSentences += chapter.paragraphs.reduce((sum, p) => sum + p.sentences.length, 0);
  }

  console.log(`Extracted: ${totalParagraphs} paragraphs, ${totalSentences} sentences`);

  // Prepare sentences for translation
  console.log('\n[3/5] Preparing sentences with context windows...');
  const sentencesWithContext = prepareSentencesForTranslation(processedBook);
  console.log(`Prepared ${sentencesWithContext.length} sentences for translation`);

  // Show cost estimate
  if (config.estimate || config.translate) {
    console.log('\n[4/5] Cost Estimation:');
    const avgContextLength = sentencesWithContext.reduce((sum, s) =>
      sum + s.context.paragraph.length, 0
    ) / sentencesWithContext.length;

    const costEstimate = estimateCost(sentencesWithContext.length, avgContextLength);

    console.log(`  Sentences: ${costEstimate.sentenceCount}`);
    console.log(`  Est. Input Tokens: ${costEstimate.estimatedInputTokens.toLocaleString()}`);
    console.log(`  Est. Output Tokens: ${costEstimate.estimatedOutputTokens.toLocaleString()}`);
    console.log(`  Est. Cost: $${costEstimate.estimatedTotalCost}`);
    console.log(`  Note: ${costEstimate.note}`);

    if (config.estimate) {
      console.log('\n✓ Estimate complete (no translation performed)');
      return;
    }
  }

  // Translate
  let finalBook = processedBook;

  if (config.translate && !config.dryRun) {
    console.log('\n[5/5] Translating sentences...');
    console.log('This may take several minutes depending on the number of sentences.');

    const translations = await translateBatch(
      sentencesWithContext,
      bookName,
      {
        model: config.model,
        onProgress: (progress) => {
          const percent = ((progress.current / progress.total) * 100).toFixed(1);
          console.log(
            `[${progress.current}/${progress.total}] (${percent}%) ` +
            `${progress.sid}: "${progress.sentence}..." → "${progress.translation}..."`
          );
        }
      }
    );

    console.log('\n✓ Translation complete!');

    // Apply translations
    finalBook = applyTranslations(processedBook, translations);
  } else {
    console.log('\n[5/5] Skipping translation (use --translate to enable)');
  }

  // Save output
  console.log(`\nSaving to: ${config.output}`);
  fs.writeFileSync(
    config.output,
    JSON.stringify(finalBook, null, 2),
    'utf8'
  );

  console.log('\n' + '='.repeat(60));
  console.log('✓ Processing complete!');
  console.log('='.repeat(60));
  console.log(`Output file: ${config.output}`);
  console.log(`Chapters processed: ${processedBook.chapters.length}`);
  console.log(`Total sentences: ${totalSentences}`);

  if (config.translate && !config.dryRun) {
    console.log('\nTranslations have been applied.');
    console.log('The output file contains both original and modern text with alignment.');
  } else {
    console.log('\nStructure only (no translations).');
    console.log('Run with --translate to generate modern translations.');
  }
}

// Run main function
main().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
