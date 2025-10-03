/**
 * Script to generate modern retellings for book chapters
 * This is a template - you'll need to add your own retelling content or integrate with an LLM API
 * Usage: node scripts/generate-retellings.js <book-id>
 */

import fs from 'fs/promises';
import path from 'path';

async function generateRetellings(bookId) {
  console.log(`Generating modern retellings for: ${bookId}`);
  
  const bookPath = path.join(process.cwd(), 'public', 'data', 'books', `${bookId}.json`);
  
  try {
    const bookData = JSON.parse(await fs.readFile(bookPath, 'utf-8'));
    
    console.log(`Found ${bookData.chapters.length} chapters`);
    console.log('\nNOTE: This script generates placeholder text.');
    console.log('You should either:');
    console.log('1. Manually write modern retellings for each chapter');
    console.log('2. Integrate with an LLM API (OpenAI, Anthropic, etc.) to generate them');
    console.log('3. Use pre-written modern translations\n');
    
    // Example: Generate placeholder passages
    for (const chapter of bookData.chapters) {
      // Extract paragraphs from original HTML
      const paragraphs = extractParagraphs(chapter.original);
      
      if (paragraphs.length > 0) {
        chapter.passages = paragraphs.slice(0, 5).map((p, i) => ({
          id: `${chapter.id}-passage-${i + 1}`,
          originalText: p.text,
          modernText: `[Modern translation needed for: "${p.text.substring(0, 50)}..."]`,
          context: p.html
        }));
      }
    }
    
    await fs.writeFile(bookPath, JSON.stringify(bookData, null, 2));
    console.log(`✓ Updated ${bookPath} with passage placeholders`);
    console.log('\nNext: Edit the JSON file to add actual modern retellings');
    
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
  
  if (!bookId) {
    console.error('Usage: node generate-retellings.js <book-id>');
    console.error('Example: node generate-retellings.js frankenstein');
    process.exit(1);
  }
  
  generateRetellings(bookId);
}

export { generateRetellings };
