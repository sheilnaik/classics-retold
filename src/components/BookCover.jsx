import React from 'react';
import './BookCover.css';

export default function BookCover({ book, isPinned, onPin, onClick, progress }) {
  const handlePinClick = (e) => {
    e.stopPropagation();
    onPin(book.id);
  };

  const completionPercent = progress && progress.totalChapters
    ? Math.round((progress.completed?.length || 0) / progress.totalChapters * 100)
    : 0;

  return (
    <div className="book-cover" onClick={onClick}>
      <div className="book-cover-image-container">
        <img 
          src={book.coverImage} 
          alt={`${book.title} cover`}
          className="book-cover-image"
          loading="lazy"
        />
        <button 
          className={`pin-button ${isPinned ? 'pinned' : ''}`}
          onClick={handlePinClick}
          aria-label={isPinned ? 'Unpin book' : 'Pin book'}
          title={isPinned ? 'Unpin book' : 'Pin book'}
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill={isPinned ? 'currentColor' : 'none'}
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12 17v5M9 3v4c0 1.5-1 2-2 3s-1 2-1 3c0 1 1 2 2 2h8c1 0 2-1 2-2 0-1 0-2-1-3s-2-1.5-2-3V3" />
          </svg>
        </button>
        {completionPercent > 0 && (
          <div className="progress-badge">
            {completionPercent}%
          </div>
        )}
      </div>
      <div className="book-cover-info">
        <h3 className="book-title">{book.title}</h3>
        {book.subtitle && (
          <p className="book-subtitle">{book.subtitle}</p>
        )}
        <p className="book-author">{book.author}</p>
      </div>
    </div>
  );
}
