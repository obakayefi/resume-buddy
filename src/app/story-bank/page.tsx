'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import { StoryBankItem } from '@/lib/types';
import { Plus, Trash2, Edit2, Bookmark, Cpu, Shield, Users, Target, HelpCircle, Check, X } from 'lucide-react';

const CATEGORIES = [
  { id: 'AI', label: 'AI & Machine Learning', icon: Cpu, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'Cybersecurity', label: 'Cybersecurity & Defense', icon: Shield, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'Leadership', label: 'Leadership & Teamwork', icon: Users, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'Challenge', label: 'Overcoming Obstacles', icon: Target, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'Goal', label: 'Career Goals & Vision', icon: Bookmark, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { id: 'Other', label: 'General / Other', icon: HelpCircle, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
];

export default function StoryBankPage() {
  const [items, setItems] = useState<StoryBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoryBankItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'AI' | 'Cybersecurity' | 'Leadership' | 'Challenge' | 'Goal' | 'Other'>('AI');
  const [formContent, setFormContent] = useState('');

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
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: StoryBankItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormContent(item.content);
    setIsModalOpen(true);
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
    if (!confirm('Are you sure you want to delete this story?')) return;
    try {
      const res = await fetch(`/api/story-bank?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(items.filter(item => item.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete story item', e);
    }
  };

  const filteredItems = selectedCategory === 'All' 
    ? items 
    : items.filter(i => i.category === selectedCategory);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        {/* Top Header */}
        <div className="page-header" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 24, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Bookmark size={28} style={{ color: 'var(--accent-primary)' }} />
              Story Bank & Experience Vault
            </h1>
            <p className="page-subtitle">
              Store your core background stories, technical achievements, CTF labs, and project milestones to feed AI essay generators.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
          >
            <Plus size={18} />
            Add Background Story
          </button>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          <button
            onClick={() => setSelectedCategory('All')}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              border: '1px solid',
              borderColor: selectedCategory === 'All' ? 'var(--text-muted)' : 'var(--border-secondary)',
              background: selectedCategory === 'All' ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
              color: selectedCategory === 'All' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            All Stories ({items.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = items.filter(i => i.category === cat.id).length;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedCategory === cat.id ? 'var(--text-muted)' : 'var(--border-secondary)',
                  background: selectedCategory === cat.id ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
                  color: selectedCategory === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={14} />
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Grid of Story Cards */}
        {loading ? (
          <div className="loading-overlay" style={{ height: 300, background: 'transparent' }}>
            <div className="spinner" /> Loading story bank items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Bookmark size={32} /></div>
            <p className="empty-state-title">No Stories Yet</p>
            <p className="empty-state-text">No stories added for this category yet.</p>
            <button
              onClick={handleOpenCreateModal}
              className="btn btn-ghost"
              style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={16} /> Add Your First Story
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 20 }}>
            {filteredItems.map(item => {
              const catInfo = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[5];
              const Icon = catInfo.icon;
              return (
                <div
                  key={item.id}
                  className="card"
                  style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{item.title}</h3>
                      <span className="badge" style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <Icon size={12} />
                        {item.category}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-secondary)', maxHeight: 200, overflowY: 'auto' }}>
                      {item.content}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-secondary)', fontSize: 12, color: 'var(--text-muted)' }}>
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
          maxWidth={640}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bookmark size={20} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {editingItem ? 'Edit Background Story' : 'Add Background Story'}
              </span>
            </div>
          }
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="form-label">Story Title / Heading</label>
              <input
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
              <label className="form-label">Category</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value as any)}
                className="form-select"
                style={{ width: '100%' }}
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Detailed Experience & Key Metrics</label>
              <textarea
                required
                rows={6}
                placeholder="Include specific tools used (PyTorch, Nmap, Docker), numbers/metrics (accuracy %, latency reduced, CTF rank), and outcomes achieved..."
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                className="form-textarea"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border-secondary)' }}>
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
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Check size={16} /> Save Story
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
