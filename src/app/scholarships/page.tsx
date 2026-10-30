'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import AppTopbar from '@/components/AppTopbar';
import Modal from '@/components/Modal';
import { SelectField, useConfirmDialog } from '@/components/ui';
import { Scholarship, SCHOLARSHIP_STATUS_LABELS, SCHOLARSHIP_STATUS_COLORS } from '@/lib/types';
import Link from 'next/link';
import { GraduationCap, Plus, Calendar, DollarSign, Cpu, Shield, Sparkles, ExternalLink, CheckCircle2, Clock, Trash2, X, Search, FileText, ArrowUpRight } from 'lucide-react';

const TRACK_BADGES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  AI: { label: 'AI & Machine Learning', bg: '#f1edff', color: '#6741b8', border: '#dfd5ff' },
  Cybersecurity: { label: 'Cybersecurity & Defense', bg: '#eaf6ef', color: '#28794b', border: '#cee9d8' },
  General: { label: 'General STEM', bg: '#edf3ff', color: '#315fae', border: '#d7e3fc' },
  Diversity: { label: 'Diversity & Inclusion', bg: '#fff0f4', color: '#a83f69', border: '#f5d4df' },
};

export default function ScholarshipsDashboardPage() {
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New scholarship form states
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [track, setTrack] = useState<'AI' | 'Cybersecurity' | 'General' | 'Diversity'>('AI');
  const [url, setUrl] = useState('');
  const [awardAmount, setAwardAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<'saved' | 'drafting' | 'review' | 'submitted' | 'awarded'>('saved');
  const [notes, setNotes] = useState('');

  // Initial questions input
  const [questionPrompts, setQuestionPrompts] = useState<string[]>(['']);

  useEffect(() => {
    fetchScholarships();
  }, []);

  const fetchScholarships = async () => {
    try {
      const res = await fetch('/api/scholarships');
      if (res.ok) {
        const data = await res.json();
        setScholarships(data);
      }
    } catch (e) {
      console.error('Failed to load scholarships', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !organization.trim()) return;

    const initialQuestions = questionPrompts
      .filter(p => p.trim())
      .map(p => ({ prompt: p.trim(), maxWords: 300, maxChars: 0, status: 'todo' }));

    try {
      const res = await fetch('/api/scholarships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          organization,
          track,
          url,
          awardAmount,
          deadline,
          status,
          notes,
          questions: initialQuestions,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setScholarships([created, ...scholarships]);
        setIsModalOpen(false);
        // Reset form
        setName('');
        setOrganization('');
        setTrack('AI');
        setUrl('');
        setAwardAmount('');
        setDeadline('');
        setStatus('saved');
        setNotes('');
        setQuestionPrompts(['']);
      }
    } catch (e) {
      console.error('Failed to create scholarship', e);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!await confirm({ title: 'Delete scholarship application?', description: 'This will remove the application and its saved responses.', confirmLabel: 'Delete application' })) return;

    try {
      const res = await fetch(`/api/scholarships/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setScholarships(scholarships.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete scholarship', e);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prevScholarships = [...scholarships];
    setScholarships(prev => prev.map(s => s.id === id ? { ...s, status: newStatus as any } : s));

    try {
      const res = await fetch(`/api/scholarships/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setScholarships(prevScholarships);
      }
    } catch {
      setScholarships(prevScholarships);
    }
  };

  const filteredScholarships = scholarships.filter(s => {
    const trackMatch = selectedTrack === 'All' || s.track === selectedTrack;
    const statusMatch = selectedStatus === 'All' || s.status === selectedStatus;
    const query = searchQuery.trim().toLowerCase();
    const searchMatch = !query || `${s.name} ${s.organization} ${s.track}`.toLowerCase().includes(query);
    return trackMatch && statusMatch && searchMatch;
  });

  const inProgressCount = scholarships.filter((item) => item.status === 'saved' || item.status === 'drafting' || item.status === 'review').length;
  const submittedCount = scholarships.filter((item) => item.status === 'submitted' || item.status === 'awarded').length;
  const promptCount = scholarships.reduce((sum, item) => sum + (item.questions || []).length, 0);
  const completedPromptCount = scholarships.reduce((sum, item) => sum + (item.questions || []).filter((question) => question.status === 'done' || question.answer.trim().length > 0).length, 0);

  return (
    <div className="app-layout">
      <Sidebar />
      <AppTopbar />
      {confirmDialog}
      <main className="main-content scholarships-page">
        {/* Top Header */}
        <div className="page-header scholarships-page-header">
          <div>
            <div className="scholarships-eyebrow">APPLICATION TRACKER</div>
            <h1 className="page-title scholarships-page-title">
              <GraduationCap size={25} aria-hidden="true" /> Scholarships
            </h1>
            <p className="page-subtitle">
              Keep every opportunity, deadline, and essay prompt moving forward.
            </p>
          </div>
          <div className="scholarships-page-actions">
            <Link href="/story-bank" className="btn btn-ghost">
              <Sparkles size={16} /> Story Bank
            </Link>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Plus size={18} /> New Application
            </button>
          </div>
        </div>

        <section className="scholarship-overview" aria-label="Scholarship overview">
          <div className="scholarship-overview-card"><span className="scholarship-overview-icon"><GraduationCap size={17} /></span><span className="scholarship-overview-label">Tracked opportunities</span><strong>{scholarships.length}</strong><small>Across all tracks</small></div>
          <div className="scholarship-overview-card"><span className="scholarship-overview-icon is-blue"><Clock size={17} /></span><span className="scholarship-overview-label">In progress</span><strong>{inProgressCount}</strong><small>Saved, drafting, or in review</small></div>
          <div className="scholarship-overview-card"><span className="scholarship-overview-icon is-green"><CheckCircle2 size={17} /></span><span className="scholarship-overview-label">Submitted or awarded</span><strong>{submittedCount}</strong><small>Applications sent or won</small></div>
          <div className="scholarship-overview-card"><span className="scholarship-overview-icon is-purple"><FileText size={17} /></span><span className="scholarship-overview-label">Essay prompts ready</span><strong>{completedPromptCount}<small> / {promptCount}</small></strong><small>Completed prompts</small></div>
        </section>

        {/* Filter Tabs */}
        <section className="scholarship-filters" aria-label="Filter scholarships">
          <div className="scholarship-filter-groups">
          {/* Track Filters */}
          <div className="scholarship-filter-group">
            <span className="scholarship-filter-label">Focus area</span>
            <div className="scholarship-filter-options" role="group" aria-label="Filter by focus area">
            {['All', 'AI', 'Cybersecurity', 'General', 'Diversity'].map(tr => (
              <button
                key={tr}
                onClick={() => setSelectedTrack(tr)}
                className={`scholarship-filter-chip ${selectedTrack === tr ? 'active' : ''}`}
                aria-pressed={selectedTrack === tr}
              >
                {tr === 'All' ? 'All Tracks' : tr}
              </button>
            ))}
            </div>
          </div>

          {/* Status Filters */}
          <div className="scholarship-filter-group">
            <span className="scholarship-filter-label">Application status</span>
            <div className="scholarship-filter-options" role="group" aria-label="Filter by application status">
            {['All', 'saved', 'drafting', 'review', 'submitted', 'awarded'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`scholarship-filter-chip ${selectedStatus === st ? 'active' : ''}`}
                aria-pressed={selectedStatus === st}
              >
                {st === 'All' ? 'All Statuses' : SCHOLARSHIP_STATUS_LABELS[st] || st}
              </button>
            ))}
            </div>
          </div>
          </div>
          <label className="scholarship-search">
            <Search size={16} aria-hidden="true" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by program or organization" aria-label="Search scholarships" />
            {searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={14} /></button>}
          </label>
        </section>

        <div className="scholarship-results-heading">
          <div><h2>Your applications</h2><span>{filteredScholarships.length} {filteredScholarships.length === 1 ? 'opportunity' : 'opportunities'}</span></div>
          <span>Open an application to manage its essays and details <ArrowUpRight size={13} /></span>
        </div>

        {/* Grid of Scholarship Cards */}
        {loading ? (
          <div className="loading-overlay" style={{ height: 300, background: 'transparent' }}>
            <div className="spinner" /> Loading applications...
          </div>
        ) : filteredScholarships.length === 0 ? (
          <div className="empty-state scholarship-empty-state">
            <div className="empty-state-icon"><GraduationCap size={32} /></div>
            <p className="empty-state-title">No Scholarships Found</p>
            <p className="empty-state-text">No scholarship applications match your current search and filters.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
              style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={16} /> Track a New Scholarship
            </button>
          </div>
        ) : (
          <div className="scholarship-grid">
          {filteredScholarships.map(scholarship => {
            const trackBadge = TRACK_BADGES[scholarship.track] || TRACK_BADGES.General;
            const qList = scholarship.questions || [];
            const completedCount = qList.filter(q => q.status === 'done' || q.answer.trim().length > 0).length;

            return (
              <Link
                key={scholarship.id}
                href={`/scholarships/${scholarship.id}`}
                className="card scholarship-card"
                style={{ textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <span
                      className="badge"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '4px 10px',
                        background: trackBadge.bg,
                        color: trackBadge.color,
                        borderColor: trackBadge.border,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      {scholarship.track === 'AI' && <Cpu size={12} />}
                      {scholarship.track === 'Cybersecurity' && <Shield size={12} />}
                      {trackBadge.label}
                    </span>

                    <button
                      onClick={(e) => handleDelete(scholarship.id, e)}
                      className="btn btn-ghost btn-icon"
                      style={{ padding: 4, width: 28, height: 28 }}
                      title="Delete application"
                    >
                      <Trash2 size={14} style={{ color: 'var(--accent-red)' }} />
                    </button>
                  </div>

                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {scholarship.name}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{scholarship.organization}</p>
                  </div>

                  {/* Metadata Row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: 12, color: 'var(--text-muted)', paddingTop: 10, borderTop: '1px solid var(--border-secondary)' }}>
                    {scholarship.awardAmount && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-amber)', fontWeight: 600 }}>
                        <DollarSign size={13} /> {scholarship.awardAmount}
                      </div>
                    )}
                    {scholarship.deadline && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={13} /> {scholarship.deadline}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Progress & Status */}
                <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-secondary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                      <Clock size={13} />
                      <span>{completedCount} of {qList.length} prompts ready</span>
                    </div>

                    <span
                      className="badge"
                      style={{
                        backgroundColor: `${SCHOLARSHIP_STATUS_COLORS[scholarship.status]}15`,
                        color: SCHOLARSHIP_STATUS_COLORS[scholarship.status],
                        borderColor: `${SCHOLARSHIP_STATUS_COLORS[scholarship.status]}30`,
                      }}
                    >
                      {SCHOLARSHIP_STATUS_LABELS[scholarship.status] || scholarship.status}
                    </span>
                  </div>

                  {/* 1-Click Status Stepper */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                      background: 'var(--bg-secondary)',
                      padding: '4px 8px',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  >
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}>Advance:</span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {scholarship.status === 'saved' && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '2px 8px', height: 24, fontSize: 11, color: 'var(--accent-blue)', borderColor: 'var(--border-secondary)' }}
                          onClick={(e) => handleStatusChange(scholarship.id, 'drafting', e)}
                        >
                          Drafting &rarr;
                        </button>
                      )}
                      {scholarship.status === 'drafting' && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '2px 8px', height: 24, fontSize: 11, color: 'var(--accent-purple)', borderColor: 'var(--border-secondary)' }}
                          onClick={(e) => handleStatusChange(scholarship.id, 'review', e)}
                        >
                          In Review &rarr;
                        </button>
                      )}
                      {scholarship.status === 'review' && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '2px 8px', height: 24, fontSize: 11, color: 'var(--accent-primary)', borderColor: 'var(--border-secondary)' }}
                          onClick={(e) => handleStatusChange(scholarship.id, 'submitted', e)}
                        >
                          Submit &rarr;
                        </button>
                      )}
                      {scholarship.status === 'submitted' && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '2px 8px', height: 24, fontSize: 11, color: 'var(--accent-emerald)', borderColor: 'var(--border-secondary)' }}
                          onClick={(e) => handleStatusChange(scholarship.id, 'awarded', e)}
                        >
                          Awarded &#127881;
                        </button>
                      )}
                      {scholarship.status === 'awarded' && (
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, fontSize: 11 }}>
                          &#10003; Won
                        </span>
                      )}
                      {scholarship.status !== 'saved' && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '2px 6px', height: 24, fontSize: 10, color: 'var(--text-muted)' }}
                          title="Reset to Saved"
                          onClick={(e) => handleStatusChange(scholarship.id, 'saved', e)}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal for New Scholarship Application */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth={800}
        className="scholarship-editor-modal"
        subtitle="Create a workspace for the opportunity, deadlines, and essays you’ll manage here."
        title={
          <div className="editor-modal-title">
            <span className="editor-modal-icon"><GraduationCap size={18} /></span>
            <span><small>NEW OPPORTUNITY</small><strong>Add scholarship application</strong></span>
          </div>
        }
        footer={
          <div className="editor-modal-footer">
            <span className="editor-modal-footnote">You can add or update essay prompts later.</span>
            <div className="editor-modal-footer-actions">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancel</button>
              <button type="submit" form="scholarship-create-form" className="btn btn-primary"><Plus size={15} /> Create workspace</button>
            </div>
          </div>
        }
      >
        <form id="scholarship-create-form" onSubmit={handleCreate} className="scholarship-form">
          <section className="editor-form-section">
            <div className="editor-form-section-heading"><span>01</span><div><h3>Opportunity details</h3><p>Start with the program and sponsoring organization.</p></div></div>
            <div className="scholarship-form-grid">
            <div>
              <label className="form-label" htmlFor="scholarship-name">Program or scholarship name <span className="required-mark">Required</span></label>
              <input
                id="scholarship-name"
                type="text"
                required
                placeholder="e.g. Cybersecurity Fellowship"
                value={name}
                onChange={e => setName(e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="form-label" htmlFor="scholarship-organization">Organization or foundation <span className="required-mark">Required</span></label>
              <input
                id="scholarship-organization"
                type="text"
                required
                placeholder="e.g. National Science Foundation"
                value={organization}
                onChange={e => setOrganization(e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          </section>

          <section className="editor-form-section">
            <div className="editor-form-section-heading"><span>02</span><div><h3>Track and timing</h3><p>Capture the award details and when the application is due.</p></div></div>
            <div className="scholarship-form-grid scholarship-form-grid-three">
            <div>
              <SelectField
                label="Focus area"
                name="scholarship-track"
                options={[
                  { value: 'AI', label: 'AI & Machine Learning', description: 'AI, data science, and emerging technology' },
                  { value: 'Cybersecurity', label: 'Cybersecurity', description: 'Security, privacy, and digital defense' },
                  { value: 'General', label: 'General STEM', description: 'Science, technology, engineering, and math' },
                  { value: 'Diversity', label: 'Diversity', description: 'Programs supporting underrepresented groups' },
                ]}
                value={track}
                onChange={(value) => setTrack(value as typeof track)}
                hint="Used to organize and filter your opportunity list."
              />
            </div>

            <div>
              <label className="form-label" htmlFor="scholarship-award">Award amount <span>Optional</span></label>
              <input
                id="scholarship-award"
                type="text"
                placeholder="e.g. $10,000"
                value={awardAmount}
                onChange={e => setAwardAmount(e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="form-label" htmlFor="scholarship-deadline">Deadline <span>Optional</span></label>
              <input
                id="scholarship-deadline"
                type="text"
                placeholder="e.g. Nov 15, 2026"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="scholarship-url">Application portal link <span>Optional</span></label>
            <input
              id="scholarship-url"
              type="text"
              placeholder="https://..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>
          </section>

          {/* Questions Section */}
          <section className="editor-form-section scholarship-prompts-section">
            <div className="editor-form-section-heading"><span>03</span><div><h3>Essay prompts <span>Optional</span></h3><p>Add prompts now to keep drafting and tracking them in this workspace.</p></div></div>
            <div className="scholarship-prompt-list">
            {questionPrompts.map((p, idx) => (
              <div key={idx} className="scholarship-prompt-row">
                <span className="scholarship-prompt-number">{String(idx + 1).padStart(2, '0')}</span>
                <input
                  aria-label={`Essay prompt ${idx + 1}`}
                  type="text"
                  placeholder={`Question ${idx + 1} prompt (e.g. Describe your interest in AI)`}
                  value={p}
                  onChange={e => {
                    const updated = [...questionPrompts];
                    updated[idx] = e.target.value;
                    setQuestionPrompts(updated);
                  }}
                  className="form-input"
                  style={{ flex: 1 }}
                />
                {questionPrompts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setQuestionPrompts(questionPrompts.filter((_, i) => i !== idx))}
                    className="btn btn-ghost btn-icon"
                    aria-label={`Remove essay prompt ${idx + 1}`}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setQuestionPrompts([...questionPrompts, ''])}
              className="btn btn-ghost btn-sm scholarship-add-prompt"
            >
              <Plus size={14} /> Add another essay prompt
            </button>
            </div>
          </section>
        </form>
      </Modal>
      </main>
    </div>
  );
}
