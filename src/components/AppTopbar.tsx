'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Sparkles } from 'lucide-react';

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/resume': 'Master Resume',
  '/applications': 'Job Log',
  '/scholarships': 'Scholarships',
  '/story-bank': 'Story Bank',
  '/lab': 'The Lab',
  '/ui-kit': 'UI Kit',
  '/settings': 'Settings',
};

export default function AppTopbar() {
  const pathname = usePathname();
  const scholarshipDetail = pathname.startsWith('/scholarships/') && pathname !== '/scholarships';
  const currentPage = scholarshipDetail ? 'Scholarship Workspace' : (routeLabels[pathname] || 'Workspace');

  return (
    <header className="workspace-topbar">
      <nav className="workspace-breadcrumb" aria-label="Breadcrumb">
        <span>Workspace</span>
        <ChevronRight size={14} aria-hidden="true" />
        <strong>{currentPage}</strong>
      </nav>
      <div className="workspace-topbar-actions">
        <span className="workspace-local-badge"><span aria-hidden="true" /> Local workspace</span>
        {pathname !== '/lab' && (
          <Link className="workspace-lab-link" href="/lab">
            <Sparkles size={15} aria-hidden="true" /> Open The Lab
          </Link>
        )}
      </div>
    </header>
  );
}
