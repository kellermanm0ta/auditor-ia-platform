'use client';

import { useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  to: string;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: 'bi-house', to: '/' },
  { id: 'skills', label: 'Skills', icon: 'bi-gear', to: '/skills' },
  { id: 'workflow', label: 'Workflow', icon: 'bi-diagram-3', to: '/workflow' },
  { id: 'historico', label: 'Histórico', icon: 'bi-clock-history', to: '/historico' },
  { id: 'integracoes', label: 'Integrações', icon: 'bi-puzzle', to: '/integracoes' },
  { id: 'config', label: 'Configurações', icon: 'bi-sliders', to: '/config' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Sidebar({ collapsed, onToggleSidebar, mobileOpen, onMobileClose, theme, onToggleTheme }: SidebarProps) {
  const location = useLocation();

  const handleNavClick = useCallback(() => {
    onMobileClose();
  }, [onMobileClose]);

  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? 'show' : ''}`}
        onClick={onMobileClose}
      />
      <nav className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand d-flex align-items-center justify-content-between px-3">
          <span><i className="bi bi-shield-check"></i> <span>Auditor</span><span>IA</span></span>
          <button className="sidebar-toggle d-none d-md-block" onClick={onToggleSidebar} title="Recolher">
            <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
          </button>
        </div>
        <ul className="nav flex-column">
          {navItems.map((item) => (
            <li className="nav-item" key={item.id}>
              <Link
                className={`nav-link ${location.pathname === item.to ? 'active' : ''}`}
                to={item.to}
                onClick={handleNavClick}
                role="tab"
              >
                <i className={`bi ${item.icon}`}></i> <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
          <button
            className={`btn w-100 d-flex align-items-center gap-2 border-0 sidebar-toggle ${collapsed ? 'justify-content-center px-0' : 'px-3'}`}
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            style={{
              padding: collapsed ? '10px 0' : '10px 14px',
              margin: collapsed ? '2px 8px' : '2px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill'}`} style={{ width: '18px', textAlign: 'center', marginRight: collapsed ? 0 : 10 }} />
            {!collapsed && <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
          </button>
        </div>
      </nav>
    </>
  );
}