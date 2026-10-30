'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FlaskConical,
  FileText,
  Briefcase,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  GraduationCap,
  Bookmark,
  Blocks,
  LayoutGrid,
  X,
  BookOpen,
} from 'lucide-react';
import { ApplikatorLogo } from './ApplikatorLogo';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/resume', label: 'Master Resume', icon: FileText },
  { href: '/applications', label: 'Job Log', icon: Briefcase },
  { href: '/scholarships', label: 'Scholarships', icon: GraduationCap },
  { href: '/story-bank', label: 'Story Bank', icon: Bookmark },
  { href: '/lab', label: 'The Lab', icon: FlaskConical },
  { href: '/guidelines', label: 'User Guide', icon: BookOpen },
  { href: '/ui-kit', label: 'UI Kit', icon: Blocks },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('sidebar-collapsed') === 'true') {
      const frame = window.requestAnimationFrame(() => setCollapsed(true));
      return () => window.cancelAnimationFrame(frame);
    }
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  return (
    <aside className={`sidebar app-topbar app-sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Application sidebar">
      <Link href="/" className="sidebar-logo" aria-label="Applikator home">
        <span className="sidebar-logo-icon applikator-logo-wrapper"><ApplikatorLogo size={28} /></span>
        <span className="sidebar-logo-text">Applikator</span>
      </Link>

      <button
        type="button"
        className="sidebar-mobile-menu"
        aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileNavOpen}
        aria-controls="app-mobile-navigation"
        onClick={() => setMobileNavOpen((open) => !open)}
      >
        {mobileNavOpen ? <X size={19} /> : <LayoutGrid size={19} />}
      </button>

      <nav id="app-mobile-navigation" className={`sidebar-nav ${mobileNavOpen ? 'mobile-nav-open' : ''}`} aria-label="Main navigation">
        {navItems.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${active ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              aria-current={active ? 'page' : undefined}
              onClick={() => setMobileNavOpen(false)}
            >
              <span className="sidebar-nav-icon" aria-hidden="true"><item.icon size={17} /></span>
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <OllamaStatus />
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={toggleCollapse}
          title={collapsed ? 'Expand navigation' : 'Compact navigation'}
          aria-label={collapsed ? 'Expand navigation' : 'Compact navigation'}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>
    </aside>
  );
}

function OllamaStatus() {
  return (
    <div className="ollama-status" title="Ollama Status">
      <span className="status-dot connected" id="ollama-status-dot" />
      <span className="ollama-status-label">Ollama Active</span>
    </div>
  );
}
