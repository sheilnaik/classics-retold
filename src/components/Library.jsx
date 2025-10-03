import React, { useState, useEffect } from 'react';
import BookCover from './BookCover';
import { BOOKS_METADATA } from '../utils/books';
import { getPinnedBooks, togglePinBook, getAllProgress } from '../utils/storage';
import './Library.css';

export default function Library({ onBookSelect }) {
  const [pinnedBookIds, setPinnedBookIds] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLibraryData();
  }, []);

  async function loadLibraryData() {
    try {
      const [pinned, progress] = await Promise.all([
        getPinnedBooks(),
        getAllProgress()
      ]);
      
      setPinnedBookIds(pinned);
      
      const progressMap = {};
      progress.forEach(p => {
        progressMap[p.bookId] = p;
      });
      setProgressData(progressMap);
    } catch (error) {
      console.error('Error loading library data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePin(bookId) {
    try {
      const isPinned = await togglePinBook(bookId);
      if (isPinned) {
        setPinnedBookIds([...pinnedBookIds, bookId]);
      } else {
        setPinnedBookIds(pinnedBookIds.filter(id => id !== bookId));
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading library...</p>
      </div>
    );
  }

  const pinnedBooks = BOOKS_METADATA.filter(book => pinnedBookIds.includes(book.id));
  const unpinnedBooks = BOOKS_METADATA.filter(book => !pinnedBookIds.includes(book.id));

  return (
    <div className="library">
      <header className="library-header">
        <h1>Classics Retold</h1>
        <p className="library-subtitle">Classic literature with modern retellings</p>
      </header>

      {pinnedBooks.length > 0 && (
        <section className="library-section">
          <h2 className="section-title">Pinned</h2>
          <div className="books-grid">
            {pinnedBooks.map(book => (
              <BookCover
                key={book.id}
                book={book}
                isPinned={true}
                onPin={handlePin}
                onClick={() => onBookSelect(book.id)}
                progress={progressData[book.id]}
              />
            ))}
          </div>
        </section>
      )}

      <section className="library-section">
        {pinnedBooks.length > 0 && <h2 className="section-title">All Books</h2>}
        <div className="books-grid">
          {unpinnedBooks.map(book => (
            <BookCover
              key={book.id}
              book={book}
              isPinned={false}
              onPin={handlePin}
              onClick={() => onBookSelect(book.id)}
              progress={progressData[book.id]}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
