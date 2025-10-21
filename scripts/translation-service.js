/**
 * Translation Service
 * Uses GPT-5-mini to translate classic text to modern English with proper context
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

/**
 * Initialize OpenAI client
 * API key should be set in OPENAI_API_KEY environment variable
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
 * Build the translation prompt with full context
 * @param {string} sentence - The sentence to translate
 * @param {Object} context - Context object with paragraph and neighboring sentences
 * @param {string} bookName - Name of the book being translated
 * @returns {string} Formatted prompt for GPT-5-mini
 */
function buildTranslationPrompt(sentence, context, bookName) {
  const prompt = `You are translating classic literature to modern English. You are currently working on "${bookName}".

Your task is to translate the following sentence from classic/archaic English into clear, modern English while preserving:
- The original meaning and nuance
- Literary quality and tone
- Cultural and historical context
- Character voice and style

CONTEXT - Full Paragraph:
"${context.paragraph}"

${context.prev_sentence ? `CONTEXT - Previous Sentence:\n"${context.prev_sentence}"\n` : ''}
SENTENCE TO TRANSLATE:
"${sentence}"
${context.next_sentence ? `\nCONTEXT - Next Sentence:\n"${context.next_sentence}"` : ''}

Guidelines:
1. Modernize archaic vocabulary and phrasing
2. Simplify complex sentence structures if needed for clarity
3. Keep the same emotional tone and literary style
4. Use the paragraph context to ensure accurate interpretation
5. Preserve any proper nouns, character names, and place names
6. Maintain the approximate sentence length

Provide ONLY the modern English translation, without any explanation or commentary.`;

  return prompt;
}

/**
 * Translate a single sentence using GPT-5-mini
 * @param {Object} client - OpenAI client instance
 * @param {string} sentence - The sentence to translate
 * @param {Object} context - Context object
 * @param {string} bookName - Name of the book
 * @param {Object} options - Optional parameters (model)
 * @returns {Promise<string>} The translated sentence
 */
async function translateSentence(client, sentence, context, bookName, options = {}) {
  const {
    model = 'gpt-5-mini' // Can be overridden for testing with gpt-4o-mini
  } = options;

  const prompt = buildTranslationPrompt(sentence, context, bookName);

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
      ]
    });

    const translation = response.choices[0].message.content.trim();

    // Remove any quotes that the model might add
    return translation.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error(`Translation error for sentence: "${sentence.substring(0, 50)}..."`, error);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

/**
 * Build a batch translation prompt for multiple sentences at once
 * This dramatically reduces API calls by translating 5-10 sentences per request
 * @param {Array} sentences - Array of {sentence, context, sid} objects (max 10)
 * @param {string} bookName - Name of the book being translated
 * @returns {string} Formatted prompt for GPT-5-mini
 */
function buildBatchTranslationPrompt(sentences, bookName) {
  const sentenceList = sentences
    .map((item, idx) => `${idx + 1}. "${item.sentence}"`)
    .join('\n');

  const contextInfo = sentences
    .slice(0, 3) // Use context from first 3 sentences to save tokens
    .map(item => `- ${item.context.paragraph.substring(0, 200)}...`)
    .join('\n');

  const prompt = `You are translating classic literature to modern English. You are currently working on "${bookName}".

Your task is to translate the following sentences from classic/archaic English into clear, modern English while preserving:
- The original meaning and nuance
- Literary quality and tone
- Cultural and historical context
- Character voice and style

CONTEXT - Sample Paragraphs:
${contextInfo}

SENTENCES TO TRANSLATE:
${sentenceList}

Guidelines:
1. Modernize archaic vocabulary and phrasing
2. Simplify complex sentence structures if needed for clarity
3. Keep the same emotional tone and literary style
4. Preserve any proper nouns, character names, and place names
5. Maintain the approximate sentence length

IMPORTANT: Return ONLY a JSON object with translations, like this:
{
  "1": "Modern translation of first sentence",
  "2": "Modern translation of second sentence",
  "3": "Modern translation of third sentence"
}

Do not include any other text or explanation.`;

  return prompt;
}

/**
 * Translate multiple sentences in a single API call (batch mode)
 * This is much faster than translating one-by-one
 * @param {Object} client - OpenAI client instance
 * @param {Array} sentenceBatch - Array of {sentence, context, sid} objects (max 10)
 * @param {string} bookName - Name of the book
 * @param {Object} options - Optional parameters (model, retryAttempts)
 * @returns {Promise<Object>} Map of sentence IDs to translations
 */
async function translateBatchGroup(client, sentenceBatch, bookName, options = {}) {
  const {
    model = 'gpt-5-mini',
    retryAttempts = 2
  } = options;

  const prompt = buildBatchTranslationPrompt(sentenceBatch, bookName);
  let lastError = null;

  for (let attempt = 0; attempt < retryAttempts; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert translator specializing in modernizing classic literature while preserving literary quality and meaning. Return ONLY valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0].message.content.trim();

      // Parse JSON response
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        // If JSON parsing fails, try extracting JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not extract JSON from response');
        }
      }

      // Map back to sentence IDs
      const translations = {};
      sentenceBatch.forEach((item, idx) => {
        const key = (idx + 1).toString();
        translations[item.sid] = parsed[key] || `[Translation failed for index ${idx}]`;
      });

      return translations;
    } catch (error) {
      lastError = error;
      if (attempt < retryAttempts - 1) {
        // Exponential backoff on retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
      }
    }
  }

  throw lastError || new Error('Batch translation failed');
}

/**
 * Translate multiple sentences with batching and parallel processing
 * Groups sentences into batches of 10 and sends requests in parallel
 * @param {Array} sentencesWithContext - Array of {sentence, context, sid} objects
 * @param {string} bookName - Name of the book
 * @param {Object} options - Translation options and callbacks
 * @returns {Promise<Object>} Map of sentence IDs to translations
 */
async function translateBatch(sentencesWithContext, bookName, options = {}) {
  const {
    onProgress = () => {},
    batchSize = 10, // Number of sentences per API call (was 1, now 10x faster)
    maxParallel = 3, // Number of parallel requests
    ...translationOptions
  } = options;

  const client = createClient();
  const translations = {};
  const total = sentencesWithContext.length;
  let processedCount = 0;

  // Split into groups of batchSize
  const batches = [];
  for (let i = 0; i < sentencesWithContext.length; i += batchSize) {
    batches.push(sentencesWithContext.slice(i, i + batchSize));
  }

  console.log(`Processing ${total} sentences in ${batches.length} batches of ${batchSize}...`);
  console.log(`Speed improvement: ~${Math.round((total / batches.length))}x fewer API calls`);

  // Process batches in parallel (max maxParallel at a time)
  for (let b = 0; b < batches.length; b += maxParallel) {
    const parallelBatches = batches.slice(b, b + maxParallel);

    const batchPromises = parallelBatches.map(batch =>
      translateBatchGroup(client, batch, bookName, translationOptions)
        .then(batchResults => {
          // Update translations and progress
          Object.assign(translations, batchResults);

          batch.forEach(item => {
            processedCount++;
            const translation = translations[item.sid] || '';
            onProgress({
              current: processedCount,
              total,
              sid: item.sid,
              sentence: item.sentence.substring(0, 80),
              translation: translation.substring(0, 80)
            });
          });

          return batchResults;
        })
        .catch(error => {
          // Handle batch errors gracefully
          batch.forEach(item => {
            processedCount++;
            translations[item.sid] = `[Translation failed: ${error.message}]`;
            onProgress({
              current: processedCount,
              total,
              sid: item.sid,
              sentence: item.sentence.substring(0, 80),
              translation: `[Failed: ${error.message.substring(0, 40)}]`
            });
          });
          throw error;
        })
    );

    // Wait for all parallel requests to complete before starting next batch
    await Promise.allSettled(batchPromises);
  }

  return translations;
}

/**
 * Get the cache file path for a book
 * @param {string} bookId - Book identifier
 * @returns {string} Path to cache file
 */
function getCachePath(bookId) {
  return path.join(process.cwd(), '.translation-cache', `${bookId}.json`);
}

/**
 * Load translations from cache
 * @param {string} bookId - Book identifier
 * @returns {Object} Cached translations or empty object
 */
function loadTranslationCache(bookId) {
  const cachePath = getCachePath(bookId);
  try {
    if (fs.existsSync(cachePath)) {
      const data = fs.readFileSync(cachePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn(`Warning: Could not load translation cache for ${bookId}:`, error.message);
  }
  return {};
}

/**
 * Save translations to cache
 * @param {string} bookId - Book identifier
 * @param {Object} translations - Map of sentence IDs to translations
 */
function saveTranslationCache(bookId, translations) {
  try {
    const cacheDir = path.join(process.cwd(), '.translation-cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    const cachePath = getCachePath(bookId);
    fs.writeFileSync(cachePath, JSON.stringify(translations, null, 2));
    console.log(`Translation cache saved for ${bookId}`);
  } catch (error) {
    console.warn(`Warning: Could not save translation cache for ${bookId}:`, error.message);
  }
}

/**
 * Filter out already-translated sentences
 * @param {Array} sentences - Array of {sentence, context, sid} objects
 * @param {Object} cache - Cached translations
 * @returns {Array} Sentences that need translation
 */
function filterCachedSentences(sentences, cache) {
  return sentences.filter(item => !cache[item.sid]);
}

/**
 * Estimate cost for translating a batch of sentences
 * Pricing as of GPT-5-mini (approximate, check current pricing)
 * @param {number} sentenceCount - Number of sentences to translate
 * @param {number} avgContextLength - Average context length in characters
 * @returns {Object} Cost estimation
 */
function estimateCost(sentenceCount, avgContextLength = 500) {
  // Rough estimates - adjust based on actual GPT-5-mini pricing
  const avgInputTokens = Math.ceil(avgContextLength / 4); // ~4 chars per token
  const avgOutputTokens = 100; // Estimated output per sentence

  const inputCostPer1M = 0.10; // $0.10 per 1M input tokens (example)
  const outputCostPer1M = 0.30; // $0.30 per 1M output tokens (example)

  const totalInputTokens = sentenceCount * avgInputTokens;
  const totalOutputTokens = sentenceCount * avgOutputTokens;

  const inputCost = (totalInputTokens / 1_000_000) * inputCostPer1M;
  const outputCost = (totalOutputTokens / 1_000_000) * outputCostPer1M;

  return {
    sentenceCount,
    estimatedInputTokens: totalInputTokens,
    estimatedOutputTokens: totalOutputTokens,
    estimatedInputCost: inputCost.toFixed(4),
    estimatedOutputCost: outputCost.toFixed(4),
    estimatedTotalCost: (inputCost + outputCost).toFixed(4),
    note: 'These are estimates. Actual costs may vary based on current API pricing.'
  };
}

export {
  createClient,
  buildTranslationPrompt,
  buildBatchTranslationPrompt,
  translateSentence,
  translateBatchGroup,
  translateBatch,
  loadTranslationCache,
  saveTranslationCache,
  filterCachedSentences,
  getCachePath,
  estimateCost
};
