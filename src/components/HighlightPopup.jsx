import React from 'react';
import './HighlightPopup.css';

export default function HighlightPopup({ passage, onClose }) {
  return (
    <div className="highlight-overlay" onClick={onClose}>
      <div className="highlight-modal" onClick={(e) => e.stopPropagation()}>
        <div className="highlight-header">
          <h3>Translation</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        
        <div className="highlight-content">
          <div className="highlight-section">
            <h4>Original</h4>
            <p className="highlight-text original">{passage.originalText}</p>
          </div>
          
          <div className="highlight-divider"></div>
          
          <div className="highlight-section">
            <h4>Modern</h4>
            <p className="highlight-text modern">{passage.modernText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
