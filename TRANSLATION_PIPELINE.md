# Translation Pipeline Guide

This guide explains how to use the automated translation pipeline to convert classic literature into modern English using GPT-5-mini with proper context awareness.

## Overview

The translation pipeline provides:

1. **Sentence Segmentation**: Deterministic splitting of paragraphs into sentences with stable IDs
2. **Context Windows**: Each sentence is translated with paragraph-level context
3. **Book-Aware Translation**: Prompts include the book name for better quality
4. **Alignment Mapping**: Creates mappings between original and modern sentences
5. **Structured Output**: Generates JSON bundles ready for the app to consume

## Architecture

```
Classic Text (HTML) → Sentence Segmenter → Translation Service → Aligned JSON
                          ↓                       ↓
                    Stable IDs              GPT-5-mini with
                    Offsets                 Paragraph Context
                    Paragraphs              Book Name
```

### Data Flow

1. **Input**: Book JSON with chapters containing HTML `<p>` tags
2. **Processing**:
   - Extract paragraphs from HTML
   - Segment each paragraph into sentences
   - Assign stable IDs: `{chapter_id}_p{N}_s{M}`
   - Create context windows (paragraph + neighboring sentences)
3. **Translation**:
   - Build context-aware prompts
   - Call GPT-5-mini for each sentence
   - Include book name and full paragraph context
4. **Output**: Structured JSON with original, modern, and alignment data

## Setup

### 1. Install Dependencies

```bash
npm install
```

This installs the `openai` package (version 4.73.0+) required for translation.

### 2. Configure API Key

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

Get your API key from: https://platform.openai.com/api-keys

**Important**: The `.env` file is gitignored and will not be committed.

### 3. Verify Setup

```bash
node scripts/preprocess-book.js --help
```

## Usage

### Basic Structure Processing (No Translation)

Process the book structure without calling the translation API:

```bash
npm run preprocess frankenstein
```

This creates:
- Paragraph and sentence segmentation
- Stable IDs for all text elements
- Character offsets for each sentence
- Output: `public/data/books/frankenstein-processed.json`

### Cost Estimation

Before running translation, estimate the cost:

```bash
npm run preprocess frankenstein -- --estimate
```

Example output:
```
Cost Estimation:
  Sentences: 450
  Est. Input Tokens: 45,000
  Est. Output Tokens: 22,500
  Est. Cost: $0.0675
```

### Full Translation

Translate the entire book using GPT-5-mini:

```bash
export OPENAI_API_KEY=sk-your-key-here
npm run preprocess frankenstein -- --translate
```

Progress will be displayed in real-time:
```
[1/450] (0.2%) letter-1_p1_s1: "It is a truth..." → "Everyone generally agrees..."
[2/450] (0.4%) letter-1_p1_s2: "That a single man..." → "A wealthy single man..."
...
```

### Translate Specific Chapters

Process only chapters 1-3:

```bash
npm run preprocess frankenstein -- --chapters 1-3 --translate
```

Or specific chapter numbers:

```bash
npm run preprocess frankenstein -- --chapters 1,3,5 --translate
```

### Custom Input/Output Files

```bash
npm run preprocess mybook -- \
  --input /path/to/input.json \
  --output /path/to/output.json \
  --translate
```

### Use Alternative Model

For testing, you can use gpt-4o-mini instead:

```bash
npm run preprocess frankenstein -- --translate --model gpt-4o-mini
```

## Output Format

The processed JSON follows this structure:

```json
{
  "metadata": {
    "id": "frankenstein",
    "title": "Frankenstein",
    "author": "Mary Shelley"
  },
  "chapters": [
    {
      "chapter_id": "letter-1",
      "title": "Letter 1",
      "paragraphs": [
        {
          "pid": "letter-1_p1",
          "text": "Original paragraph text...",
          "sentences": [
            {
              "sid": "letter-1_p1_s1",
              "text": "Original sentence.",
              "start": 0,
              "end": 19
            }
          ]
        }
      ],
      "modern_paragraphs": [
        {
          "pid": "m_letter-1_p1",
          "text": "Modern paragraph text...",
          "sentences": [
            {
              "sid": "m_letter-1_p1_s1",
              "text": "Modern sentence.",
              "start": 0,
              "end": 16
            }
          ]
        }
      ],
      "alignment": {
        "original_to_modern": {
          "letter-1_p1_s1": "m_letter-1_p1_s1"
        }
      }
    }
  ]
}
```

### Key Fields

- **pid**: Paragraph ID (e.g., `chapter-1_p5`)
- **sid**: Sentence ID (e.g., `chapter-1_p5_s3`)
- **start/end**: Character offsets within the paragraph
- **alignment**: Maps original sentence IDs to modern sentence IDs
- **modern_paragraphs**: Translated versions with same structure

## Translation Prompt

Each sentence is translated with this context:

```
You are translating classic literature to modern English.
You are currently working on "{Book Name}".

CONTEXT - Full Paragraph:
"{full paragraph text}"

CONTEXT - Previous Sentence:
"{previous sentence if exists}"

SENTENCE TO TRANSLATE:
"{target sentence}"

CONTEXT - Next Sentence:
"{next sentence if exists}"
```

This ensures:
- Proper interpretation of archaic phrasing
- Contextual understanding of pronouns and references
- Appropriate tone matching
- Better handling of complex sentence structures

## Components

### 1. Sentence Segmenter (`scripts/sentence-segmenter.js`)

Handles:
- Normalization of quotes, dashes, whitespace
- Abbreviation detection (Mr., Dr., etc.)
- Deterministic sentence splitting
- Stable ID generation
- Character offset tracking

Functions:
- `normalizeText(text)` - Standardize quotes and whitespace
- `segmentParagraph(paragraphText, paragraphId)` - Split into sentences
- `extractParagraphsFromHTML(htmlContent)` - Extract from HTML
- `processChapter(chapter)` - Process entire chapter
- `createContextWindow(sentences, index, paragraphText)` - Build context

### 2. Translation Service (`scripts/translation-service.js`)

Handles:
- OpenAI client initialization
- Context-aware prompt building
- GPT-5-mini API calls
- Batch translation with rate limiting
- Retry logic for failed requests
- Cost estimation

Functions:
- `createClient()` - Initialize OpenAI client
- `buildTranslationPrompt(sentence, context, bookName)` - Create prompt
- `translateSentence(client, sentence, context, bookName, options)` - Translate one
- `translateBatch(sentencesWithContext, bookName, options)` - Translate many
- `estimateCost(sentenceCount, avgContextLength)` - Estimate API cost

### 3. Preprocessing Pipeline (`scripts/preprocess-book.js`)

Main orchestrator that:
- Loads book JSON files
- Calls sentence segmenter
- Prepares context windows
- Runs translation service
- Creates alignment mappings
- Saves structured output

## Best Practices

### 1. Start Small

Test with a single chapter first:

```bash
npm run preprocess frankenstein -- --chapters 1 --estimate
npm run preprocess frankenstein -- --chapters 1 --translate
```

### 2. Review Output

Check the quality of translations before processing the entire book:

```bash
# Process chapter 1
npm run preprocess frankenstein -- --chapters 1 --translate

# Review the output
cat public/data/books/frankenstein-processed.json | jq '.chapters[0].modern_paragraphs[0]'
```

### 3. Monitor Costs

Always run `--estimate` before `--translate` to avoid unexpected API charges.

### 4. Use Rate Limiting

The default batch delay is 100ms between requests. For large books, this prevents rate limiting:

```javascript
// In translation-service.js
{
  batchDelay: 100,  // Milliseconds between API calls
  retryAttempts: 3, // Retry failed requests
  retryDelay: 1000  // Wait 1s before retry
}
```

### 5. Version Control

Keep original files separate from processed files:

```
public/data/books/
  frankenstein.json           # Original (committed)
  frankenstein-processed.json # Processed (committed after review)
```

## Troubleshooting

### API Key Not Found

```
Error: OPENAI_API_KEY environment variable is required
```

**Solution**: Set the environment variable:
```bash
export OPENAI_API_KEY=sk-your-key-here
```

Or create a `.env` file with your key.

### Rate Limiting Errors

```
Translation error: Rate limit exceeded
```

**Solution**: Increase the batch delay:
```javascript
// Edit scripts/preprocess-book.js
const translations = await translateBatch(sentencesWithContext, bookName, {
  batchDelay: 500  // Increase from 100ms to 500ms
});
```

### Model Not Found

```
Error: Model gpt-5-mini not found
```

**Solution**: Use an alternative model:
```bash
npm run preprocess frankenstein -- --translate --model gpt-4o-mini
```

### Out of Memory

For very large books (1000+ pages):

**Solution**: Process chapters in batches:
```bash
npm run preprocess frankenstein -- --chapters 1-10 --translate
npm run preprocess frankenstein -- --chapters 11-20 --translate
# Manually merge the results
```

## Cost Management

### Typical Costs (GPT-5-mini)

Based on approximate pricing of $0.10/1M input tokens and $0.30/1M output tokens:

| Book Size | Sentences | Est. Cost |
|-----------|-----------|-----------|
| Short (100 pages) | ~2,000 | ~$0.30 |
| Medium (300 pages) | ~6,000 | ~$0.90 |
| Long (600 pages) | ~12,000 | ~$1.80 |

**Note**: These are estimates. Actual costs depend on paragraph length and model pricing.

### Minimize Costs

1. **Start with estimation**: Always use `--estimate` first
2. **Process selectively**: Use `--chapters` to process incrementally
3. **Review quality early**: Process 1-2 chapters to verify quality before full translation
4. **Use caching**: Don't re-translate already processed chapters

## Integration with App

### Using Processed Books

The app needs to be updated to use the new format. The processed JSON includes both original and modern text with alignment, making it easy to:

1. Toggle between original and modern at sentence level
2. Highlight passages and show context-aware translations
3. Navigate with consistent IDs across versions

### Migration Path

1. Process existing books with the pipeline
2. Update app to recognize the new format
3. Maintain backward compatibility with old format (optional)

## Examples

### Example 1: Process Structure Only

```bash
# See the segmentation without translating
npm run preprocess frankenstein

# Output shows:
# - 3 chapters processed
# - 45 paragraphs extracted
# - 450 sentences segmented
# - No translation performed
```

### Example 2: Estimate and Translate First Chapter

```bash
# Estimate cost
npm run preprocess frankenstein -- --chapters 1 --estimate

# Output:
# Sentences: 150
# Est. Cost: $0.0225

# Translate
npm run preprocess frankenstein -- --chapters 1 --translate
```

### Example 3: Full Book Translation

```bash
# Set API key
export OPENAI_API_KEY=sk-xxx

# Estimate full book
npm run preprocess frankenstein -- --estimate

# Review estimate, then translate
npm run preprocess frankenstein -- --translate

# Output: frankenstein-processed.json with all translations
```

## Next Steps

1. **Test the pipeline**: Start with a small test (1 chapter)
2. **Review quality**: Check if translations meet your standards
3. **Adjust prompts**: Modify `buildTranslationPrompt()` if needed
4. **Process books**: Run full translation on your library
5. **Update app**: Integrate the new format into the reader

## Support

For issues or questions:
- Check this documentation
- Review the code comments in the scripts
- Test with `--dry-run` or `--estimate` flags first
- Monitor API usage on OpenAI dashboard

## License

Same as the main project.
