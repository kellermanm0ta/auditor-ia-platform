'use client';

interface TopNavbarProps {
  onHamburgerClick: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function TopNavbar({ onHamburgerClick, theme, onToggleTheme }: TopNavbarProps) {
  return (
    <div className="navbar-top">
      <button className="hamburger-btn" onClick={onHamburgerClick}>
        <i className="bi bi-list"></i>
      </button>
      <div className="brand">
        <i className="bi bi-shield-check"></i> <span>Auditor</span>IA
      </div>
      <button
        className="hamburger-btn"
        onClick={onToggleTheme}
        title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
      >
        <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill'}`}></i>
      </button>
    </div>
  );
}