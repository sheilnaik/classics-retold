/**
 * Translation Service
 * Uses GPT-5-mini to translate classic text to modern English with proper context
 */

import OpenAI from 'openai';

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
 * @param {Object} options - Optional parameters (temperature, max_tokens)
 * @returns {Promise<string>} The translated sentence
 */
async function translateSentence(client, sentence, context, bookName, options = {}) {
  const {
    temperature = 0.3, // Lower temperature for more consistent translations
    max_tokens = 500,
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
      ],
      temperature,
      max_tokens
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
 * Translate multiple sentences with rate limiting and progress tracking
 * @param {Array} sentencesWithContext - Array of {sentence, context, sid} objects
 * @param {string} bookName - Name of the book
 * @param {Object} options - Translation options and callbacks
 * @returns {Promise<Object>} Map of sentence IDs to translations
 */
async function translateBatch(sentencesWithContext, bookName, options = {}) {
  const {
    onProgress = () => {},
    batchDelay = 100, // Delay between requests in ms
    retryAttempts = 3,
    retryDelay = 1000,
    ...translationOptions
  } = options;

  const client = createClient();
  const translations = {};
  const total = sentencesWithContext.length;

  for (let i = 0; i < sentencesWithContext.length; i++) {
    const { sentence, context, sid } = sentencesWithContext[i];
    let attempt = 0;
    let success = false;

    while (attempt < retryAttempts && !success) {
      try {
        const translation = await translateSentence(
          client,
          sentence,
          context,
          bookName,
          translationOptions
        );

        translations[sid] = translation;
        success = true;

        onProgress({
          current: i + 1,
          total,
          sid,
          sentence: sentence.substring(0, 80),
          translation: translation.substring(0, 80)
        });

        // Rate limiting delay
        if (i < sentencesWithContext.length - 1) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      } catch (error) {
        attempt++;
        if (attempt < retryAttempts) {
          console.warn(`Retry ${attempt}/${retryAttempts} for sentence ${sid}`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          console.error(`Failed to translate sentence ${sid} after ${retryAttempts} attempts`);
          translations[sid] = `[Translation failed: ${error.message}]`;
        }
      }
    }
  }

  return translations;
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
  translateSentence,
  translateBatch,
  estimateCost
};
