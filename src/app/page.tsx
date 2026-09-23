'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  Briefcase,
  Send,
  MessageSquare,
  Trophy,
  XCircle,
  TrendingUp,
  Clock,
  Plus,
  Settings,
  FlaskConical,
  FileText,
} from 'lucide-react';
import type { ApplicationData } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/types';

export default function DashboardPage() {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (e) {
      console.error('Failed to fetch applications:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const counts = {
    saved: applications.filter((a) => a.status === 'saved').length,
    applied: applications.filter((a) => a.status === 'applied').length,
    interviewing: applications.filter((a) => a.status === 'interviewing').length,
    offer: applications.filter((a) => a.status === 'offer').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const total = applications.length;
  const avgScore = total > 0
    ? Math.round(applications.reduce((sum, a) => sum + (a.atsScore || 0), 0) / total)
    : 0;

  const recentApps = [...applications]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <div className="dashboard-grid">
          
          {/* LEFT AREA: MAIN CONTENT */}
          <div className="dashboard-main">
            <div className="page-header">
              <h1 className="page-title">Welcome back! 👋</h1>
              <p className="page-subtitle">Here&apos;s an overview of your job search pipeline</p>
            </div>

            {/* Quick Action Hub */}
            <div className="action-center-grid">
              <a href="/lab" className="action-card">
                <div className="action-card-icon"><FlaskConical size={20} /></div>
                <div>
                  <div className="action-card-title">AI Lab</div>
                  <div className="action-card-desc">Optimize & Tailor</div>
                </div>
              </a>
              <a href="/resume" className="action-card">
                <div className="action-card-icon"><FileText size={20} /></div>
                <div>
                  <div className="action-card-title">Master Resume</div>
                  <div className="action-card-desc">Edit Core Skills</div>
                </div>
              </a>
              <a href="/applications" className="action-card">
                <div className="action-card-icon"><Briefcase size={20} /></div>
                <div>
                  <div className="action-card-title">Job Log</div>
                  <div className="action-card-desc">Track Applications</div>
                </div>
              </a>
            </div>
            
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Pipeline Status</h2>
            <div className="stats-grid">
              <div className="stat-card" style={{ '--card-accent': 'var(--accent-primary)' } as any}>
                <div className="stat-icon indigo"><Briefcase size={22} /></div>
                <div>
                  <div className="stat-value">{counts.saved}</div>
                  <div className="stat-label">Saved Jobs</div>
                </div>
              </div>
              <div className="stat-card" style={{ '--card-accent': 'var(--accent-blue)' } as any}>
                <div className="stat-icon blue"><Send size={22} /></div>
                <div>
                  <div className="stat-value">{counts.applied}</div>
                  <div className="stat-label">Applied</div>
                </div>
              </div>
              <div className="stat-card" style={{ '--card-accent': 'var(--accent-amber)' } as any}>
                <div className="stat-icon amber"><MessageSquare size={22} /></div>
                <div>
                  <div className="stat-value">{counts.interviewing}</div>
                  <div className="stat-label">Interviewing</div>
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, marginTop: 16 }}>Recent Activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {loading ? (
                <div className="loading-overlay" style={{ height: 200, background: 'transparent' }}>
                  <div className="spinner" />
                </div>
              ) : recentApps.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px' }}>
                  <div className="empty-state-icon"><Clock size={28} /></div>
                  <p className="empty-state-text">No active applications found.</p>
                </div>
              ) : (
                recentApps.map((app) => (
                  <div key={app.id} className="list-row">
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{app.jobTitle}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{app.company}</div>
                    </div>
                    {app.atsScore > 0 && (
                      <span className={`badge ${app.atsScore >= 70 ? 'badge-success' : app.atsScore >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                        {app.atsScore}% ATS
                      </span>
                    )}
                    <span className="badge badge-info">{STATUS_LABELS[app.status] || app.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT AREA: SIDEBAR / STATS */}
          <div className="dashboard-sidebar">
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Statistics</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="sidebar-stat-row">
                  <div className="circular-progress" style={{ '--progress': avgScore } as any}>
                    <span>{avgScore}</span>
                  </div>
                  <div className="sidebar-stat-info">
                    <div className="sidebar-stat-title">Avg. ATS Match</div>
                    <div className="sidebar-stat-desc">per application</div>
                  </div>
                </div>

                <div className="sidebar-stat-row">
                  <div className="circular-progress" style={{ '--progress': Math.min(100, Math.max(0, total * 5)) } as any}>
                    <span>{total}</span>
                  </div>
                  <div className="sidebar-stat-info">
                    <div className="sidebar-stat-title">Total Active</div>
                    <div className="sidebar-stat-desc">tracked jobs</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 'auto', background: 'linear-gradient(145deg, var(--bg-elevated) 0%, var(--bg-card) 100%)', textAlign: 'center', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <TrendingUp size={24} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Optimize Your Next Role!</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
                Use AI to align your master resume exactly with the job description.
              </p>
              <a href="/lab" className="btn btn-primary" style={{ width: '100%', padding: '12px 0' }}>
                Go to The Lab
              </a>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
