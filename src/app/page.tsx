'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import AppTopbar from '@/components/AppTopbar';
import {
  Briefcase,
  Send,
  MessageSquare,
  Trophy,
  Clock,
  ArrowRight,
  Activity,
  FlaskConical,
  FileText,
  Target,
  BookOpen,
  Bell,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';
import type { ApplicationData } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/types';

export default function DashboardPage() {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [storyCount, setStoryCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [appsRes, storiesRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/story-bank'),
      ]);
      if (appsRes.ok) {
        const data = await appsRes.json();
        setApplications(data);
      }
      if (storiesRes.ok) {
        const sData = await storiesRes.json();
        setStoryCount(sData.length || 0);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const counts = {
    saved: applications.filter((a) => a.status === 'saved').length,
    applied: applications.filter((a) => a.status === 'applied').length,
    interviewing: applications.filter((a) => a.status === 'interviewing').length,
    offer: applications.filter((a) => a.status === 'offer').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const total = applications.length;
  const scoredApplications = applications.filter((application) => application.atsScore > 0);
  const avgScore = scoredApplications.length > 0
    ? Math.round(scoredApplications.reduce((sum, application) => sum + application.atsScore, 0) / scoredApplications.length)
    : 0;

  const now = new Date().getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const followUpCandidates = applications.filter((a) => {
    if (a.status !== 'applied') return false;
    const appDate = new Date(a.appliedAt || a.createdAt || '').getTime();
    return now - appDate >= sevenDaysMs;
  });

  const recentApps = [...applications]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  const pipelineStatuses = [
    { key: 'saved', label: 'Saved', count: counts.saved, tone: 'saved' },
    { key: 'applied', label: 'Applied', count: counts.applied, tone: 'applied' },
    { key: 'interviewing', label: 'Interviewing', count: counts.interviewing, tone: 'interviewing' },
    { key: 'offer', label: 'Offers', count: counts.offer, tone: 'offer' },
    { key: 'rejected', label: 'Closed', count: counts.rejected, tone: 'closed' },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <AppTopbar />
      <main className="main-content dashboard-content">
        <div className="dashboard-page">
          <section className="dashboard-welcome">
            <div>
              <div className="dashboard-eyebrow"><Activity size={14} /> YOUR JOB SEARCH</div>
              <h1 className="page-title">Welcome back! <span aria-hidden="true">👋</span></h1>
              <p className="page-subtitle">Your application pipeline, at a glance.</p>
            </div>
            <a href="/lab" className="btn btn-primary dashboard-primary-action">
              <FlaskConical size={16} /> Tailor a resume <ArrowRight size={15} />
            </a>
          </section>

          {followUpCandidates.length > 0 && (
            <section className="card" style={{ padding: 18, background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02))', borderColor: 'rgba(245, 158, 11, 0.3)', borderRadius: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-amber)' }}>
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {followUpCandidates.length} Application{followUpCandidates.length > 1 ? 's' : ''} Awaiting Follow-Up (7+ Days)
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                      Candidate responses increase significantly when sending a brief, polite check-in note 7 days after applying.
                    </p>
                  </div>
                </div>
                <a href="/applications" className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--border-secondary)' }}>
                  View All in Job Log &rarr;
                </a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                {followUpCandidates.slice(0, 3).map((app) => (
                  <div key={app.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-secondary)', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{app.jobTitle}</strong>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>at {app.company}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <a href={`/lab?appId=${app.id}`} className="btn btn-ghost btn-sm" style={{ fontSize: 11, height: 26, padding: '0 8px', color: 'var(--accent-primary)' }}>
                        <FlaskConical size={12} /> Re-open in Lab
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="dashboard-quick-actions" aria-label="Quick actions">
            <a href="/resume" className="action-card">
              <span className="action-card-icon"><FileText size={19} /></span>
              <span><strong className="action-card-title">Master Resume</strong><small className="action-card-desc">Edit career profile</small></span>
              <ArrowRight className="action-card-arrow" size={16} />
            </a>
            <a href="/applications" className="action-card">
              <span className="action-card-icon"><Briefcase size={19} /></span>
              <span><strong className="action-card-title">Job Log</strong><small className="action-card-desc">Review your applications</small></span>
              <ArrowRight className="action-card-arrow" size={16} />
            </a>
            <a href="/lab" className="action-card">
              <span className="action-card-icon"><FlaskConical size={19} /></span>
              <span><strong className="action-card-title">The Lab</strong><small className="action-card-desc">Create tailored materials</small></span>
              <ArrowRight className="action-card-arrow" size={16} />
            </a>
            <a href="/guidelines" className="action-card">
              <span className="action-card-icon"><BookOpen size={19} /></span>
              <span><strong className="action-card-title">User Guide</strong><small className="action-card-desc">How Applikator works</small></span>
              <ArrowRight className="action-card-arrow" size={16} />
            </a>
          </section>

          <section className="dashboard-stat-grid" aria-label="Application totals">
            <article className="dashboard-stat-card stat-saved"><span className="dashboard-stat-icon"><Briefcase size={17} /></span><span className="dashboard-stat-label">Saved</span><strong>{counts.saved}</strong><small>Roles to explore</small></article>
            <article className="dashboard-stat-card stat-applied"><span className="dashboard-stat-icon"><Send size={17} /></span><span className="dashboard-stat-label">Applied</span><strong>{counts.applied}</strong><small>Applications sent</small></article>
            <article className="dashboard-stat-card stat-interviewing"><span className="dashboard-stat-icon"><MessageSquare size={17} /></span><span className="dashboard-stat-label">Interviewing</span><strong>{counts.interviewing}</strong><small>Active conversations</small></article>
            <article className="dashboard-stat-card stat-offers"><span className="dashboard-stat-icon"><Trophy size={17} /></span><span className="dashboard-stat-label">Offers</span><strong>{counts.offer}</strong><small>Positive outcomes</small></article>
          </section>

          <section className="dashboard-insights-grid" aria-label="Job search insights">
            <article className="card dashboard-panel dashboard-pipeline-panel">
              <div className="dashboard-panel-heading">
                <div><span className="dashboard-panel-kicker">OVERVIEW</span><h2>Application pipeline</h2></div>
                <a href="/applications" className="dashboard-text-link">View job log <ArrowRight size={14} /></a>
              </div>
              {total > 0 ? (
                <>
                  <div className="pipeline-summary"><strong>{total}</strong><span>tracked {total === 1 ? 'role' : 'roles'}</span></div>
                  <div className="pipeline-bar" role="img" aria-label={pipelineStatuses.map((status) => `${status.count} ${status.label.toLowerCase()}`).join(', ')}>
                    {pipelineStatuses.map((status) => (
                      status.count > 0 && <span key={status.key} className={`pipeline-segment ${status.tone}`} style={{ width: `${(status.count / total) * 100}%` }} />
                    ))}
                  </div>
                  <div className="pipeline-legend">
                    {pipelineStatuses.map((status) => (
                      <div key={status.key} className="pipeline-legend-item">
                        <span className={`pipeline-legend-dot ${status.tone}`} />
                        <span>{status.label}</span>
                        <strong>{status.count}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="dashboard-panel-empty"><span className="dashboard-empty-icon"><Briefcase size={20} /></span><p>Add roles to start building your pipeline.</p><a href="/applications">Open Job Log <ArrowRight size={14} /></a></div>
              )}
            </article>

            <article className="card dashboard-panel dashboard-score-panel">
              <div className="dashboard-panel-heading">
                <div><span className="dashboard-panel-kicker">RESUME ALIGNMENT</span><h2>Average ATS match</h2></div>
                <Target size={18} className="dashboard-panel-heading-icon" />
              </div>
              <div className="dashboard-score-content">
                <div className="dashboard-score-ring">
                  <svg viewBox="0 0 96 96" aria-hidden="true">
                    <circle cx="48" cy="48" r="39" fill="none" stroke="var(--border-primary)" strokeWidth="7" />
                    <circle
                      cx="48"
                      cy="48"
                      r="39"
                      fill="none"
                      stroke="var(--accent-primary)"
                      strokeWidth="7"
                      strokeDasharray={`${2 * Math.PI * 39}`}
                      strokeDashoffset={`${2 * Math.PI * 39 * (1 - avgScore / 100)}`}
                      transform="rotate(-90 48 48)"
                    />
                  </svg>
                  <span>{scoredApplications.length ? `${avgScore}%` : '—'}</span>
                </div>
                <div className="dashboard-score-copy">
                  <strong>{scoredApplications.length ? `${scoredApplications.length} ${scoredApplications.length === 1 ? 'resume scored' : 'resumes scored'}` : 'No scores yet'}</strong>
                  <span>{scoredApplications.length ? 'Average across scored applications' : 'Analyze a role in The Lab to get an ATS match.'}</span>
                  <a href="/lab">Analyze a role <ArrowRight size={14} /></a>
                </div>
              </div>
            </article>

            <article className="card dashboard-panel dashboard-score-panel">
              <div className="dashboard-panel-heading">
                <div><span className="dashboard-panel-kicker">STORY BANK</span><h2>Interview & Cover Letter Fuel</h2></div>
                <Bookmark size={18} className="dashboard-panel-heading-icon" />
              </div>
              <div className="dashboard-score-content">
                <div className="dashboard-score-ring">
                  <svg viewBox="0 0 96 96" aria-hidden="true">
                    <circle cx="48" cy="48" r="39" fill="none" stroke="var(--border-primary)" strokeWidth="7" />
                    <circle
                      cx="48"
                      cy="48"
                      r="39"
                      fill="none"
                      stroke="var(--accent-purple)"
                      strokeWidth="7"
                      strokeDasharray={`${2 * Math.PI * 39}`}
                      strokeDashoffset={`${2 * Math.PI * 39 * (1 - Math.min(100, (storyCount / 5) * 100) / 100)}`}
                      transform="rotate(-90 48 48)"
                    />
                  </svg>
                  <span>{storyCount}/5</span>
                </div>
                <div className="dashboard-score-copy">
                  <strong>{storyCount >= 5 ? 'Strong Story Bank' : `${storyCount} of 5 stories ready`}</strong>
                  <span>{storyCount >= 5 ? 'Your stories enrich tailored cover letters and interview simulations.' : 'Add STAR stories to supercharge personalized AI cover letters.'}</span>
                  <a href="/story-bank">Open Story Bank <ArrowRight size={14} /></a>
                </div>
              </div>
            </article>
          </section>

          <section className="card dashboard-panel dashboard-recent-panel">
            <div className="dashboard-panel-heading">
              <div><span className="dashboard-panel-kicker">LATEST UPDATES</span><h2>Recent applications</h2></div>
              <a href="/applications" className="dashboard-text-link">All applications <ArrowRight size={14} /></a>
            </div>
            {loading ? (
              <div className="dashboard-loading" aria-label="Loading applications"><span className="spinner" /></div>
            ) : recentApps.length === 0 ? (
              <div className="dashboard-panel-empty dashboard-recent-empty">
                <span className="dashboard-empty-icon"><Clock size={20} /></span>
                <p>No applications to show yet. Your recent activity will appear here.</p>
                <a href="/applications">Open Job Log <ArrowRight size={14} /></a>
              </div>
            ) : (
              <div className="dashboard-recent-list">
                {recentApps.map((app) => (
                  <div key={app.id} className="dashboard-recent-row">
                    <span className="dashboard-company-mark"><Briefcase size={16} /></span>
                    <div className="dashboard-recent-role"><strong>{app.jobTitle}</strong><span>{app.company}</span></div>
                    <div className="dashboard-recent-meta">
                      {app.atsScore > 0 && <span className={`dashboard-ats-score ${app.atsScore >= 70 ? 'strong' : app.atsScore >= 40 ? 'moderate' : 'low'}`}>{app.atsScore}% match</span>}
                      <span className={`dashboard-status status-${app.status}`}>{STATUS_LABELS[app.status] || app.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
