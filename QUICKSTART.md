# Quick Start Guide

## Immediate Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Assets

**Option A: Automatic (requires ImageMagick)**
```bash
chmod +x setup.sh
./setup.sh
```

**Option B: Manual**

Create placeholder icons and covers:

```bash
# Create directories
mkdir -p public/icons public/images/covers

# Download a public domain Frankenstein cover image
# Save it as: public/images/covers/frankenstein.jpg

# For icons, use: https://www.pwabuilder.com/imageGenerator
# Upload a 512x512 icon and download all sizes to public/icons/
```

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## What You'll See

1. **Library View** - One book (Frankenstein) with 3 sample chapters
2. **Click the book** - Opens the reader with Letter 1
3. **Try the features**:
   - Click the swap button (bottom right) to toggle original/modern text
   - Highlight any text to see modern translation popup
   - Click "Contents" to see table of contents
   - Try the theme selector (sun/moon/book icons)
   - Navigate between chapters

## Testing PWA Features

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Then:
1. Open Chrome DevTools
2. Go to Application > Manifest
3. Click "Install" to test installation
4. Go to Application > Service Workers to test offline caching
5. Switch Network to "Offline" and verify the app still works

## Adding Your First Custom Book

1. Get a public domain EPUB (e.g., from Project Gutenberg)
2. Process it:

```bash
# Basic usage
npm run process-epub -- path/to/book.epub book-id

# Skip first N chapters (e.g., title page, table of contents)
npm run process-epub -- path/to/book.epub book-id --skip-first=2

# Skip last N chapters (e.g., appendix, index)
npm run process-epub -- path/to/book.epub book-id --skip-last=1

# Exclude chapters by title pattern
npm run process-epub -- path/to/book.epub book-id --exclude-titles="Table of Contents,Title Page"

# Combine options
npm run process-epub -- path/to/book.epub book-id --skip-first=2 --skip-last=1 --exclude-titles="Contents,Index"

# Or call the script directly with node
node scripts/process-epub.js path/to/book.epub book-id --skip-first=5 --skip-last=1
```

3. Edit the generated JSON to add modern translations
4. Add book metadata to `src/utils/books.js`
5. Add a cover image to `public/images/covers/book-id.jpg`

**Note:** Many EPUBs start with non-content chapters (title pages, table of contents, copyright pages) or end with appendices/indexes. Use `--skip-first`, `--skip-last`, or `--exclude-titles` to exclude these from your book data. When using `npm run`, add `--` before the path to pass arguments correctly.

### Creating Modern Translations with an LLM

After processing the EPUB, you'll have a JSON file at `public/data/books/book-id.json` with the original text. Use GitHub Copilot Agent mode to automatically generate and insert modern translations for all chapters.

**Prompt for GitHub Copilot Agent:**

```text
I need you to add modern English translations to the book JSON file at `public/data/books/book-id.json`. 

For each chapter in the file:
1. Read the "original" text field
2. Generate a complete modern translation and add it to the "modern" field
3. Identify 2-5 key passages and add them to the "passages" array

Translation requirements:
- Keep the same meaning and tone as the original
- Use contemporary vocabulary and sentence structure
- Make it accessible to modern readers while preserving the literary quality
- For the "modern" field: wrap paragraphs in <p> tags (same format as "original")
- For passage translations: provide plain text without HTML tags

Each passage should have this structure:
{
  "id": "chapter-id-passage-N",
  "originalText": "[exact quote from original text]",
  "modernText": "[modern translation of the quote]",
  "context": "[the full paragraph containing the quote, wrapped in <p> tags]"
}

Please process all chapters in the file and update the JSON directly. Work through the chapters one at a time, updating the file after each chapter is translated.
```

**How to use:**

1. Open the book JSON file: `public/data/books/book-id.json`
2. Open GitHub Copilot Agent mode (use `@workspace` or agent mode in Copilot Chat)
3. Paste the prompt above
4. The agent will automatically read the file, generate translations for each chapter, and update the JSON file
5. Review the changes and commit when satisfied

## Deploy to Cloudflare Pages

1. Push to GitHub
2. Log in to Cloudflare Pages
3. Click "Create a project"
4. Connect your repository
5. Set build command: `npm run build`
6. Set build output: `dist`
7. Click "Save and Deploy"

Your app will be live in 2-3 minutes! 🚀

## Common Issues

**Icons not showing?**

- Make sure all icon files exist in `public/icons/`
- Check browser console for 404 errors

**Book not loading?**

- Verify JSON file exists at `public/data/books/frankenstein.json`
- Check JSON is valid (use a JSON validator)

**Service worker not updating?**

- Hard refresh: Ctrl/Cmd + Shift + R
- Or clear cache in DevTools

## Need Help?

Check the main README.md for detailed documentation.
