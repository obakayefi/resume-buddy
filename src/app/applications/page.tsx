'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { Briefcase, Eye, Trash2, X, FileText, Download, Target, Sparkles, Send, Plus, Search, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { ApplicationData, MasterResumeData, OptimizedBullet } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/types';
import PDFDownloadButton from '@/components/PDFDownloadButton';
import Link from 'next/link';

const COLUMN_CONFIG: { status: string; title: string; color: string; dotBg: string }[] = [
  { status: 'saved', title: 'Drafts', color: 'var(--text-muted)', dotBg: '#64748b' },
  { status: 'applied', title: 'Applied', color: 'var(--accent-blue)', dotBg: '#3b82f6' },
  { status: 'interviewing', title: 'Interviewing', color: 'var(--accent-purple)', dotBg: '#a855f7' },
  { status: 'offer', title: 'Offers', color: 'var(--accent-green)', dotBg: '#22c55e' },
  { status: 'rejected', title: 'Rejected', color: 'var(--accent-red)', dotBg: '#ef4444' },
];

export default function ApplicationsPage() {
  const [apps, setApps] = useState<ApplicationData[]>([]);
  const [resumes, setResumes] = useState<MasterResumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ApplicationData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [appsRes, resumesRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/resumes')
      ]);
      
      if (appsRes.ok) setApps(await appsRes.json());
      if (resumesRes.ok) setResumes(await resumesRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch(e) {
      console.error(e);
    }
  };

  const deleteApp = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      fetchData();
    } catch(e) {
      console.error(e);
    }
  };

  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return apps;
    const q = searchQuery.toLowerCase();
    return apps.filter(a => 
      a.company?.toLowerCase().includes(q) || 
      a.jobTitle?.toLowerCase().includes(q)
    );
  }, [apps, searchQuery]);

  const renderKanbanColumn = (config: typeof COLUMN_CONFIG[0]) => {
    const columnApps = filteredApps.filter(a => a.status === config.status);
    
    return (
      <div className="kanban-column" key={config.status} style={{ minWidth: 280, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="kanban-column-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="kanban-column-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: config.dotBg, display: 'inline-block' }} />
            {config.title}
          </div>
          <div className="kanban-column-count">{columnApps.length}</div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          {columnApps.length === 0 ? (
            <div style={{
              padding: '28px 16px',
              textAlign: 'center',
              border: '1px dashed var(--border-secondary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              fontSize: 12,
            }}>
              No applications
            </div>
          ) : (
            columnApps.map(app => (
              <div
                key={app.id}
                className="kanban-card"
                style={{
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div className="kanban-card-company" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-primary)' }}>
                    {app.company}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ padding: 4, width: 24, height: 24 }}
                      onClick={() => setSelectedApp(app)}
                      title="View Details"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ padding: 4, width: 24, height: 24 }}
                      onClick={() => deleteApp(app.id!)}
                      title="Delete Application"
                    >
                      <Trash2 size={13} style={{ color: 'var(--accent-red)' }} />
                    </button>
                  </div>
                </div>

                <div className="kanban-card-title" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>
                  {app.jobTitle}
                </div>
                
                {app.atsScore > 0 && (
                  <div>
                    <span className={`badge ${app.atsScore >= 70 ? 'badge-success' : app.atsScore >= 40 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: 11, padding: '3px 8px' }}>
                      ATS Alignment: {app.atsScore}%
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 10, borderTop: '1px solid var(--border-secondary)', gap: 8 }}>
                  <select 
                    className="form-select" 
                    style={{ fontSize: 11, padding: '4px 8px', height: 'auto', flex: 1 }}
                    value={app.status}
                    onChange={(e) => updateStatus(app.id!, e.target.value)}
                  >
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>

                  {app.status === 'saved' && (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      onClick={() => updateStatus(app.id!, 'applied')}
                    >
                      Apply
                    </button>
                  )}
                  
                  {(() => {
                    if (!app.optimizedResume || app.optimizedResume === '') return null;
                    const linkedResume = resumes.find(r => r.id === app.masterResumeId);
                    if (!linkedResume) return null;
                    try {
                      const bullets = JSON.parse(app.optimizedResume);
                      return (
                        <PDFDownloadButton 
                          resume={linkedResume} 
                          optimizedBullets={bullets} 
                        />
                      );
                    } catch (e) {
                      return null;
                    }
                  })()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        
        {/* Top Page Header */}
        <div className="page-header" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 24, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Briefcase size={28} style={{ color: 'var(--accent-primary)' }} /> Job Application Tracker
            </h1>
            <p className="page-subtitle">
              Manage your job search pipeline, inspect ATS score reports, export tailored resumes, and track interviews.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <Link
              href="/lab"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={18} /> New Application in The Lab
            </Link>
          </div>
        </div>

        {/* Filter & Metric Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search company or job title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 36, width: '100%', fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            <span>Total: <strong style={{ color: 'var(--text-primary)' }}>{apps.length}</strong></span>
            <span>Active: <strong style={{ color: 'var(--accent-blue)' }}>{apps.filter(a => a.status === 'applied' || a.status === 'interviewing').length}</strong></span>
            <span>Offers: <strong style={{ color: 'var(--accent-green)' }}>{apps.filter(a => a.status === 'offer').length}</strong></span>
          </div>
        </div>

        {/* Kanban Board Container */}
        {loading ? (
          <div className="loading-overlay" style={{ height: 350, background: 'transparent' }}>
            <div className="spinner" /> Loading applications...
          </div>
        ) : apps.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <div className="empty-state-icon"><Briefcase size={36} /></div>
            <p className="empty-state-title">No Applications Tracked Yet</p>
            <p className="empty-state-text">Head over to The Lab to analyze a job description and generate tailored bullet points.</p>
            <Link href="/lab" className="btn btn-primary" style={{ marginTop: 20 }}>
              Launch The Lab
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(280px, 1fr))',
            gap: 16,
            overflowX: 'auto',
            paddingBottom: 24,
            alignItems: 'start',
          }}>
            {COLUMN_CONFIG.map(config => renderKanbanColumn(config))}
          </div>
        )}

        {selectedApp && (
          <ApplicationDetailModal 
            app={selectedApp} 
            onClose={() => setSelectedApp(null)} 
            masterResume={resumes.find(r => r.id === selectedApp.masterResumeId)}
          />
        )}
      </main>
    </div>
  );
}

function ApplicationDetailModal({ app, onClose, masterResume }: { 
  app: ApplicationData; 
  onClose: () => void;
  masterResume?: MasterResumeData;
}) {
  const [activeTab, setActiveTab] = useState<'resume' | 'cover' | 'outreach' | 'job'>('resume');
  let optimizedBullets: OptimizedBullet[] = [];
  let generationTimes: Record<string, number> = {};
  
  try {
    optimizedBullets = app.optimizedResume ? JSON.parse(app.optimizedResume) : [];
    if (app.generationTimes) {
      generationTimes = typeof app.generationTimes === 'string' ? JSON.parse(app.generationTimes) : app.generationTimes;
    }
  } catch (e) {
    console.error('Failed to parse app data in modal:', e);
  }

  const totalAI = Object.values(generationTimes).reduce((a, b) => a + Number(b), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 900, width: '90%', height: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="modal-title" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{app.jobTitle} @ {app.company}</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span>{STATUS_LABELS[app.status]} — Created on {new Date(app.createdAt || '').toLocaleDateString()}</span>
              {totalAI > 0 && (
                <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', fontSize: 11 }}>
                  <Sparkles size={12} /> AI Time: {(totalAI / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-secondary)', padding: '0 24px', background: 'var(--bg-secondary)' }}>
          <button
            className={`tab ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => setActiveTab('resume')}
            style={{
              padding: '12px 18px',
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'resume' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'resume' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Resume & ATS
          </button>
          <button
            className={`tab ${activeTab === 'cover' ? 'active' : ''}`}
            onClick={() => setActiveTab('cover')}
            style={{
              padding: '12px 18px',
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'cover' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'cover' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Cover Letter
          </button>
          <button
            className={`tab ${activeTab === 'outreach' ? 'active' : ''}`}
            onClick={() => setActiveTab('outreach')}
            style={{
              padding: '12px 18px',
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'outreach' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'outreach' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Outreach
          </button>
          <button
            className={`tab ${activeTab === 'job' ? 'active' : ''}`}
            onClick={() => setActiveTab('job')}
            style={{
              padding: '12px 18px',
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'job' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'job' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Job Details
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {activeTab === 'resume' && (
            <div style={{ display: 'grid', gridTemplateColumns: app.atsScore > 0 ? '180px 1fr' : '1fr', gap: 24 }}>
              {app.atsScore > 0 && (
                <div>
                  <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>ATS Score</h3>
                  <div className="card" style={{ 
                    padding: 24, 
                    textAlign: 'center', 
                    background: app.atsScore >= 70 ? 'rgba(34, 197, 94, 0.1)' : app.atsScore >= 40 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid',
                    borderColor: app.atsScore >= 70 ? 'var(--accent-green)' : app.atsScore >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: app.atsScore >= 70 ? 'var(--accent-green)' : app.atsScore >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{app.atsScore}%</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Alignment</div>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {app.optimizedSummary && (
                  <div>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} /> Tailored Professional Summary
                    </h3>
                    <div style={{ padding: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {app.optimizedSummary}
                    </div>
                  </div>
                )}

                {optimizedBullets.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={14} style={{ color: 'var(--accent-green)' }} /> Optimized Experience Bullets
                      </h3>
                      {masterResume && (
                        <PDFDownloadButton resume={masterResume} optimizedBullets={optimizedBullets} />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {optimizedBullets.map((b, i) => (
                        <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{b.optimized}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontStyle: 'italic' }}>Original: {b.original.substring(0, 50)}...</span>
                            <span className={`badge ${b.relevance === 'high' ? 'badge-success' : b.relevance === 'medium' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: 9, padding: '2px 6px' }}>{b.relevance}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {!app.optimizedSummary && optimizedBullets.length === 0 && (
                  <div className="empty-state" style={{ padding: '40px 0' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No optimized content was generated for this resume yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cover' && (
            <div>
              {app.coverLetter ? (
                <div style={{ maxWidth: 700, margin: '0 auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={14} /> Tailored Cover Letter
                    </h3>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => {
                        const blob = new Blob([app.coverLetter], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `CoverLetter_${app.company.replace(/\s+/g, '_')}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download size={14} /> Download TXT
                    </button>
                  </div>
                  <div style={{ 
                    padding: '32px 40px', 
                    background: 'var(--bg-primary)', 
                    border: '1px solid var(--border-secondary)', 
                    borderRadius: 'var(--radius-md)', 
                    fontSize: 14, 
                    lineHeight: 1.7, 
                    fontFamily: 'serif', 
                    color: 'var(--text-primary)', 
                    whiteSpace: 'pre-wrap',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {app.coverLetter}
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '40px 0' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No cover letter has been generated for this application.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'outreach' && (
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
              {(app.recruiterName || app.recruiterLinkedin) && (
                <div style={{ marginBottom: 24, padding: 16, background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: 'var(--radius-md)' }}>
                  <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Recruiter Info</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {app.recruiterName && <div style={{ fontWeight: 600 }}>{app.recruiterName}</div>}
                    {app.recruiterLinkedin && (
                      <a href={app.recruiterLinkedin.startsWith('http') ? app.recruiterLinkedin : `https://${app.recruiterLinkedin}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontSize: 13, textDecoration: 'none' }}>
                        LinkedIn Profile &rarr;
                      </a>
                    )}
                  </div>
                </div>
              )}

              {app.linkedinMessage ? (
                <div>
                   <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Send size={14} /> Outreach Message
                  </h3>
                  <div style={{ padding: 24, background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)', fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    {app.linkedinMessage}
                  </div>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ marginTop: 12 }}
                    onClick={() => {
                      navigator.clipboard.writeText(app.linkedinMessage);
                      alert('Message copied to clipboard!');
                    }}
                  >
                    Copy to Clipboard
                  </button>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '40px 0' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No outreach message has been generated.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'job' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              <div>
                <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Target size={14} /> Job Description
                </h3>
                <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 'var(--radius-md)', fontSize: 13, lineHeight: 1.6, maxHeight: 500, overflowY: 'auto', border: '1px solid var(--border-secondary)', whiteSpace: 'pre-wrap' }}>
                  {app.jobDescription || 'No description saved.'}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Application Notes</h3>
                  <div style={{ padding: 16, background: 'rgba(234, 179, 8, 0.05)', border: '1px solid var(--accent-amber)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {app.notes || 'No notes added yet.'}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Location</span>
                      <span>{app.location || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Salary</span>
                      <span>{app.salary || 'N/A'}</span>
                    </div>
                    {app.jobUrl && (
                      <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', marginTop: 4 }}>
                        View Original Posting &rarr;
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
