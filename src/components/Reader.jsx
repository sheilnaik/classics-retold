import React, { useState, useEffect, useRef } from 'react';
import TableOfContents from './TableOfContents';
import ThemeSelector from './ThemeSelector';
import HighlightPopup from './HighlightPopup';
import { 
  getChapterById, 
  getNextChapter, 
  getPreviousChapter,
  getChapterIndex
} from '../utils/books';
import { 
  saveProgress, 
  getProgress 
} from '../utils/storage';
import {
  debounce,
  scrollToPosition,
  getCurrentScrollPosition
} from '../utils/text-utils';
import './Reader.css';

export default function Reader({ book, initialChapterId, onBack, theme, onThemeChange }) {
  const [currentChapterId, setCurrentChapterId] = useState(initialChapterId);
  const [showModern, setShowModern] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [progress, setProgress] = useState(null);
  const [highlightPopup, setHighlightPopup] = useState(null);
  const [isSwapping, setIsSwapping] = useState(false);
  
  const contentRef = useRef(null);
  const lastScrollPosition = useRef(0);

  const currentChapter = getChapterById(book, currentChapterId);
  const currentIndex = getChapterIndex(book, currentChapterId);
  const nextChapter = getNextChapter(book, currentChapterId);
  const prevChapter = getPreviousChapter(book, currentChapterId);

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, [book.id]);

  // Save scroll position
  useEffect(() => {
    const handleScroll = debounce(() => {
      const scrollPos = getCurrentScrollPosition();
      lastScrollPosition.current = scrollPos;
      saveScrollPosition(scrollPos);
    }, 500);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentChapterId]);

  // Restore scroll position when chapter changes
  useEffect(() => {
    if (progress && progress.currentChapter === currentChapterId && progress.scrollPosition) {
      setTimeout(() => {
        scrollToPosition(progress.scrollPosition);
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [currentChapterId]);

  // Wrap sentences in spans for hover effect
  useEffect(() => {
    if (!contentRef.current || showModern) return;

    const paragraphs = contentRef.current.querySelectorAll('.reader-chapter-content p');
    
    paragraphs.forEach(paragraph => {
      // Skip if already processed
      if (paragraph.querySelector('.sentence-span')) return;

      const text = paragraph.innerHTML;
      // Split by sentence endings, keeping the punctuation
      const sentences = text.match(/[^.!?]+[.!?]+/g);
      
      if (sentences && sentences.length > 1) {
        const wrappedHtml = sentences
          .map(sentence => `<span class="sentence-span">${sentence}</span>`)
          .join('');
        paragraph.innerHTML = wrappedHtml;
      }
    });
  }, [currentChapter, showModern, contentRef.current]);

  // Handle sentence click for translation
  useEffect(() => {
    const handleSentenceClick = (e) => {
      // Only handle clicks in original mode
      if (showModern) return;
      
      const target = e.target;
      const sentenceSpan = target.closest('.sentence-span');
      
      if (!sentenceSpan) return;

      const clickedSentence = sentenceSpan.textContent.trim();

      // Find if this sentence has a translation
      if (currentChapter?.passages) {
        for (const passage of currentChapter.passages) {
          const normalizedPassage = passage.originalText.toLowerCase().replace(/[^\w\s]/g, '');
          const normalizedSentence = clickedSentence.toLowerCase().replace(/[^\w\s]/g, '');
          
          // Check if sentence matches or is part of this passage
          if (normalizedPassage.includes(normalizedSentence) || 
              normalizedSentence.includes(normalizedPassage)) {
            setHighlightPopup({ passage });
            return;
          }
        }
      }
      
      // No translation available - show placeholder message
      setHighlightPopup({ 
        passage: {
          originalText: clickedSentence,
          modernText: "Translation coming soon! We're working on adding more translations to help you understand the original text."
        }
      });
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('click', handleSentenceClick);
      return () => contentElement.removeEventListener('click', handleSentenceClick);
    }
  }, [currentChapter, showModern]);

  async function loadProgress() {
    const prog = await getProgress(book.id);
    setProgress(prog || {
      currentChapter: initialChapterId,
      scrollPosition: 0,
      completed: [],
      percentComplete: 0
    });
  }

  async function saveScrollPosition(scrollPos) {
    const updatedProgress = {
      ...progress,
      currentChapter: currentChapterId,
      scrollPosition: scrollPos,
      totalChapters: book.chapters.length
    };
    await saveProgress(book.id, updatedProgress);
    setProgress(updatedProgress);
  }

  async function markChapterComplete() {
    if (!progress.completed.includes(currentChapterId)) {
      const updatedProgress = {
        ...progress,
        completed: [...progress.completed, currentChapterId],
        totalChapters: book.chapters.length,
        percentComplete: Math.round(((progress.completed.length + 1) / book.chapters.length) * 100)
      };
      await saveProgress(book.id, updatedProgress);
      setProgress(updatedProgress);
    }
  }

  function handleChapterChange(chapterId) {
    setCurrentChapterId(chapterId);
    setShowModern(false);
    setShowTOC(false);
    setHighlightPopup(null);
  }

  function handleNextChapter() {
    if (nextChapter) {
      markChapterComplete();
      handleChapterChange(nextChapter.id);
    }
  }

  function handlePrevChapter() {
    if (prevChapter) {
      handleChapterChange(prevChapter.id);
    }
  }

  async function handleSwapText() {
    setIsSwapping(true);
    lastScrollPosition.current = getCurrentScrollPosition();
    
    setTimeout(() => {
      setShowModern(!showModern);
      setTimeout(() => {
        scrollToPosition(lastScrollPosition.current, 'auto');
        setIsSwapping(false);
      }, 50);
    }, 150);
  }

  function handleClosePopup() {
    setHighlightPopup(null);
  }

  if (!currentChapter) {
    return (
      <div className="loading-container">
        <p>Chapter not found</p>
      </div>
    );
  }

  const contentHtml = showModern ? currentChapter.modern : currentChapter.original;

  return (
    <div className="reader">
      <nav className="reader-nav">
        <button className="btn-icon" onClick={onBack} aria-label="Back to library">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <div className="reader-nav-center">
          <button className="btn-ghost" onClick={() => setShowTOC(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            <span>Contents</span>
          </button>
        </div>

        <ThemeSelector currentTheme={theme} onThemeChange={onThemeChange} />
      </nav>

      <main className="reader-content">
        <div className="reader-container">
          <div className="reader-header">
            <h1 className="reader-book-title">{book.title}</h1>
            <h2 className="reader-chapter-title">{currentChapter.title}</h2>
            <div className="reader-progress">
              Chapter {currentIndex + 1} of {book.chapters.length}
              {progress?.percentComplete > 0 && (
                <span className="reader-progress-percent">
                  {progress.percentComplete}% Complete
                </span>
              )}
            </div>
          </div>

          <div className={`reader-text ${isSwapping ? 'swapping' : ''}`} ref={contentRef}>
            <div 
              className="reader-chapter-content"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>

          <div className="reader-navigation">
            <button 
              className="btn reader-nav-btn" 
              onClick={handlePrevChapter}
              disabled={!prevChapter}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Previous
            </button>
            
            <button 
              className="btn reader-nav-btn" 
              onClick={handleNextChapter}
              disabled={!nextChapter}
            >
              Next
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </main>

      <button 
        className={`swap-button ${showModern ? 'modern' : ''}`}
        onClick={handleSwapText}
        aria-label={showModern ? 'Show original text' : 'Show modern retelling'}
        title={showModern ? 'Show original text' : 'Show modern retelling'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4"/>
        </svg>
        <span className="swap-button-label">
          {showModern ? 'Original' : 'Modern'}
        </span>
      </button>

      {showTOC && (
        <TableOfContents
          book={book}
          currentChapterId={currentChapterId}
          progress={progress}
          onChapterSelect={handleChapterChange}
          onClose={() => setShowTOC(false)}
        />
      )}

      {highlightPopup && (
        <HighlightPopup
          passage={highlightPopup.passage}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
}
