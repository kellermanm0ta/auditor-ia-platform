'use client';

import { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/shared/Sidebar';
import TopNavbar from '@/components/shared/TopNavbar';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function AppTemplate() {
  const [collapsed, setCollapsed] = useLocalStorage('sidebar-collapsed', false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  const toggleSidebar = useCallback(() => setCollapsed((prev) => !prev), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleTheme = useCallback(() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')), []);

  return (
    <div className="d-flex flex-column flex-md-row">
      <Sidebar
        collapsed={collapsed}
        onToggleSidebar={toggleSidebar}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className={`main-content flex-grow-1 ${collapsed ? 'expanded' : ''}`}>
        <TopNavbar onHamburgerClick={openMobile} theme={theme} onToggleTheme={toggleTheme} />
        <div className="tab-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}