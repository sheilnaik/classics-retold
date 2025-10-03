# Classic Literature Modern Retelling PWA - Complete Project Specification

## Project Overview

A Progressive Web App (PWA) that allows users to read classic literature with the ability to toggle between original text and modern retellings, plus get quick translations of difficult passages through text highlighting.

## Core Features

### 1. Library View
- Grid layout of book covers similar to Apple Books
- Support for 5-10 books initially, scalable to 50+
- "Pinned" section at the top showing user-pinned books
- Pin button (icon) at top-right of each book cover
- Multiple books can be pinned simultaneously
- Elegant, clean design with book cover thumbnails and titles

### 2. Table of Contents
- Displays all chapters/sections of the selected book
- Shows progress indicators (checkmarks) for completed chapters
- Highlights the current chapter being read
- Allows direct navigation to any chapter
- Accessible from the reading view

### 3. Reading View
- Displays chapter text with original EPUB formatting preserved (if feasible)
- Maintains scroll position across all interactions
- **Text Swapping Feature:**
  - Toggle button/icon to swap entire chapter between original and modern retelling
  - Visual indicator showing which version is currently displayed
  - Smooth animation transition when swapping
  - Maintains exact scroll position during swap
- **Highlight & Quick Translation Feature:**
  - Click-and-drag text selection (standard browser selection)
  - On selection, shows popup/modal with modern retelling of selected sentence plus surrounding paragraph for context
  - Popup closes on dismiss, highlight disappears
  - Temporary feature (not persistent)
- **Chapter Navigation:**
  - Previous/Next chapter buttons at the end of each chapter
  - Chapter progress tracking (% complete)
- **Reading Progress:**
  - App remembers last position in each book
  - Tracks % completion of each book
  - Auto-saves progress

### 4. Visual Modes
- **Light Mode:** Clean white/light background
- **Dark Mode:** Dark background for low-light reading
- **Sepia Mode:** Warm, paper-like tone for comfortable reading
- Mode selector accessible from reading view
- User preference persisted across sessions

## Technical Architecture

### Frontend Stack
**Implementation LLM should choose the best framework** (React, Vue, Svelte, or vanilla JS) based on:
- PWA requirements
- EPUB parsing capabilities
- Client-side storage needs
- Offline-first architecture

### Data Storage Strategy

#### Book Content Storage
- **Pre-processing Approach (RECOMMENDED):**
  - Convert EPUB files to JSON format during build time
  - Structure: `{ bookId, metadata, chapters: [{ chapterId, title, originalHTML, modernHTML }] }`
  - Preserve styling information from EPUB
  - Store in `/public/books/` or `/src/data/books/`
  - Bundle with app deployment

#### Modern Retellings Storage
- **Format:** JSON files with chapter-level granularity
- **Structure:**
  ```json
  {
    "bookId": "frankenstein",
    "chapters": [
      {
        "chapterId": "chapter-1",
        "original": "<p>Full original HTML...</p>",
        "modern": "<p>Modern retelling HTML...</p>",
        "passages": [
          {
            "id": "passage-1",
            "original": "You will rejoice to hear that no disaster has accompanied...",
            "modern": "You'll be happy to know that nothing bad has happened...",
            "context": "Full paragraph context"
          }
        ]
      }
    ]
  }
  ```

#### User Data Storage
- **Technology:** IndexedDB (via library like idb or localforage)
- **Stored Data:**
  - Last read position per book (bookId, chapterId, scrollPosition)
  - Reading progress (% complete per book)
  - Pinned books (array of bookIds)
  - Theme preference (light/dark/sepia)
- **No backend required:** All data stored client-side

### EPUB Processing

**Option 1: Pre-process (RECOMMENDED for MVP)**
- Use Node.js script with `epub` or `epub2` library to parse EPUB files at build time
- Extract chapter structure, content, and styling
- Convert to JSON format
- Benefits: Faster load times, simpler runtime code, better offline support

**Option 2: Client-side parsing**
- Use library like `epub.js`
- Parse EPUB files in browser
- Benefits: True EPUB fidelity
- Drawbacks: More complex, larger bundle size

**Decision:** Start with Option 1 (pre-processing) for MVP. Can upgrade to Option 2 if needed.

### PWA Requirements

- **Service Worker:** Cache all book content, app shell, and assets for offline access
- **Manifest:** Configure app name, icons, theme colors, display mode
- **Installable:** Users can add to home screen on iOS/Android
- **Offline-first:** Fully functional without internet after initial load
- **Responsive:** Works on mobile and desktop

## User Interface Design

### Design System

#### Typography
- **Headings:** Serif font (Google Fonts: Playfair Display, Libre Baskerville, or Crimson Text)
- **Body Text:** Sans-serif font (Google Fonts: Inter, Open Sans, or Source Sans Pro)
- **Reading Text:** Serif font for original/modern text (Georgia, Crimson Text, or Merriweather)

#### Color Schemes

**Light Mode:**
- Background: `#FFFFFF`
- Text: `#1A1A1A`
- Accent: `#2E5266` (blue-gray)
- Secondary: `#6E8898`

**Dark Mode:**
- Background: `#1A1A1A`
- Text: `#E8E8E8`
- Accent: `#4A90A4`
- Secondary: `#8EA6B3`

**Sepia Mode:**
- Background: `#F4F1EA`
- Text: `#5C4B37`
- Accent: `#8B7355`
- Secondary: `#A69580`

#### Layout

**Library View:**
- CSS Grid layout (responsive: 2-3 columns mobile, 4-5 desktop)
- Book covers: 150x225px (aspect ratio 2:3)
- Pinned section at top with visual separator
- Book title below cover
- Hover effects for interactivity

**Reading View:**
- Max-width container (680-720px) for optimal readability
- Generous margins and line-height (1.6-1.8)
- Top navigation bar: Back button, TOC button, Theme selector
- Bottom navigation: Chapter progress, Prev/Next buttons
- Swap button: Floating action button or toggle in top bar

**Table of Contents:**
- Modal or slide-in panel
- List of chapters with completion checkmarks
- Current chapter highlighted
- Scrollable if many chapters

**Highlight Popup:**
- Modal overlay with semi-transparent background
- Center-positioned card with modern retelling
- Close button (X) in top-right
- Smooth fade-in/out animation

### Animations & Interactions

- **Text Swap:** Fade out → Fade in (300ms duration)
- **Theme Change:** Smooth color transition (200ms)
- **Modal Open/Close:** Fade + scale animation (250ms)
- **Page Transitions:** Slide or fade between views
- **Pin/Unpin:** Icon animation (checkmark or pin icon)

## Data Structure Examples

### Book Metadata
```json
{
  "id": "frankenstein",
  "title": "Frankenstein; or, The Modern Prometheus",
  "author": "Mary Shelley",
  "year": 1818,
  "coverImage": "/images/covers/frankenstein.jpg",
  "chapters": 24,
  "description": "Brief description..."
}
```

### User Progress
```json
{
  "frankenstein": {
    "currentChapter": 5,
    "scrollPosition": 1240,
    "percentComplete": 45,
    "lastRead": "2025-10-02T12:00:00Z",
    "completed": [1, 2, 3, 4, 5]
  }
}
```

### Pinned Books
```json
{
  "pinnedBooks": ["frankenstein", "pride-and-prejudice"]
}
```

## File Structure (Example)

```
/project-root
├── /public
│   ├── /images
│   │   └── /covers
│   │       └── frankenstein.jpg
│   ├── /fonts (if self-hosting)
│   ├── manifest.json
│   └── service-worker.js
├── /src
│   ├── /data
│   │   ├── /books
│   │   │   └── frankenstein.json
│   │   └── /retellings
│   │       └── frankenstein-modern.json
│   ├── /components
│   │   ├── Library.jsx
│   │   ├── BookCover.jsx
│   │   ├── TableOfContents.jsx
│   │   ├── Reader.jsx
│   │   ├── HighlightPopup.jsx
│   │   ├── ThemeSelector.jsx
│   │   └── Navigation.jsx
│   ├── /utils
│   │   ├── storage.js (IndexedDB helpers)
│   │   ├── epub-parser.js (build-time processing)
│   │   └── text-utils.js (highlight detection, etc.)
│   ├── /styles
│   │   ├── global.css
│   │   ├── themes.css
│   │   └── typography.css
│   ├── App.jsx
│   └── main.jsx
├── /scripts
│   └── process-epubs.js (build-time EPUB → JSON)
├── package.json
└── README.md
```

## Implementation Phases

### Phase 1: Core Setup
- Set up project with chosen framework
- Implement basic routing (Library → TOC → Reader)
- Set up IndexedDB storage utilities
- Implement theme system (light/dark/sepia)

### Phase 2: Library & Navigation
- Build library view with grid layout
- Implement pin/unpin functionality
- Create TOC component with progress indicators
- Set up basic navigation between views

### Phase 3: Reading Experience
- Build reader component with chapter display
- Implement scroll position persistence
- Add chapter navigation (prev/next)
- Create progress tracking system

### Phase 4: Text Features
- Implement text swap functionality with animation
- Build highlight selection system
- Create popup modal for modern retelling
- Integrate passage-level retelling lookup

### Phase 5: PWA Features
- Configure service worker for offline support
- Create manifest.json
- Test installation on iOS Safari and Chrome
- Optimize caching strategy

### Phase 6: Polish & Testing
- Refine animations and transitions
- Test across devices and browsers
- Optimize performance
- Add loading states and error handling

## Sample Book: Frankenstein

### Data Preparation Required

1. **EPUB File:** Download public domain EPUB of Frankenstein
2. **Modern Retelling:** Generate modern retelling for each chapter using LLM
3. **Processing Script:** Create script to:
   - Parse EPUB structure
   - Extract chapters
   - Match chapters with modern retellings
   - Generate JSON output
4. **Cover Image:** Find or create book cover image

### Sample JSON Structure (Abbreviated)

```json
{
  "id": "frankenstein",
  "title": "Frankenstein",
  "author": "Mary Shelley",
  "coverImage": "/images/covers/frankenstein.jpg",
  "chapters": [
    {
      "id": "letter-1",
      "title": "Letter 1",
      "original": "<p>You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings...</p>",
      "modern": "<p>You'll be happy to know that nothing bad has happened at the start of this journey that you were so worried about...</p>",
      "passages": [
        {
          "id": "passage-1",
          "originalText": "You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings.",
          "modernText": "You'll be happy to know that nothing bad has happened at the start of this journey that you were so worried about.",
          "context": "<p>Full paragraph for context...</p>"
        }
      ]
    }
  ]
}
```

## Hosting Recommendations

### Option 1: Cloudflare Pages (RECOMMENDED)
- **Cost:** Free tier (unlimited bandwidth, unlimited requests)
- **Pros:**
  - Excellent PWA support
  - Global CDN
  - Automatic HTTPS
  - Simple Git integration
  - Great performance
  - Free custom domain support
- **Cons:** None significant for this use case

### Option 2: Vercel
- **Cost:** Free tier (100GB bandwidth/month)
- **Pros:**
  - Excellent developer experience
  - Automatic deployments from Git
  - Great performance
  - Built-in analytics
- **Cons:** Bandwidth limits (may be reached with 50 books if very popular)

### Option 3: GitHub Pages
- **Cost:** Free
- **Pros:**
  - Simple, direct from repository
  - Good for static sites
- **Cons:**
  - No serverless functions if needed later
  - Less sophisticated than Cloudflare/Vercel

### Option 4: Netlify
- **Cost:** Free tier (100GB bandwidth/month)
- **Pros:**
  - Great PWA support
  - Easy deployment
  - Form handling if needed
- **Cons:** Similar limitations to Vercel

**RECOMMENDATION:** Use **Cloudflare Pages** for unlimited free hosting with excellent performance and PWA support.

## Key Technical Considerations

### Text Highlighting Implementation
- Use `window.getSelection()` API to capture user text selection
- Calculate selected text position within chapter
- Match selection to pre-generated passage data
- If exact match not found, use fuzzy matching or context-based lookup
- Display modern retelling of sentence + surrounding paragraph

### Scroll Position Persistence
- Store scroll position in IndexedDB on scroll events (debounced)
- Restore position on chapter load using `scrollTo()`
- Account for dynamic content height when swapping text versions

### EPUB Formatting Preservation
- Preserve inline styles from EPUB
- Extract CSS from EPUB and apply to rendered content
- Maintain paragraph breaks, emphasis, and basic formatting
- Strip complex layouts that don't work well on mobile

### Performance Optimization
- Lazy load book data (only load book content when opened)
- Virtualize long chapters if needed
- Compress JSON data
- Use modern image formats (WebP) for covers
- Implement efficient IndexedDB queries

## Browser Compatibility

- **Target Browsers:** iOS Safari 14+, Chrome 90+
- **Required Features:**
  - Service Workers
  - IndexedDB
  - CSS Grid
  - Flexbox
  - CSS Custom Properties (for theming)
  - ES6+ JavaScript

## Testing Checklist

- [ ] Library view displays all books correctly
- [ ] Pin/unpin functionality works
- [ ] TOC shows all chapters with correct progress
- [ ] Chapter navigation (prev/next) works
- [ ] Reading position is saved and restored
- [ ] Text swap maintains scroll position
- [ ] Text highlighting triggers popup
- [ ] Popup displays correct modern retelling
- [ ] All three themes work correctly
- [ ] Theme preference is persisted
- [ ] App works offline after initial load
- [ ] App is installable on iOS Safari
- [ ] App is installable on Chrome
- [ ] Progress tracking is accurate
- [ ] Performance is smooth on mobile devices

## Future Enhancements (Post-MVP)

- Search within book functionality
- Bookmarking specific passages
- Notes and annotations
- Export highlights/notes
- Multiple retelling styles
- Audio narration
- Side-by-side view (original + modern)
- Reading statistics (time spent, pages read)
- Social sharing
- Book recommendations

## Development Instructions for LLM

1. **Choose optimal tech stack** based on requirements (suggest React or Svelte for PWA)
2. **Set up project structure** with all necessary folders and files
3. **Implement EPUB processing script** to convert Frankenstein EPUB to JSON
4. **Create all UI components** following design specifications
5. **Implement IndexedDB storage layer** for user data
6. **Build service worker** for offline support
7. **Style application** with custom CSS following design system
8. **Test on both iOS Safari and Chrome**
9. **Provide deployment instructions** for Cloudflare Pages
10. **Include README** with setup, development, and deployment instructions

## Success Criteria

- User can browse library and pin favorite books
- User can read any chapter of any book
- User can swap between original and modern text seamlessly
- User can highlight text and see modern retelling
- App remembers reading progress across sessions
- App works fully offline
- App is visually appealing and professional
- App performs well on mobile devices

---

## Additional Notes for Implementation

- Prioritize clean, maintainable code
- Use semantic HTML for accessibility
- Implement proper error handling (missing books, failed storage, etc.)
- Add loading states for better UX
- Ensure responsive design works from 320px to 4K displays
- Test with long chapters (10,000+ words)
- Optimize for touch interactions on mobile
- Use debouncing for scroll position saves (don't save on every scroll event)

---

**End of Specification**