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
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  GraduationCap,
  Bookmark
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/resume', label: 'Master Resume', icon: FileText },
  { href: '/applications', label: 'Job Log', icon: Briefcase },
  { href: '/scholarships', label: 'Scholarships', icon: GraduationCap },
  { href: '/story-bank', label: 'Story Bank', icon: Bookmark },
  { href: '/lab', label: 'The Lab', icon: FlaskConical },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  if (!mounted) return <aside className="sidebar" />; // Avoid hydration mismatch

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Link href="/" className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Zap size={22} fill="white" color="white" />
            </div>
            {!collapsed && (
              <div>
                <div className="sidebar-logo-text">Resume Buddy</div>
                <div className="sidebar-logo-sub">Local AI Optimizer</div>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button className="sidebar-collapse-btn" onClick={toggleCollapse} title="Collapse sidebar">
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
             <button className="sidebar-collapse-btn" onClick={toggleCollapse} title="Expand sidebar">
               <PanelLeftOpen size={20} />
             </button>
          </div>
        )}
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <item.icon size={20} />
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <OllamaStatus collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}

function OllamaStatus({ collapsed }: { collapsed?: boolean }) {
  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 10, 
        fontSize: 12, 
        fontWeight: 500,
        color: 'var(--text-secondary)',
        padding: '2px 4px'
      }} 
      title="Ollama Status"
    >
      <span className="status-dot connected" id="ollama-status-dot" style={{ width: 8, height: 8 }} />
      {!collapsed && <span style={{ letterSpacing: '0.02em' }}>Ollama Active</span>}
    </div>
  );
}

