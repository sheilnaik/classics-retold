import React from 'react';
import './ThemeSelector.css';

const THEMES = [
  { id: 'light', label: 'Light', icon: '☀️' },
  { id: 'dark', label: 'Dark', icon: '🌙' },
  { id: 'sepia', label: 'Sepia', icon: '📖' }
];

export default function ThemeSelector({ currentTheme, onThemeChange }) {
  return (
    <div className="theme-selector">
      {THEMES.map(theme => (
        <button
          key={theme.id}
          className={`theme-button ${currentTheme === theme.id ? 'active' : ''}`}
          onClick={() => onThemeChange(theme.id)}
          aria-label={`Switch to ${theme.label} theme`}
          title={theme.label}
        >
          <span className="theme-icon">{theme.icon}</span>
        </button>
      ))}
    </div>
  );
}
