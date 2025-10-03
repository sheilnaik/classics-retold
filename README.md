# Classics Retold - PWA

A Progressive Web App for reading classic literature with modern retellings. Toggle between original text and contemporary translations, highlight passages for instant modern interpretations, and enjoy a beautiful reading experience with multiple themes.

## Features

- 📚 **Library View** - Browse books with pinning capability
- 📖 **Immersive Reader** - Distraction-free reading experience
- 🔄 **Text Swapping** - Toggle between original and modern text
- ✨ **Highlight Translation** - Select text to see modern interpretation
- 🎨 **Multiple Themes** - Light, Dark, and Sepia modes
- 💾 **Offline Support** - Full PWA with service worker caching
- 📱 **Responsive Design** - Works on all devices
- 🔖 **Progress Tracking** - Remembers your reading position

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Storage**: IndexedDB (via idb)
- **PWA**: vite-plugin-pwa with Workbox
- **Styling**: Custom CSS with CSS Variables
- **Fonts**: Google Fonts (Crimson Text, Inter)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

## Project Structure

```
retold/
├── public/
│   ├── data/
│   │   └── books/
│   │       └── frankenstein.json
│   ├── images/
│   │   └── covers/
│   │       └── frankenstein.jpg
│   └── icons/
│       └── [PWA icons]
├── src/
│   ├── components/
│   │   ├── BookCover.jsx
│   │   ├── Library.jsx
│   │   ├── Reader.jsx
│   │   ├── TableOfContents.jsx
│   │   ├── ThemeSelector.jsx
│   │   └── HighlightPopup.jsx
│   ├── styles/
│   │   ├── global.css
│   │   └── themes.css
│   ├── utils/
│   │   ├── books.js
│   │   ├── storage.js
│   │   └── text-utils.js
│   ├── App.jsx
│   └── main.jsx
├── scripts/
│   ├── process-epub.js
│   └── generate-retellings.js
└── package.json
```

## Adding New Books

### Method 1: From EPUB

1. Get a public domain EPUB file
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

**Note:** Many EPUBs contain non-content chapters at the beginning (title pages, table of contents, copyright pages) or end (appendices, indexes). Use `--skip-first`, `--skip-last`, or `--exclude-titles` to exclude these. When using `npm run`, add `--` before the path to pass arguments correctly.

3. Generate retelling placeholders:

```bash
npm run generate-retellings book-id
```

4. Edit `/public/data/books/book-id.json` to add:
   - Modern chapter translations
   - Passage-level translations

5. Add book cover to `/public/images/covers/book-id.jpg`

6. Update `/src/utils/books.js` to add book metadata:

```javascript
{
  id: 'book-id',
  title: 'Book Title',
  author: 'Author Name',
  year: 1850,
  coverImage: '/images/covers/book-id.jpg',
  description: 'Brief description...',
  chapters: 20
}
```

### Method 2: Manual JSON

Create a JSON file in `/public/data/books/` following this structure:

```json
{
  "id": "book-id",
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Chapter 1",
      "original": "<p>Original text...</p>",
      "modern": "<p>Modern retelling...</p>",
      "passages": [
        {
          "id": "passage-1",
          "originalText": "Original sentence",
          "modernText": "Modern translation",
          "context": "<p>Surrounding paragraph...</p>"
        }
      ]
    }
  ]
}
```

## Creating Modern Retellings

### Manual Approach

1. Read each chapter carefully
2. Write a modern retelling maintaining:
   - The plot and key events
   - Character relationships
   - Important themes
   - Emotional tone

3. Update the `modern` field in the JSON
4. Create passage-level translations for key/difficult passages

### LLM-Assisted Approach

Use an LLM (ChatGPT, Claude, etc.) with a prompt like:

```
Rewrite this chapter from [Book Name] in modern, accessible English while:
- Maintaining the original plot and themes
- Using contemporary language and sentence structure
- Preserving character voices and relationships
- Keeping the same emotional impact

Original text:
[paste chapter text]
```

### Tips for Good Retellings

- ✅ Use modern vocabulary and idioms
- ✅ Simplify complex sentence structures
- ✅ Clarify archaic references
- ✅ Maintain the story's emotional core
- ❌ Don't change plot points
- ❌ Don't remove important details
- ❌ Don't oversimplify to the point of losing meaning

## PWA Icons

Generate PWA icons in these sizes:
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512

Place in `/public/icons/`

Quick generation with ImageMagick:
```bash
convert -size 512x512 xc:"#2E5266" -pointsize 200 -fill white \
  -gravity center -annotate +0+0 "R" icon-512x512.png

# Generate other sizes
for size in 72 96 128 144 152 192 384; do
  convert icon-512x512.png -resize ${size}x${size} icon-${size}x${size}.png
done
```

Or use: https://www.pwabuilder.com/imageGenerator

## Deployment

### Cloudflare Pages (Recommended)

1. Push code to GitHub
2. Go to Cloudflare Pages dashboard
3. Connect your repository
4. Configure build:
   - Build command: `npm run build`
   - Build output: `dist`
5. Deploy!

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### GitHub Pages

1. Update `vite.config.js`:
```javascript
export default defineConfig({
  base: '/your-repo-name/',
  // ... rest of config
})
```

2. Build and deploy:
```bash
npm run build
# Use gh-pages or manual deploy
```

## Configuration Files

### Cloudflare Pages

Create `wrangler.toml`:
```toml
name = "retold-classics"
compatibility_date = "2025-01-01"

[site]
bucket = "./dist"
```

### Custom Domain

After deployment, add custom domain in your hosting provider's dashboard.

## Browser Support

- ✅ Chrome 90+
- ✅ Safari 14+
- ✅ Firefox 88+
- ✅ Edge 90+

## Performance

- Lighthouse Score: 95+ (Performance, Accessibility, Best Practices, SEO)
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Fully cached for offline use after first visit

## Development Tips

### Testing PWA Features

1. Build for production: `npm run build`
2. Preview: `npm run preview`
3. Test installation in Chrome DevTools
4. Test offline in Network panel (Offline mode)

### Theme Development

Themes are defined in `/src/styles/themes.css` using CSS custom properties.

To add a new theme:
1. Add theme variables in `:root`
2. Create theme class (e.g., `body.custom-theme`)
3. Add to `ThemeSelector` component

### Storage Debugging

Use Chrome DevTools > Application > IndexedDB to inspect stored data.

## Troubleshooting

### Service Worker Not Updating

Clear cache and hard reload (Ctrl/Cmd + Shift + R)

### Icons Not Showing

Check icon paths in `vite.config.js` manifest section

### Book Not Loading

Verify JSON is valid and path matches in `books.js`

### Progress Not Saving

Check IndexedDB is enabled and not full

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. Book content should be public domain or appropriately licensed.

## Credits

- Built with React and Vite
- Icons from Heroicons/Lucide
- Fonts from Google Fonts
- Sample book: Frankenstein by Mary Shelley (Public Domain)

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Made with ❤️ for classic literature lovers
