# Architecture Overview

## Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Library    │  │    Reader    │  │     TOC      │  │
│  │     View     │  │     View     │  │    Modal     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                 │                  │          │
└─────────┼─────────────────┼──────────────────┼──────────┘
          │                 │                  │
          └─────────────────┴──────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │    App.jsx        │
                  │  (State Manager)  │
                  └─────────┬─────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼─────┐
    │    Utils     │ │   Storage   │ │  Themes   │
    │   (books,    │ │  (IndexedDB)│ │   (CSS)   │
    │    text)     │ │             │ │           │
    └──────────────┘ └─────────────┘ └───────────┘
            │               │               │
            └───────────────┴───────────────┘
                            │
                ┌───────────▼───────────┐
                │   Service Worker      │
                │  (Offline Support)    │
                └───────────────────────┘
```

## Data Flow

### Reading a Book

```
1. User clicks book in Library
   ↓
2. App.jsx loads book content (loadBookContent)
   ↓
3. Fetch /data/books/[bookId].json
   ↓
4. Reader component receives book data
   ↓
5. Load user progress from IndexedDB
   ↓
6. Display chapter at saved position
   ↓
7. Save scroll position (debounced) to IndexedDB
```

### Text Swapping

```
1. User clicks swap button
   ↓
2. Reader stores current scroll position
   ↓
3. Toggle showModern state
   ↓
4. Fade out animation (150ms)
   ↓
5. Swap HTML content (original ↔ modern)
   ↓
6. Fade in animation (150ms)
   ↓
7. Restore scroll position
```

### Highlight Translation

```
1. User selects text with mouse
   ↓
2. mouseup event triggers
   ↓
3. getSelectedText() extracts text
   ↓
4. findPassageForSelection() matches passage
   ↓
5. Display HighlightPopup with translation
   ↓
6. User clicks close
   ↓
7. Clear selection and close popup
```

## Component Hierarchy

```
App
├── Library
│   ├── BookCover (multiple)
│   │   └── Book metadata
│   └── Progress data
│
└── Reader
    ├── Navigation Bar
    │   ├── Back button
    │   ├── TOC button
    │   └── ThemeSelector
    │
    ├── Chapter Content
    │   └── HTML (original or modern)
    │
    ├── Chapter Navigation
    │   ├── Previous button
    │   └── Next button
    │
    ├── Swap Button (floating)
    │
    ├── TableOfContents (conditional)
    │   └── Chapter list
    │
    └── HighlightPopup (conditional)
        ├── Original text
        ├── Modern translation
        └── Context
```

## Storage Architecture

### IndexedDB Stores

```
retold-classics-db
├── progress (keyPath: bookId)
│   ├── bookId: string
│   ├── currentChapter: string
│   ├── scrollPosition: number
│   ├── completed: string[]
│   ├── percentComplete: number
│   └── lastRead: ISO date string
│
├── preferences (keyPath: key)
│   └── theme: 'light' | 'dark' | 'sepia'
│
└── pinned (keyPath: bookId)
    ├── bookId: string
    └── pinnedAt: ISO date string
```

### Book Data Structure

```json
{
  "id": "book-id",
  "chapters": [
    {
      "id": "chapter-id",
      "title": "Chapter Title",
      "original": "<p>Original HTML...</p>",
      "modern": "<p>Modern HTML...</p>",
      "passages": [
        {
          "id": "passage-id",
          "originalText": "Selected text",
          "modernText": "Translation",
          "context": "<p>Context HTML...</p>"
        }
      ]
    }
  ]
}
```

## PWA Architecture

### Service Worker Caching

```
Service Worker Strategy
├── App Shell (Precache)
│   ├── index.html
│   ├── CSS files
│   ├── JS bundles
│   └── Manifest
│
├── Static Assets (Precache)
│   ├── Icons
│   ├── Book covers
│   └── Book JSON files
│
└── Runtime Caching
    ├── Google Fonts (Cache First)
    └── Dynamic content (Network First)
```

### Installation Flow

```
1. User visits app URL
   ↓
2. Browser downloads app shell
   ↓
3. Service worker registers
   ↓
4. Assets cached in background
   ↓
5. Install prompt appears
   ↓
6. User clicks "Install"
   ↓
7. App added to home screen
   ↓
8. Opens in standalone mode
```

## Theme System

### CSS Custom Properties

```css
:root {
  /* Define all theme colors */
  --light-bg: #FFFFFF;
  --dark-bg: #1A1A1A;
  --sepia-bg: #F4F1EA;
}

body.light-theme {
  --bg: var(--light-bg);
  /* ... other properties */
}

/* All components use var(--bg) */
```

### Theme Switching Flow

```
1. User clicks theme button
   ↓
2. onThemeChange(newTheme) called
   ↓
3. Update state: setTheme(newTheme)
   ↓
4. Save to IndexedDB
   ↓
5. Apply to body: body.className = 'theme-name'
   ↓
6. CSS transitions smoothly (200ms)
```

## Build Process

```
Source Code (src/)
      ↓
   Vite Build
      ↓
   ┌──────────────────┐
   │  Transpilation   │
   │  (Babel, esbuild)│
   └────────┬─────────┘
            │
   ┌────────▼─────────┐
   │   Bundling       │
   │  (Code splitting)│
   └────────┬─────────┘
            │
   ┌────────▼─────────┐
   │  Optimization    │
   │  (Minification)  │
   └────────┬─────────┘
            │
   ┌────────▼─────────┐
   │  PWA Plugin      │
   │ (SW generation)  │
   └────────┬─────────┘
            │
      dist/ folder
      ↓
   Ready for deployment
```

## File Dependencies

```
index.html
└── main.jsx
    └── App.jsx
        ├── styles/
        │   ├── themes.css
        │   └── global.css
        │
        ├── components/
        │   ├── Library.jsx
        │   │   ├── BookCover.jsx
        │   │   └── storage.js
        │   │
        │   └── Reader.jsx
        │       ├── TableOfContents.jsx
        │       ├── ThemeSelector.jsx
        │       ├── HighlightPopup.jsx
        │       ├── books.js
        │       ├── storage.js
        │       └── text-utils.js
        │
        └── utils/
            ├── books.js
            ├── storage.js
            └── text-utils.js
```

## API Surface

### Storage API

```javascript
// Progress
await getProgress(bookId)
await saveProgress(bookId, data)
await getAllProgress()

// Preferences
await getPreference(key)
await savePreference(key, value)

// Pinned Books
await getPinnedBooks()
await togglePinBook(bookId)
await isBookPinned(bookId)

// Utility
calculateCompletion(progress, totalChapters)
```

### Books API

```javascript
// Metadata
getBookById(id)
BOOKS_METADATA // Array of all books

// Content
await loadBookContent(bookId)

// Navigation
getChapterById(book, chapterId)
getChapterIndex(book, chapterId)
getNextChapter(book, currentChapterId)
getPreviousChapter(book, currentChapterId)
```

### Text Utils API

```javascript
// Selection
getSelectedText()
clearSelection()
findPassageForSelection(text, passages)

// Scroll
scrollToPosition(position, behavior)
getCurrentScrollPosition()

// Utility
debounce(func, wait)
```

## Performance Optimizations

### Implemented

- ✅ Code splitting (Vite automatic)
- ✅ Lazy loading of book content
- ✅ Debounced scroll position saves (500ms)
- ✅ CSS transitions instead of JS animations
- ✅ Efficient IndexedDB queries
- ✅ Service worker caching
- ✅ Minified and compressed output

### Potential Future Optimizations

- Virtual scrolling for long chapters
- Image lazy loading
- WebP images instead of JPG/PNG
- Compression of JSON book data
- Prefetching next chapter
- Dynamic imports for large components

## Security Considerations

### Implemented

- ✅ No eval() or unsafe practices
- ✅ Content Security Policy compatible
- ✅ HTTPS enforced (via hosting providers)
- ✅ No external scripts (except Google Fonts)
- ✅ Sanitized HTML (using dangerouslySetInnerHTML carefully)

### Best Practices

- User data stored locally (no backend)
- No sensitive data collection
- Public domain content only
- No authentication required
- CORS not an issue (same-origin)

## Browser Compatibility Matrix

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Service Worker | ✅ 90+ | ✅ 14+ | ✅ 88+ | ✅ 90+ |
| IndexedDB | ✅ 90+ | ✅ 14+ | ✅ 88+ | ✅ 90+ |
| CSS Grid | ✅ 90+ | ✅ 14+ | ✅ 88+ | ✅ 90+ |
| CSS Variables | ✅ 90+ | ✅ 14+ | ✅ 88+ | ✅ 90+ |
| ES6+ | ✅ 90+ | ✅ 14+ | ✅ 88+ | ✅ 90+ |
| PWA Install | ✅ Yes | ✅ Yes | ⚠️ Limited | ✅ Yes |

## Testing Strategy

### Unit Tests (Not Implemented)

Would test:
- Storage functions
- Text utility functions
- Book data functions
- State management

### Integration Tests (Not Implemented)

Would test:
- Component interactions
- Navigation flows
- Data persistence
- Theme switching

### E2E Tests (Not Implemented)

Would test:
- Complete user journeys
- PWA installation
- Offline functionality
- Cross-browser compatibility

### Manual Testing (Required)

✅ Visual inspection
✅ Feature verification
✅ Performance testing
✅ Device testing
✅ Offline testing

## Deployment Architecture

```
GitHub Repository
      ↓
Cloudflare Pages
      ↓
┌─────────────────┐
│  Build Process  │
│  - npm install  │
│  - npm run build│
└────────┬────────┘
         │
    ┌────▼────┐
    │  dist/  │
    └────┬────┘
         │
    ┌────▼──────────┐
    │ Global CDN    │
    │ (300+ cities) │
    └────┬──────────┘
         │
    ┌────▼────────┐
    │   HTTPS     │
    │ Auto-cert   │
    └────┬────────┘
         │
    End Users
```

---

This architecture provides:
- Clear separation of concerns
- Scalable structure
- Maintainable codebase
- Offline-first approach
- Excellent user experience
- Production-ready foundation
