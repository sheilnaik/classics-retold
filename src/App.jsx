import React, { useState, useEffect } from 'react';
import Library from './components/Library';
import Reader from './components/Reader';
import { loadBookContent, getBookById } from './utils/books';
import { getPreference, savePreference } from './utils/storage';
import './styles/themes.css';
import './styles/global.css';

function App() {
  const [currentView, setCurrentView] = useState('library');
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [bookContent, setBookContent] = useState(null);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(false);

  // Load theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Apply theme to body
  useEffect(() => {
    document.body.className = `${theme}-theme`;
  }, [theme]);

  async function loadThemePreference() {
    const savedTheme = await getPreference('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }

  async function handleThemeChange(newTheme) {
    setTheme(newTheme);
    await savePreference('theme', newTheme);
  }

  async function handleBookSelect(bookId) {
    setLoading(true);
    try {
      const content = await loadBookContent(bookId);
      setBookContent(content);
      setSelectedBookId(bookId);
      setCurrentView('reader');
    } catch (error) {
      console.error('Error loading book:', error);
      alert('Failed to load book. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleBackToLibrary() {
    setCurrentView('library');
    setSelectedBookId(null);
    setBookContent(null);
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading book...</p>
      </div>
    );
  }

  if (currentView === 'reader' && bookContent) {
    const bookMetadata = getBookById(selectedBookId);
    const bookWithMetadata = {
      ...bookMetadata,
      ...bookContent
    };

    return (
      <Reader
        book={bookWithMetadata}
        initialChapterId={bookContent.chapters[0].id}
        onBack={handleBackToLibrary}
        theme={theme}
        onThemeChange={handleThemeChange}
      />
    );
  }

  return (
    <Library onBookSelect={handleBookSelect} />
  );
}

export default App;
