import pkg from 'epub2';
const { EPub } = pkg;
import fs from 'fs/promises';
import path from 'path';
import { JSDOM } from 'jsdom';

/**
 * Process an EPUB file and convert it to JSON format
 * Usage: node scripts/process-epub.js <epub-file-path> <book-id> [options]
 * Options:
 *   --skip-first=N        Skip the first N chapters
 *   --skip-last=N         Skip the last N chapters
 *   --exclude-titles=...  Skip chapters with titles matching patterns (comma-separated)
 */

async function processEPUB(epubPath, bookId, options = {}) {
  console.log(`Processing EPUB: ${epubPath}`);
  
  const skipFirst = options.skipFirst || 0;
  const skipLast = options.skipLast || 0;
  const excludeTitles = options.excludeTitles || [];
  
  if (skipFirst > 0) {
    console.log(`  Skipping first ${skipFirst} chapters`);
  }
  if (skipLast > 0) {
    console.log(`  Skipping last ${skipLast} chapters`);
  }
  if (excludeTitles.length > 0) {
    console.log(`  Excluding chapters matching: ${excludeTitles.join(', ')}`);
  }
  
  return new Promise((resolve, reject) => {
    const epub = new EPub(epubPath);
    
    epub.on('end', async () => {
      try {
        const chapters = [];
        
        // Get the spine (reading order)
        const spine = epub.flow;
        
        for (let i = 0; i < spine.length; i++) {
          const item = spine[i];
          
          // Check if we should skip this chapter
          if (i < skipFirst) {
            console.log(`  Skipping chapter ${i + 1}: ${item.title || 'Untitled'} (index < ${skipFirst})`);
            continue;
          }
          
          // Check if we should skip this chapter from the end
          if (i >= spine.length - skipLast) {
            console.log(`  Skipping chapter ${i + 1}: ${item.title || 'Untitled'} (index >= ${spine.length - skipLast})`);
            continue;
          }
          
          // Check if title matches exclusion patterns
          const shouldExclude = excludeTitles.some(pattern => {
            const regex = new RegExp(pattern, 'i');
            return regex.test(item.title || '');
          });
          
          if (shouldExclude) {
            console.log(`  Skipping chapter ${i + 1}: ${item.title || 'Untitled'} (title matches exclusion pattern)`);
            continue;
          }
          
          // Get chapter content
          const content = await getChapterContent(epub, item.id);
          
          if (content && content.text.trim()) {
            // Use the title from the content if available, otherwise fall back to spine title
            const chapterTitle = content.title || item.title || `Chapter ${i + 1}`;
            const chapterId = generateChapterId(chapterTitle, i);
            
            chapters.push({
              id: chapterId,
              title: chapterTitle,
              original: content.html,
              modern: `<p>Modern retelling for ${chapterTitle} goes here. Use generate-retellings.js to populate this.</p>`,
              passages: []
            });
          }
        }
        
        const bookData = {
          id: bookId,
          chapters: chapters
        };
        
        // Save to file
        const outputPath = path.join(process.cwd(), 'public', 'data', 'books', `${bookId}.json`);
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, JSON.stringify(bookData, null, 2));
        
        console.log(`✓ Processed ${chapters.length} chapters`);
        console.log(`✓ Saved to: ${outputPath}`);
        
        resolve(bookData);
      } catch (error) {
        reject(error);
      }
    });
    
    epub.on('error', reject);
    epub.parse();
  });
}

function getChapterContent(epub, chapterId) {
  return new Promise((resolve, reject) => {
    epub.getChapter(chapterId, (error, text) => {
      if (error) {
        reject(error);
        return;
      }
      
      // Parse and clean HTML
      const dom = new JSDOM(text);
      const document = dom.window.document;
      
      // Remove scripts and styles
      document.querySelectorAll('script, style').forEach(el => el.remove());
      
      // Try to extract the actual chapter title from the content
      let chapterTitle = null;
      const h2 = document.querySelector('h2');
      if (h2) {
        // Get the text content of the h2, which might contain the actual title
        const h2Text = h2.textContent.trim();
        if (h2Text) {
          chapterTitle = h2Text;
        }
      }
      
      // Get body content
      const body = document.querySelector('body');
      const html = body ? body.innerHTML : text;
      
      // Clean up the HTML
      const cleanHtml = cleanHTML(html);
      
      resolve({
        html: cleanHtml,
        text: body ? body.textContent : '',
        title: chapterTitle
      });
    });
  });
}

function cleanHTML(html) {
  // Remove excessive whitespace
  let cleaned = html.replace(/\s+/g, ' ');
  
  // Ensure proper paragraph spacing
  cleaned = cleaned.replace(/<\/p>\s*<p>/g, '</p>\n<p>');
  
  // Remove empty paragraphs
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');
  
  return cleaned.trim();
}

function generateChapterId(title, index) {
  // Create a URL-friendly ID from title
  const id = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return id || `chapter-${index + 1}`;
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const epubPath = process.argv[2];
  const bookId = process.argv[3];
  
  if (!epubPath || !bookId) {
    console.error('Usage: node process-epub.js <epub-file-path> <book-id> [options]');
    console.error('Options:');
    console.error('  --skip-first=N        Skip the first N chapters');
    console.error('  --skip-last=N         Skip the last N chapters');
    console.error('  --exclude-titles=...  Skip chapters with titles matching patterns (comma-separated)');
    console.error('\nExample: node process-epub.js ./frankenstein.epub frankenstein --skip-first=2');
    console.error('Example: node process-epub.js ./frankenstein.epub frankenstein --skip-last=1');
    console.error('Example: node process-epub.js ./frankenstein.epub frankenstein --exclude-titles="Table of Contents,Title Page"');
    console.error('Example: node process-epub.js ./frankenstein.epub frankenstein --skip-first=2 --skip-last=1');
    process.exit(1);
  }
  
  // Parse options
  const options = {};
  const args = process.argv.slice(4);
  
  for (const arg of args) {
    if (arg.startsWith('--skip-first=')) {
      options.skipFirst = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--skip-last=')) {
      options.skipLast = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--exclude-titles=')) {
      const titlesStr = arg.split('=')[1];
      options.excludeTitles = titlesStr.split(',').map(t => t.trim());
    }
  }
  
  processEPUB(epubPath, bookId, options)
    .then(() => {
      console.log('\n✓ EPUB processing complete!');
      console.log('\nNext steps:');
      console.log('1. Review the generated JSON file');
      console.log('2. Run generate-retellings.js to add modern translations');
    })
    .catch(error => {
      console.error('Error processing EPUB:', error);
      process.exit(1);
    });
}

export { processEPUB };
