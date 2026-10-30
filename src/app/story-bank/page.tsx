'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import AppTopbar from '@/components/AppTopbar';
import Modal from '@/components/Modal';
import { SelectField, useConfirmDialog } from '@/components/ui';
import { StoryBankItem } from '@/lib/types';
import { Plus, Trash2, Edit2, Bookmark, Cpu, Shield, Users, Target, HelpCircle, Check, X, Search, BookOpen, ArrowUpRight, FileText, Sparkles, Layers } from 'lucide-react';

const CATEGORIES = [
  { id: 'AI', label: 'AI & Machine Learning', icon: Cpu, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'Cybersecurity', label: 'Cybersecurity & Defense', icon: Shield, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'Leadership', label: 'Leadership & Teamwork', icon: Users, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'Challenge', label: 'Overcoming Obstacles', icon: Target, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'Goal', label: 'Career Goals & Vision', icon: Bookmark, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { id: 'Other', label: 'General / Other', icon: HelpCircle, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
];

function parseStar(content: string) {
  const sitMatch = content.match(/Situation:\s*([\s\S]*?)(?=Task:|$)/i);
  const taskMatch = content.match(/Task:\s*([\s\S]*?)(?=Action:|$)/i);
  const actMatch = content.match(/Action:\s*([\s\S]*?)(?=Result:|$)/i);
  const resMatch = content.match(/Result:\s*([\s\S]*?)$/i);
  if (sitMatch || taskMatch || actMatch || resMatch) {
    return {
      situation: sitMatch ? sitMatch[1].trim() : '',
      task: taskMatch ? taskMatch[1].trim() : '',
      action: actMatch ? actMatch[1].trim() : '',
      result: resMatch ? resMatch[1].trim() : '',
      isStructured: true,
    };
  }
  return {
    situation: '',
    task: '',
    action: '',
    result: '',
    isStructured: false,
  };
}

export default function StoryBankPage() {
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [items, setItems] = useState<StoryBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoryBankItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'AI' | 'Cybersecurity' | 'Leadership' | 'Challenge' | 'Goal' | 'Other'>('AI');
  const [formContent, setFormContent] = useState('');
  const [formMode, setFormMode] = useState<'star' | 'freeform'>('star');
  const [formSituation, setFormSituation] = useState('');
  const [formTask, setFormTask] = useState('');
  const [formAction, setFormAction] = useState('');
  const [formResult, setFormResult] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishError, setPolishError] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/story-bank');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error('Failed to load story bank items', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormCategory('AI');
    setFormContent('');
    setFormSituation('');
    setFormTask('');
    setFormAction('');
    setFormResult('');
    setFormMode('star');
    setPolishError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: StoryBankItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormContent(item.content);
    const star = parseStar(item.content);
    if (star.isStructured) {
      setFormMode('star');
      setFormSituation(star.situation);
      setFormTask(star.task);
      setFormAction(star.action);
      setFormResult(star.result);
    } else {
      setFormMode('freeform');
      setFormSituation('');
      setFormTask('');
      setFormAction('');
      setFormResult('');
    }
    setPolishError('');
    setIsModalOpen(true);
  };

  const syncStarToContent = (s: string, t: string, a: string, r: string) => {
    const parts = [];
    if (s.trim()) parts.push(`Situation:\n${s.trim()}`);
    if (t.trim()) parts.push(`Task:\n${t.trim()}`);
    if (a.trim()) parts.push(`Action:\n${a.trim()}`);
    if (r.trim()) parts.push(`Result:\n${r.trim()}`);
    setFormContent(parts.join('\n\n'));
  };

  const handleAIPolish = async () => {
    const textToPolish = formMode === 'star'
      ? `Situation: ${formSituation}\nTask: ${formTask}\nAction: ${formAction}\nResult: ${formResult}`.trim()
      : formContent.trim();

    if (!textToPolish) {
      setPolishError('Please enter some notes or details first to polish.');
      return;
    }

    setIsPolishing(true);
    setPolishError('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'polish-star',
          resume: textToPolish,
          jobTitle: formTitle || 'Accomplishment',
          extraInfo: formCategory,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'AI polish failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Failed to read stream');

      let fullText = '';
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setFormContent(fullText);
        const parsed = parseStar(fullText);
        if (parsed.isStructured) {
          setFormSituation(parsed.situation);
          setFormTask(parsed.task);
          setFormAction(parsed.action);
          setFormResult(parsed.result);
        }
      }
    } catch (e: any) {
      setPolishError(e.message || 'Failed to polish story');
    } finally {
      setIsPolishing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    try {
      if (editingItem) {
        const res = await fetch('/api/story-bank', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingItem.id,
            title: formTitle,
            category: formCategory,
            content: formContent,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setItems(items.map(item => item.id === updated.id ? updated : item));
        }
      } else {
        const res = await fetch('/api/story-bank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            category: formCategory,
            content: formContent,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          setItems([created, ...items]);
        }
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error('Failed to save story item', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: 'Delete story?', description: 'This story will be permanently removed from your story bank.', confirmLabel: 'Delete story' })) return;
    try {
      const res = await fetch(`/api/story-bank?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(items.filter(item => item.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete story item', e);
    }
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory;
    const searchMatch = !query || `${item.title} ${item.category} ${item.content}`.toLowerCase().includes(query);
    return categoryMatch && searchMatch;
  });
  const usedCategories = new Set(items.map((item) => item.category)).size;
  const totalWords = items.reduce((sum, item) => sum + item.content.trim().split(/\s+/).filter(Boolean).length, 0);

  return (
    <div className="app-layout">
      <Sidebar />
      <AppTopbar />
      {confirmDialog}
      <main className="main-content story-bank-page">
        {/* Top Header */}
        <div className="page-header story-bank-header">
          <div>
            <div className="story-bank-eyebrow">YOUR EXPERIENCE LIBRARY</div>
            <h1 className="page-title story-bank-title">
              <Bookmark size={24} aria-hidden="true" /> Story Bank
            </h1>
            <p className="page-subtitle">
              Keep your strongest examples ready for resumes, applications, and essays.
            </p>
          </div>
          <button onClick={handleOpenCreateModal} className="btn btn-primary story-bank-add-button">
            <Plus size={18} />
            Add a story
          </button>
        </div>

        <section className="story-bank-overview" aria-label="Story bank overview">
          <div className="story-overview-card"><span className="story-overview-icon"><BookOpen size={17} /></span><span className="story-overview-label">Stories saved</span><strong>{items.length}</strong><small>Your personal experience library</small></div>
          <div className="story-overview-card"><span className="story-overview-icon is-blue"><Bookmark size={17} /></span><span className="story-overview-label">Categories in use</span><strong>{usedCategories}<small> / {CATEGORIES.length}</small></strong><small>Different experience themes</small></div>
          <div className="story-overview-card"><span className="story-overview-icon is-purple"><FileText size={17} /></span><span className="story-overview-label">Experience details</span><strong>{totalWords.toLocaleString()}</strong><small>Words ready to reuse</small></div>
          <div className="story-overview-card">
            <span className="story-overview-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--accent-green)' }}><Layers size={17} /></span>
            <span className="story-overview-label">Competency Balance</span>
            <strong>{Math.round((usedCategories / CATEGORIES.length) * 100)}%</strong>
            <small>{usedCategories === CATEGORIES.length ? 'All themes covered!' : `${CATEGORIES.length - usedCategories} themes missing`}</small>
          </div>
        </section>

        {/* Category Tabs */}
        <section className="story-bank-tools" aria-label="Find stories">
          <div className="story-category-list" role="group" aria-label="Filter by story category">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`story-category-filter ${selectedCategory === 'All' ? 'active' : ''}`}
            aria-pressed={selectedCategory === 'All'}
          >
            All stories <span>{items.length}</span>
          </button>
          {CATEGORIES.map(cat => {
            const count = items.filter(i => i.category === cat.id).length;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`story-category-filter ${selectedCategory === cat.id ? 'active' : ''}`}
                aria-pressed={selectedCategory === cat.id}
              >
                <Icon size={14} />
                {cat.label} <span>{count}</span>
              </button>
            );
          })}
          </div>
          <label className="story-bank-search">
            <Search size={16} aria-hidden="true" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search your stories" aria-label="Search stories" />
            {searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={14} /></button>}
          </label>
        </section>

        <div className="story-results-heading">
          <div><h2>Saved experiences</h2><span>{filteredItems.length} {filteredItems.length === 1 ? 'story' : 'stories'}</span></div>
          <span>Use these details as source material in your applications <ArrowUpRight size={13} /></span>
        </div>

        {/* Grid of Story Cards */}
        {loading ? (
          <div className="loading-overlay" style={{ height: 300, background: 'transparent' }}>
            <div className="spinner" /> Loading story bank items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Bookmark size={32} /></div>
            <p className="empty-state-title">{items.length === 0 ? 'Your story bank is ready' : 'No stories match these filters'}</p>
            <p className="empty-state-text">{items.length === 0 ? 'Add a project, challenge, or achievement to start building your experience library.' : 'Try another category or search term to find a saved story.'}</p>
            <button
              onClick={handleOpenCreateModal}
              className="btn btn-ghost"
              style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={16} /> Add Your First Story
            </button>
          </div>
        ) : (
          <div className="story-card-grid">
            {filteredItems.map(item => {
              const catInfo = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[5];
              const Icon = catInfo.icon;
              return (
                <div
                  key={item.id}
                  className="card story-card"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="story-card-heading">
                      <h3>{item.title}</h3>
                      <span className={`story-category-badge category-${item.category}`}>
                        <Icon size={12} />
                        {catInfo.label}
                      </span>
                    </div>
                    <div className="story-card-content">
                      {item.content}
                    </div>
                  </div>

                  <div className="story-card-actions">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-red)' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for Add / Edit Story */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          maxWidth={680}
          className="story-editor-modal"
          subtitle="Capture the context, actions, and outcomes you may want to reuse later."
          title={
            <div className="editor-modal-title">
              <span className="editor-modal-icon"><Bookmark size={17} /></span>
              <span><small>EXPERIENCE LIBRARY</small><strong>{editingItem ? 'Edit background story' : 'Add background story'}</strong></span>
            </div>
          }
          footer={
            <div className="editor-modal-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAIPolish}
                  disabled={isPolishing}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {isPolishing ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />}
                  <span>{isPolishing ? 'Polishing STAR…' : 'AI Polish to STAR'}</span>
                </button>
              </div>
              <div className="editor-modal-footer-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" form="story-editor-form" className="btn btn-primary"><Check size={15} /> {editingItem ? 'Save changes' : 'Save story'}</button>
              </div>
            </div>
          }
        >
          <form id="story-editor-form" onSubmit={handleSave} className="story-form">
            {polishError && (
              <div role="alert" style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-red)', fontSize: 12 }}>
                {polishError}
              </div>
            )}
            
            <div>
              <label className="form-label" htmlFor="story-title">Story title <span className="required-mark">Required</span></label>
              <input
                id="story-title"
                type="text"
                required
                placeholder="e.g. PyTorch LLM Model Project or Wireshark CTF Lab"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <SelectField
                label="Category"
                name="story-category"
                options={CATEGORIES.map((category) => ({
                  value: category.id,
                  label: category.label,
                  description: `Save this story under ${category.label.toLowerCase()}.`,
                }))}
                value={formCategory}
                onChange={(value) => setFormCategory(value as typeof formCategory)}
                hint="Choose the theme that best describes this experience."
              />
            </div>

            {/* Mode Switcher */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ margin: 0 }}>Story Format</label>
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', padding: 3, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-secondary)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode('star');
                      if (formContent.trim() && !formSituation && !formTask && !formAction && !formResult) {
                        const parsed = parseStar(formContent);
                        if (parsed.isStructured) {
                          setFormSituation(parsed.situation);
                          setFormTask(parsed.task);
                          setFormAction(parsed.action);
                          setFormResult(parsed.result);
                        } else {
                          setFormAction(formContent);
                        }
                      }
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      cursor: 'pointer',
                      background: formMode === 'star' ? 'var(--accent-primary)' : 'transparent',
                      color: formMode === 'star' ? '#ffffff' : 'var(--text-muted)'
                    }}
                  >
                    ⭐ STAR Framework
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMode('freeform')}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      cursor: 'pointer',
                      background: formMode === 'freeform' ? 'var(--accent-primary)' : 'transparent',
                      color: formMode === 'freeform' ? '#ffffff' : 'var(--text-muted)'
                    }}
                  >
                    Freeform Text
                  </button>
                </div>
              </div>

              {formMode === 'star' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>
                      <span style={{ color: 'var(--accent-primary)' }}>S</span>ituation
                    </label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      placeholder="What was the business problem, context, or engineering challenge?"
                      value={formSituation}
                      onChange={e => {
                        setFormSituation(e.target.value);
                        syncStarToContent(e.target.value, formTask, formAction, formResult);
                      }}
                      style={{ width: '100%', resize: 'vertical', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>
                      <span style={{ color: 'var(--accent-primary)' }}>T</span>ask
                    </label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      placeholder="What was your specific ownership, responsibility, or objective?"
                      value={formTask}
                      onChange={e => {
                        setFormTask(e.target.value);
                        syncStarToContent(formSituation, e.target.value, formAction, formResult);
                      }}
                      style={{ width: '100%', resize: 'vertical', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>
                      <span style={{ color: 'var(--accent-primary)' }}>A</span>ction
                    </label>
                    <textarea
                      rows={3}
                      className="form-textarea"
                      placeholder="What exact technical decisions, tools (PyTorch, Docker, AWS), or leadership actions did you execute?"
                      value={formAction}
                      onChange={e => {
                        setFormAction(e.target.value);
                        syncStarToContent(formSituation, formTask, e.target.value, formResult);
                      }}
                      style={{ width: '100%', resize: 'vertical', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>
                      <span style={{ color: 'var(--accent-green)' }}>R</span>esult & Metrics
                    </label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      placeholder="What quantifiable metric (accuracy %, latency reduction, time saved) or outcome was achieved?"
                      value={formResult}
                      onChange={e => {
                        setFormResult(e.target.value);
                        syncStarToContent(formSituation, formTask, formAction, e.target.value);
                      }}
                      style={{ width: '100%', resize: 'vertical', fontSize: 13 }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <textarea
                    id="story-content"
                    required
                    rows={7}
                    placeholder="Include specific tools used (PyTorch, Nmap, Docker), numbers/metrics (accuracy %, latency reduced, CTF rank), and outcomes achieved..."
                    value={formContent}
                    onChange={e => setFormContent(e.target.value)}
                    className="form-textarea"
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                  <div className="story-content-guidance"><span>Context</span><span>Action</span><span>Outcome</span><small>{formContent.trim() ? formContent.trim().split(/\s+/).length : 0} words</small></div>
                </div>
              )}
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
