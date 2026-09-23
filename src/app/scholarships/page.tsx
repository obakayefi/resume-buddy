'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import { Scholarship, SCHOLARSHIP_STATUS_LABELS, SCHOLARSHIP_STATUS_COLORS } from '@/lib/types';
import Link from 'next/link';
import { GraduationCap, Plus, Calendar, DollarSign, Cpu, Shield, Sparkles, ExternalLink, CheckCircle2, Clock, Trash2, X } from 'lucide-react';

const TRACK_BADGES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  AI: { label: 'AI & Machine Learning', bg: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.25)' },
  Cybersecurity: { label: 'Cybersecurity & Defense', bg: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.25)' },
  General: { label: 'General STEM', bg: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)' },
  Diversity: { label: 'Diversity & Inclusion', bg: 'rgba(236, 72, 153, 0.1)', color: '#f472b6', border: 'rgba(236, 72, 153, 0.25)' },
};

export default function ScholarshipsDashboardPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
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
    if (!confirm('Are you sure you want to delete this scholarship application?')) return;

    try {
      const res = await fetch(`/api/scholarships/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setScholarships(scholarships.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete scholarship', e);
    }
  };

  const filteredScholarships = scholarships.filter(s => {
    const trackMatch = selectedTrack === 'All' || s.track === selectedTrack;
    const statusMatch = selectedStatus === 'All' || s.status === selectedStatus;
    return trackMatch && statusMatch;
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        {/* Top Header */}
        <div className="page-header" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 24, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <GraduationCap size={28} style={{ color: 'var(--accent-primary)' }} />
              Scholarship & Fellowship Applications
            </h1>
            <p className="page-subtitle">
              Accelerate your undergraduate AI & Cybersecurity scholarship applications with AI-powered prompt essay drafting.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <Link
              href="/story-bank"
              className="btn btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Sparkles size={16} style={{ color: 'var(--accent-amber)' }} /> Story Bank
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={18} /> New Application
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          {/* Track Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['All', 'AI', 'Cybersecurity', 'General', 'Diversity'].map(tr => (
              <button
                key={tr}
                onClick={() => setSelectedTrack(tr)}
                className={`badge ${selectedTrack === tr ? 'badge-primary' : ''}`}
                style={{
                  padding: '6px 14px',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedTrack === tr ? 'var(--accent-primary)' : 'var(--border-secondary)',
                  background: selectedTrack === tr ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                  color: selectedTrack === tr ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {tr === 'All' ? 'All Tracks' : tr}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['All', 'saved', 'drafting', 'review', 'submitted', 'awarded'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                style={{
                  padding: '6px 14px',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedStatus === st ? 'var(--text-muted)' : 'var(--border-secondary)',
                  background: selectedStatus === st ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
                  color: selectedStatus === st ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {st === 'All' ? 'All Statuses' : SCHOLARSHIP_STATUS_LABELS[st] || st}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Scholarship Cards */}
        {loading ? (
          <div className="loading-overlay" style={{ height: 300, background: 'transparent' }}>
            <div className="spinner" /> Loading applications...
          </div>
        ) : filteredScholarships.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><GraduationCap size={32} /></div>
            <p className="empty-state-title">No Scholarships Found</p>
            <p className="empty-state-text">No scholarship applications found matching your filters.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
              style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={16} /> Track a New Scholarship
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {filteredScholarships.map(scholarship => {
            const trackBadge = TRACK_BADGES[scholarship.track] || TRACK_BADGES.General;
            const qList = scholarship.questions || [];
            const completedCount = qList.filter(q => q.status === 'done' || q.answer.trim().length > 0).length;

            return (
              <Link
                key={scholarship.id}
                href={`/scholarships/${scholarship.id}`}
                className="card"
                style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20, textDecoration: 'none', transition: 'border-color 0.2s, transform 0.2s' }}
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
                <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <Clock size={13} />
                    <span>{completedCount} of {qList.length} questions ready</span>
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
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal for New Scholarship Application */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth={640}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GraduationCap style={{ color: 'var(--accent-primary)' }} size={22} />
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Add Scholarship Application</span>
          </div>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="form-label">
                Program / Scholarship Name *
              </label>
              <input
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
              <label className="form-label">
                Organization / Foundation *
              </label>
              <input
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div>
              <label className="form-label">
                Domain Track
              </label>
              <select
                value={track}
                onChange={e => setTrack(e.target.value as any)}
                className="form-select"
                style={{ width: '100%' }}
              >
                <option value="AI">AI & ML</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="General">General STEM</option>
                <option value="Diversity">Diversity</option>
              </select>
            </div>

            <div>
              <label className="form-label">
                Award Amount (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. $10,000"
                value={awardAmount}
                onChange={e => setAwardAmount(e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="form-label">
                Deadline (Optional)
              </label>
              <input
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
            <label className="form-label">
              Application Portal Link (Optional)
            </label>
            <input
              type="text"
              placeholder="https://..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Questions Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
            <label className="form-label">
              Initial Essay Questions / Prompts
            </label>
            {questionPrompts.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
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
                    style={{ color: 'var(--accent-red)' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setQuestionPrompts([...questionPrompts, ''])}
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: 'flex-start', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={14} /> Add another essay prompt
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border-secondary)' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Create Application Workspace
            </button>
          </div>
        </form>
      </Modal>
      </main>
    </div>
  );
}
