import React from 'react';
import './TableOfContents.css';

export default function TableOfContents({ book, currentChapterId, progress, onChapterSelect, onClose }) {
  const completedChapters = progress?.completed || [];

  return (
    <div className="toc-overlay" onClick={onClose}>
      <div className="toc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="toc-header">
          <h2>Table of Contents</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        
        <div className="toc-content">
          {book.chapters.map((chapter, index) => {
            const isCompleted = completedChapters.includes(chapter.id);
            const isCurrent = chapter.id === currentChapterId;
            
            return (
              <button
                key={chapter.id}
                className={`toc-item ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => {
                  onChapterSelect(chapter.id);
                  onClose();
                }}
              >
                <span className="toc-item-number">{index + 1}</span>
                <span className="toc-item-title">{chapter.title}</span>
                {isCompleted && (
                  <svg className="toc-checkmark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
