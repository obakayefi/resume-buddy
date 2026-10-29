'use client';

import { useState, useEffect, use } from 'react';
import Sidebar from '@/components/Sidebar';
import AppTopbar from '@/components/AppTopbar';
import Modal from '@/components/Modal';
import { SelectField, useConfirmDialog } from '@/components/ui';
import { Scholarship, ScholarshipQuestion, StoryBankItem, SCHOLARSHIP_STATUS_LABELS } from '@/lib/types';
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
  X
} from 'lucide-react';

const SCHOLARSHIP_STATUS_OPTIONS = Object.entries(SCHOLARSHIP_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
  description: value === 'awarded' ? 'The award has been confirmed.' : `Mark this application as ${label.toLowerCase()}.`,
}));

export default function ScholarshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
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
    if (!await confirm({ title: 'Remove this prompt?', description: 'The prompt and its associated answer will be removed.', confirmLabel: 'Remove prompt' })) return;
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
        <AppTopbar />
        <main className="main-content scholarship-detail-page">
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
        <AppTopbar />
        <main className="main-content scholarship-detail-page">
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
      <AppTopbar />
      {confirmDialog}
      <main className="main-content scholarship-detail-page">
        
        {/* Navigation Breadcrumb & Top Bar */}
        <div className="scholarship-detail-toolbar">
          <Link
            href="/scholarships"
            className="btn btn-ghost scholarship-back-link"
          >
            <ArrowLeft size={16} /> Back to Scholarships
          </Link>
          
          <div className="scholarship-detail-status">
            <SelectField label="Application status" name="scholarship-detail-status" options={SCHOLARSHIP_STATUS_OPTIONS} value={scholarship.status} onChange={handleUpdateStatus} />
          </div>
        </div>

        {/* Program Info Banner */}
        <div className="card scholarship-detail-hero">
          <div className="scholarship-detail-hero-main">
            <div className="scholarship-detail-identity">
              <div className="scholarship-detail-tags">
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
                    className="scholarship-portal-link"
                  >
                    Portal Link <ExternalLink size={12} />
                  </a>
                )}
              </div>

              <div>
                <h1 className="scholarship-detail-title">
                  {scholarship.name}
                </h1>
                <p className="scholarship-detail-organization">
                  {scholarship.organization}
                </p>
              </div>
            </div>

            <div className="scholarship-detail-facts">
              {scholarship.awardAmount && (
                <div className="scholarship-detail-fact">
                  <DollarSign size={18} style={{ color: 'var(--accent-amber)' }} />
                  <div>
                    <div className="scholarship-detail-fact-label">Award</div>
                    <div className="scholarship-detail-fact-value">{scholarship.awardAmount}</div>
                  </div>
                </div>
              )}
              {scholarship.deadline && (
                <div className="scholarship-detail-fact">
                  <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <div className="scholarship-detail-fact-label">Deadline</div>
                    <div className="scholarship-detail-fact-value">{scholarship.deadline}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Workspace: Left Questions Panel & Right Active Question Editor */}
        <div className="scholarship-workspace">
          
          {/* Left Column: Questions List & Story Bank Grounding Selector */}
          <div className="scholarship-workspace-rail">
            
            {/* Question Tabs Card */}
            <div className="card scholarship-question-panel">
              <div className="scholarship-panel-heading">
                <h2>
                  <BookOpen size={16} style={{ color: 'var(--accent-primary)' }} /> Essay Prompts ({questions.length})
                </h2>
                <button
                  onClick={() => setIsNewQuestionModalOpen(true)}
                  className="btn btn-ghost btn-icon scholarship-icon-button"
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
                <div className="scholarship-question-list">
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
                        className={`scholarship-question-choice ${isActive ? 'active' : ''}`}
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
            <div className="card scholarship-evidence-panel">
              <div className="scholarship-panel-heading">
                <h2>
                  <Sparkles size={16} style={{ color: 'var(--accent-amber)' }} /> Story Evidence Vault
                </h2>
                <Link
                  href="/story-bank"
                  className="scholarship-manage-link"
                >
                  Manage &rarr;
                </Link>
              </div>
              <p className="scholarship-evidence-intro">
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
                <div className="scholarship-evidence-list">
                  {storyBankItems.map(item => {
                    const isSelected = selectedStoryIds.includes(item.id);
                    return (
                      <label key={item.id} className={`scholarship-evidence-option ${isSelected ? 'selected' : ''}`}>
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
                          className="scholarship-evidence-checkbox"
                        />
                        <div className="scholarship-evidence-copy">
                          <div className="scholarship-evidence-title">
                            {item.title}
                          </div>
                          <div className="scholarship-evidence-category">
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
              <div className="card scholarship-answer-panel">
                
                {/* Question Header & Prompt Input */}
                <div className="scholarship-active-prompt">
                  <div className="scholarship-active-prompt-heading">
                    <div><span className="scholarship-panel-kicker">ACTIVE ESSAY</span><h2>Prompt and word limit</h2></div>
                    <button
                      onClick={() => handleDeleteQuestion(activeQuestion.id)}
                      className="btn btn-ghost btn-sm scholarship-remove-prompt"
                    >
                      <Trash2 size={13} /> Remove Prompt
                    </button>
                  </div>

                  <textarea
                    aria-label="Edit essay prompt"
                    rows={2}
                    value={activeQuestion.prompt}
                    onChange={e => {
                      const newP = e.target.value;
                      setQuestions(questions.map(q => q.id === activeQuestion.id ? { ...q, prompt: newP } : q));
                    }}
                    onBlur={() => handleSaveQuestionAnswer(activeQuestion.id, activeQuestion.answer)}
                    className="form-input scholarship-active-prompt-input"
                  />

                  <div className="scholarship-answer-meta">
                    <div className="scholarship-word-limit">
                      <label htmlFor="scholarship-max-words">Max word limit</label>
                      <input
                        id="scholarship-max-words"
                        type="number"
                        value={activeQuestion.maxWords}
                        onChange={e => {
                          const limit = parseInt(e.target.value) || 0;
                          setQuestions(questions.map(q => q.id === activeQuestion.id ? { ...q, maxWords: limit } : q));
                        }}
                        className="form-input"
                      />
                    </div>

                    {/* Word Count Indicator Badge */}
                    <div className="scholarship-word-count-group">
                      <span
                        className={`scholarship-word-count ${isOverWordLimit ? 'over-limit' : wordCount > 0 ? 'has-words' : ''}`}
                      >
                        {isOverWordLimit ? <AlertCircle size={13} /> : <CheckCircle size={13} />}
                        {wordCount} / {activeQuestion.maxWords} Words
                      </span>
                      <span className="scholarship-char-count">{activeQuestion.answer.length} characters</span>
                    </div>
                  </div>
                </div>

                {/* AI Action Toolbar */}
                <div className="scholarship-ai-toolbar">
                  <div className="scholarship-ai-actions">
                    <button
                      onClick={handleGenerateAiDraft}
                      disabled={isAiGenerating || isAiTrimming || isAiCritiquing}
                      className="btn btn-primary btn-sm scholarship-ai-primary"
                    >
                      <Wand2 size={14} className={isAiGenerating ? 'animate-spin' : ''} />
                      {isAiGenerating ? 'Generating Draft...' : 'Generate AI Draft'}
                    </button>

                    <button
                      onClick={handleTrimEssay}
                      disabled={!activeQuestion.answer.trim() || isAiGenerating || isAiTrimming || isAiCritiquing}
                      className="btn btn-ghost btn-sm scholarship-ai-secondary"
                    >
                      <Scissors size={14} style={{ color: 'var(--accent-amber)' }} />
                      {isAiTrimming ? 'Trimming...' : 'Trim to Word Limit'}
                    </button>

                    <button
                      onClick={handleCritiqueEssay}
                      disabled={!activeQuestion.answer.trim() || isAiGenerating || isAiTrimming || isAiCritiquing}
                      className="btn btn-ghost btn-sm scholarship-ai-secondary"
                    >
                      <Sparkles size={14} style={{ color: 'var(--accent-purple)' }} />
                      {isAiCritiquing ? 'Reviewing...' : 'AI Quality Review'}
                    </button>
                  </div>

                  <button
                    onClick={() => handleCopyText(activeQuestion.answer, activeQuestion.id)}
                    disabled={!activeQuestion.answer.trim()}
                    className="btn btn-ghost btn-sm scholarship-copy-button"
                  >
                    {copiedId === activeQuestion.id ? <Check size={14} style={{ color: 'var(--accent-green)' }} /> : <Copy size={14} />}
                    {copiedId === activeQuestion.id ? 'Copied!' : 'Copy for Portal'}
                  </button>
                </div>

                {/* Main Answer Textarea */}
                <div className="scholarship-answer-editor-wrap">
                  <textarea
                    aria-label="Essay answer"
                    rows={14}
                    placeholder="Your essay response will appear here. You can type directly or click 'Generate AI Draft' to pull from your background stories and resume..."
                    value={activeQuestion.answer}
                    onChange={e => {
                      const newText = e.target.value;
                      setQuestions(questions.map(q => q.id === activeQuestion.id ? { ...q, answer: newText } : q));
                    }}
                    onBlur={e => handleSaveQuestionAnswer(activeQuestion.id, e.target.value)}
                    className="form-input scholarship-answer-editor"
                  />
                </div>

                {/* AI Critique Feedback Panel */}
                {critiqueResult && (
                  <div className="scholarship-critique-panel">
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
          className="scholarship-question-modal"
          subtitle="Add another essay prompt to this application workspace."
          title={
            <div className="editor-modal-title">
              <span className="editor-modal-icon"><BookOpen size={17} /></span>
              <span><small>ESSAY WORKSPACE</small><strong>Add an essay prompt</strong></span>
            </div>
          }
          footer={
            <div className="editor-modal-footer">
              <span className="editor-modal-footnote">You can revise the prompt and word limit later.</span>
              <div className="editor-modal-footer-actions">
                <button type="button" onClick={() => setIsNewQuestionModalOpen(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" form="scholarship-question-form" className="btn btn-primary"><Plus size={15} /> Add prompt</button>
              </div>
            </div>
          }
        >
          <form id="scholarship-question-form" onSubmit={handleAddQuestion} className="scholarship-question-form">
            <div className="question-form-intro"><strong>Keep the original question clear</strong><span>Use the same wording and word limit as the scholarship application.</span></div>
            <div>
              <label className="form-label" htmlFor="new-scholarship-prompt">Question prompt <span className="required-mark">Required</span></label>
              <textarea
                id="new-scholarship-prompt"
                required
                rows={3}
                placeholder="e.g. Describe a time you solved a complex technical problem or demonstrated leadership in cybersecurity."
                value={newPrompt}
                onChange={e => setNewPrompt(e.target.value)}
                className="form-input scholarship-question-prompt-input"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="new-scholarship-max-words">Maximum word limit</label>
              <input
                id="new-scholarship-max-words"
                type="number"
                value={newMaxWords}
                onChange={e => setNewMaxWords(parseInt(e.target.value) || 300)}
                className="form-input"
              />
            </div>
          </form>
        </Modal>

      </main>
    </div>
  );
}
