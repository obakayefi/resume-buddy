'use client';

import { useState, useEffect, use } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import { Scholarship, ScholarshipQuestion, StoryBankItem, SCHOLARSHIP_STATUS_LABELS, SCHOLARSHIP_STATUS_COLORS } from '@/lib/types';
import Link from 'next/link';
import {
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Copy,
  Check,
  Plus,
  Trash2,
  Wand2,
  Scissors,
  CheckCircle,
  AlertCircle,
  Cpu,
  Shield,
  ExternalLink,
  BookOpen,
  DollarSign,
  Calendar,
  Layers,
  ChevronRight,
  X
} from 'lucide-react';

export default function ScholarshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [questions, setQuestions] = useState<ScholarshipQuestion[]>([]);
  const [storyBankItems, setStoryBankItems] = useState<StoryBankItem[]>([]);
  const [masterResumeSummary, setMasterResumeSummary] = useState<string>('');
  
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isAiTrimming, setIsAiTrimming] = useState(false);
  const [isAiCritiquing, setIsAiCritiquing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [critiqueResult, setCritiqueResult] = useState<{ score: number; strengths: string[]; weaknesses: string[]; suggestions: string[] } | null>(null);

  // New Question Modal
  const [isNewQuestionModalOpen, setIsNewQuestionModalOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [newMaxWords, setNewMaxWords] = useState(300);

  useEffect(() => {
    fetchScholarshipData();
    fetchStoryBank();
    fetchMasterResume();
  }, [id]);

  const fetchScholarshipData = async () => {
    try {
      const res = await fetch(`/api/scholarships/${id}`);
      if (res.ok) {
        const data: Scholarship = await res.json();
        setScholarship(data);
        const qList = data.questions || [];
        setQuestions(qList);
        if (qList.length > 0 && !activeQuestionId) {
          setActiveQuestionId(qList[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch scholarship details', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoryBank = async () => {
    try {
      const res = await fetch('/api/story-bank');
      if (res.ok) {
        const data = await res.json();
        setStoryBankItems(data);
      }
    } catch (e) {
      console.error('Failed to load story bank', e);
    }
  };

  const fetchMasterResume = async () => {
    try {
      const res = await fetch('/api/resumes');
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const r = data[0];
          const summary = `Candidate Name: ${r.name}, Title: ${r.title}\nSummary: ${r.summary}\nSkills: ${(r.skillGroups || []).map((g: any) => `${g.category}: ${g.skills.join(', ')}`).join('; ')}\nExperience: ${(r.experience || []).map((e: any) => `${e.title} at ${e.company} (${e.startDate}-${e.endDate}): ${e.bullets.join(' ')}`).join('\n')}`;
          setMasterResumeSummary(summary);
        }
      }
    } catch (e) {
      console.error('Failed to load resume details', e);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!scholarship) return;
    try {
      const res = await fetch(`/api/scholarships/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scholarship, status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setScholarship(updated);
      }
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const handleSaveQuestionAnswer = async (qId: string, answer: string) => {
    try {
      const res = await fetch(`/api/scholarships/${id}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: qId,
          answer,
          status: answer.trim().length > 0 ? 'done' : 'todo',
        }),
      });
      if (res.ok) {
        const updatedQ = await res.json();
        setQuestions(questions.map(q => q.id === qId ? updatedQ : q));
      }
    } catch (e) {
      console.error('Failed to save answer', e);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim()) return;

    try {
      const res = await fetch(`/api/scholarships/${id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: newPrompt,
          maxWords: newMaxWords,
          status: 'todo',
        }),
      });
      if (res.ok) {
        const createdQ = await res.json();
        const updatedQList = [...questions, createdQ];
        setQuestions(updatedQList);
        setActiveQuestionId(createdQ.id);
        setIsNewQuestionModalOpen(false);
        setNewPrompt('');
        setNewMaxWords(300);
      }
    } catch (e) {
      console.error('Failed to add question', e);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Are you sure you want to remove this question prompt?')) return;
    try {
      const res = await fetch(`/api/scholarships/${id}/questions?questionId=${qId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const updatedList = questions.filter(q => q.id !== qId);
        setQuestions(updatedList);
        if (activeQuestionId === qId) {
          setActiveQuestionId(updatedList[0]?.id || null);
        }
      }
    } catch (e) {
      console.error('Failed to delete question', e);
    }
  };

  // AI Actions
  const activeQuestion = questions.find(q => q.id === activeQuestionId);

  const handleGenerateAiDraft = async () => {
    if (!activeQuestion) return;
    setIsAiGenerating(true);
    setCritiqueResult(null);

    const selectedStoriesText = storyBankItems
      .filter(s => selectedStoryIds.includes(s.id))
      .map(s => `[${s.category}] ${s.title}: ${s.content}`)
      .join('\n\n');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scholarship-essay-draft',
          resume: masterResumeSummary,
          scholarshipName: scholarship?.name,
          organization: scholarship?.organization,
          track: scholarship?.track || 'General',
          questionPrompt: activeQuestion.prompt,
          maxWords: activeQuestion.maxWords,
          storyBankItems: selectedStoriesText,
        }),
      });

      if (!res.ok) {
        alert('Failed to generate draft. Ensure Ollama is running.');
        setIsAiGenerating(false);
        return;
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          
          setQuestions(prev => prev.map(q => q.id === activeQuestion.id ? { ...q, answer: fullText } : q));
        }
        await handleSaveQuestionAnswer(activeQuestion.id, fullText);
      }
    } catch (e) {
      console.error('AI Draft Generation error', e);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleTrimEssay = async () => {
    if (!activeQuestion || !activeQuestion.answer.trim()) return;
    setIsAiTrimming(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scholarship-essay-trim',
          textToTrim: activeQuestion.answer,
          maxWords: activeQuestion.maxWords,
          track: scholarship?.track || 'General',
        }),
      });

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let trimmedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          trimmedText += chunk;

          setQuestions(prev => prev.map(q => q.id === activeQuestion.id ? { ...q, answer: trimmedText } : q));
        }
        await handleSaveQuestionAnswer(activeQuestion.id, trimmedText);
      }
    } catch (e) {
      console.error('AI Trimming error', e);
    } finally {
      setIsAiTrimming(false);
    }
  };

  const handleCritiqueEssay = async () => {
    if (!activeQuestion || !activeQuestion.answer.trim()) return;
    setIsAiCritiquing(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scholarship-essay-critique',
          questionPrompt: activeQuestion.prompt,
          essayText: activeQuestion.answer,
          track: scholarship?.track || 'General',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCritiqueResult(data.result);
      }
    } catch (e) {
      console.error('AI Critique error', e);
    } finally {
      setIsAiCritiquing(false);
    }
  };

  const handleCopyText = (text: string, qId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(qId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const countWords = (str: string) => {
    const trimmed = str.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content" style={{ padding: '32px 40px' }}>
          <div className="loading-overlay" style={{ height: 350, background: 'transparent' }}>
            <div className="spinner" /> Loading application workspace...
          </div>
        </main>
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content" style={{ padding: '32px 40px' }}>
          <div className="empty-state">
            <div className="empty-state-icon"><GraduationCap size={32} /></div>
            <p className="empty-state-title">Scholarship Not Found</p>
            <p className="empty-state-text">This scholarship record does not exist or has been removed.</p>
            <Link href="/scholarships" className="btn btn-primary" style={{ marginTop: 16 }}>
              Return to Scholarships
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const wordCount = activeQuestion ? countWords(activeQuestion.answer) : 0;
  const isOverWordLimit = activeQuestion && activeQuestion.maxWords > 0 && wordCount > activeQuestion.maxWords;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        
        {/* Navigation Breadcrumb & Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border-secondary)' }}>
          <Link
            href="/scholarships"
            className="btn btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}
          >
            <ArrowLeft size={16} /> Back to Scholarships
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status:
            </span>
            <select
              value={scholarship.status}
              onChange={e => handleUpdateStatus(e.target.value)}
              className="form-select"
              style={{ fontSize: 12, padding: '6px 12px', minWidth: 150 }}
            >
              {Object.entries(SCHOLARSHIP_STATUS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Program Info Banner */}
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '4px 10px' }}>
                  {scholarship.track === 'AI' && <Cpu size={13} />}
                  {scholarship.track === 'Cybersecurity' && <Shield size={13} />}
                  {scholarship.track} Track
                </span>
                
                {scholarship.url && (
                  <a
                    href={scholarship.url.startsWith('http') ? scholarship.url : `https://${scholarship.url}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: 'var(--accent-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    Portal Link <ExternalLink size={12} />
                  </a>
                )}
              </div>

              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                  {scholarship.name}
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
                  {scholarship.organization}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {scholarship.awardAmount && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <DollarSign size={18} style={{ color: 'var(--accent-amber)' }} />
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Award</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{scholarship.awardAmount}</div>
                  </div>
                </div>
              )}
              {scholarship.deadline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Deadline</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{scholarship.deadline}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Workspace: Left Questions Panel & Right Active Question Editor */}
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'start' }}>
          
          {/* Left Column: Questions List & Story Bank Grounding Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Question Tabs Card */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-secondary)' }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <BookOpen size={16} style={{ color: 'var(--accent-primary)' }} /> Essay Prompts ({questions.length})
                </h2>
                <button
                  onClick={() => setIsNewQuestionModalOpen(true)}
                  className="btn btn-ghost btn-icon"
                  style={{ width: 28, height: 28, padding: 0 }}
                  title="Add prompt"
                >
                  <Plus size={16} />
                </button>
              </div>

              {questions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
                  <p style={{ marginBottom: 12 }}>No essay prompts created yet.</p>
                  <button
                    onClick={() => setIsNewQuestionModalOpen(true)}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={14} /> Add First Prompt
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                  {questions.map((q, idx) => {
                    const isActive = q.id === activeQuestionId;
                    const qWords = countWords(q.answer);
                    const isDone = q.answer.trim().length > 0;

                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setActiveQuestionId(q.id);
                          setCritiqueResult(null);
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid',
                          borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-secondary)',
                          background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                            Prompt {idx + 1}
                          </span>
                          {isDone ? (
                            <span className="badge badge-success" style={{ fontSize: 10, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle size={10} /> Ready
                            </span>
                          ) : (
                            <span className="badge badge-warning" style={{ fontSize: 10, padding: '2px 6px' }}>
                              Draft
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, lineHeight: 1.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {q.prompt}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', paddingTop: 4 }}>
                          <span>Limit: {q.maxWords} words</span>
                          <span>{qWords} words</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Story Bank Grounding Selector Card */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border-secondary)' }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <Sparkles size={16} style={{ color: 'var(--accent-amber)' }} /> Story Evidence Vault
                </h2>
                <Link
                  href="/story-bank"
                  style={{ fontSize: 12, color: 'var(--accent-primary)', textDecoration: 'none' }}
                >
                  Manage &rarr;
                </Link>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                Select factual background stories from your Story Bank to ground AI-drafted essays.
              </p>

              {storyBankItems.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>
                  No stories in vault.{' '}
                  <Link href="/story-bank" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                    Add background stories
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}>
                  {storyBankItems.map(item => {
                    const isSelected = selectedStoryIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)',
                          background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                          cursor: 'pointer',
                          fontSize: 12,
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedStoryIds([...selectedStoryIds, item.id]);
                            } else {
                              setSelectedStoryIds(selectedStoryIds.filter(itemId => itemId !== item.id));
                            }
                          }}
                          style={{ marginTop: 2 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                            {item.category}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Active Question Editor & AI Generation Actions */}
          <div>
            {activeQuestion ? (
              <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Question Header & Prompt Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Prompt Editor & Limits
                    </span>
                    <button
                      onClick={() => handleDeleteQuestion(activeQuestion.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--accent-red)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                    >
                      <Trash2 size={13} /> Remove Prompt
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={activeQuestion.prompt}
                    onChange={e => {
                      const newP = e.target.value;
                      setQuestions(questions.map(q => q.id === activeQuestion.id ? { ...q, prompt: newP } : q));
                    }}
                    onBlur={() => handleSaveQuestionAnswer(activeQuestion.id, activeQuestion.answer)}
                    className="form-input"
                    style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, resize: 'vertical' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Max Word Limit:</span>
                      <input
                        type="number"
                        value={activeQuestion.maxWords}
                        onChange={e => {
                          const limit = parseInt(e.target.value) || 0;
                          setQuestions(questions.map(q => q.id === activeQuestion.id ? { ...q, maxWords: limit } : q));
                        }}
                        className="form-input"
                        style={{ width: 80, padding: '4px 8px', fontSize: 12, textAlign: 'center' }}
                      />
                    </div>

                    {/* Word Count Indicator Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className={`badge ${
                          isOverWordLimit
                            ? 'badge-danger'
                            : wordCount > 0
                            ? 'badge-success'
                            : ''
                        }`}
                        style={{
                          fontSize: 12,
                          padding: '4px 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: isOverWordLimit ? 'rgba(239, 68, 68, 0.15)' : wordCount > 0 ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-secondary)',
                          color: isOverWordLimit ? 'var(--accent-red)' : wordCount > 0 ? 'var(--accent-green)' : 'var(--text-muted)',
                          border: '1px solid',
                          borderColor: isOverWordLimit ? 'var(--accent-red)' : wordCount > 0 ? 'var(--accent-green)' : 'var(--border-secondary)',
                        }}
                      >
                        {isOverWordLimit ? <AlertCircle size={13} /> : <CheckCircle size={13} />}
                        {wordCount} / {activeQuestion.maxWords} Words
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({activeQuestion.answer.length} chars)</span>
                    </div>
                  </div>
                </div>

                {/* AI Action Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={handleGenerateAiDraft}
                      disabled={isAiGenerating || isAiTrimming || isAiCritiquing}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Wand2 size={14} className={isAiGenerating ? 'animate-spin' : ''} />
                      {isAiGenerating ? 'Generating Draft...' : 'Generate AI Draft'}
                    </button>

                    <button
                      onClick={handleTrimEssay}
                      disabled={!activeQuestion.answer.trim() || isAiGenerating || isAiTrimming || isAiCritiquing}
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--border-secondary)' }}
                    >
                      <Scissors size={14} style={{ color: 'var(--accent-amber)' }} />
                      {isAiTrimming ? 'Trimming...' : 'Trim to Word Limit'}
                    </button>

                    <button
                      onClick={handleCritiqueEssay}
                      disabled={!activeQuestion.answer.trim() || isAiGenerating || isAiTrimming || isAiCritiquing}
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--border-secondary)' }}
                    >
                      <Sparkles size={14} style={{ color: 'var(--accent-purple)' }} />
                      {isAiCritiquing ? 'Reviewing...' : 'AI Quality Review'}
                    </button>
                  </div>

                  <button
                    onClick={() => handleCopyText(activeQuestion.answer, activeQuestion.id)}
                    disabled={!activeQuestion.answer.trim()}
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--border-secondary)' }}
                  >
                    {copiedId === activeQuestion.id ? <Check size={14} style={{ color: 'var(--accent-green)' }} /> : <Copy size={14} />}
                    {copiedId === activeQuestion.id ? 'Copied!' : 'Copy for Portal'}
                  </button>
                </div>

                {/* Main Answer Textarea */}
                <div>
                  <textarea
                    rows={14}
                    placeholder="Your essay response will appear here. You can type directly or click 'Generate AI Draft' to pull from your background stories and resume..."
                    value={activeQuestion.answer}
                    onChange={e => {
                      const newText = e.target.value;
                      setQuestions(questions.map(q => q.id === activeQuestion.id ? { ...q, answer: newText } : q));
                    }}
                    onBlur={e => handleSaveQuestionAnswer(activeQuestion.id, e.target.value)}
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: 16,
                      fontSize: 14,
                      lineHeight: 1.7,
                      minHeight: 280,
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-md)',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* AI Critique Feedback Panel */}
                {critiqueResult && (
                  <div style={{ padding: 20, background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid rgba(99, 102, 241, 0.2)' }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                        <Sparkles size={16} /> AI Review Score: {critiqueResult.score} / 100
                      </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: 13 }}>
                      {critiqueResult.strengths?.length > 0 && (
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--accent-green)', display: 'block', marginBottom: 6 }}>Strengths</span>
                          <ul style={{ paddingLeft: 16, margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {critiqueResult.strengths.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {critiqueResult.suggestions?.length > 0 && (
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--accent-amber)', display: 'block', marginBottom: 6 }}>Suggestions to Improve</span>
                          <ul style={{ paddingLeft: 16, margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {critiqueResult.suggestions.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="empty-state" style={{ height: 350 }}>
                <p className="empty-state-title">No Prompt Selected</p>
                <p className="empty-state-text">Select an essay prompt from the list on the left or add a new one.</p>
              </div>
            )}

          </div>

        </div>

        {/* Modal to Add New Question */}
        <Modal
          isOpen={isNewQuestionModalOpen}
          onClose={() => setIsNewQuestionModalOpen(false)}
          maxWidth={540}
          title="Add Essay Question / Prompt"
        >
          <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">
                Question Prompt *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Describe a time you solved a complex technical problem or demonstrated leadership in cybersecurity."
                value={newPrompt}
                onChange={e => setNewPrompt(e.target.value)}
                className="form-input"
                style={{ width: '100%', fontSize: 13 }}
              />
            </div>

            <div>
              <label className="form-label">
                Max Word Limit
              </label>
              <input
                type="number"
                value={newMaxWords}
                onChange={e => setNewMaxWords(parseInt(e.target.value) || 300)}
                className="form-input"
                style={{ width: '100%', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border-secondary)' }}>
              <button
                type="button"
                onClick={() => setIsNewQuestionModalOpen(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Add Prompt
              </button>
            </div>
          </form>
        </Modal>

      </main>
    </div>
  );
}
