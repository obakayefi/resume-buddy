'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import AppTopbar from '@/components/AppTopbar';
import { Save, Plus, Trash2, Edit2, FileText, GraduationCap, Briefcase, Award, Globe, Link, ExternalLink, ChevronUp, ChevronDown, Check, Sparkles } from 'lucide-react';
import type { MasterResumeData, Experience, Education, SkillGroup, Project, Certification } from '@/lib/types';
import { useConfirmDialog } from '@/components/ui';

const STRONG_ACTION_VERBS = new Set([
  'accelerated', 'achieved', 'administered', 'advised', 'analyzed', 'architected', 'automated',
  'built', 'championed', 'coached', 'collaborated', 'consolidated', 'constructed', 'converted',
  'coordinated', 'created', 'decreased', 'delivered', 'deployed', 'designed', 'developed',
  'devised', 'directed', 'documented', 'drove', 'engineered', 'enhanced', 'established',
  'evaluated', 'executed', 'expanded', 'expedited', 'facilitated', 'formulated', 'generated',
  'guided', 'headed', 'identified', 'implemented', 'improved', 'increased', 'initiated',
  'innovated', 'inspected', 'instituted', 'integrated', 'introduced', 'invented', 'launched',
  'lead', 'led', 'managed', 'maximized', 'mentored', 'migrated', 'minimized', 'modernized',
  'negotiated', 'orchestrated', 'organized', 'overhauled', 'oversaw', 'partnered', 'pioneered',
  'planned', 'produced', 'programmed', 'published', 're-engineered', 'rebuilt', 'redesigned',
  'reduced', 'refined', 'refactored', 'resolved', 'restructured', 'revamped', 'revitalized',
  'scaled', 'secured', 'simplified', 'spearheaded', 'standardized', 'streamlined', 'strengthened',
  'structured', 'supervised', 'surpassed', 'trained', 'transformed', 'upgraded', 'validated'
]);

function inspectBullet(bullet: string) {
  const trimmed = bullet.trim();
  const len = trimmed.length;
  const firstWord = (trimmed.split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z]/g, '');
  const hasStrongVerb = STRONG_ACTION_VERBS.has(firstWord);
  
  let lengthRating: 'good' | 'warn' | 'bad' = 'good';
  let lengthFeedback = 'Optimal length';
  if (len === 0) {
    lengthRating = 'bad';
    lengthFeedback = 'Empty bullet';
  } else if (len < 50) {
    lengthRating = 'warn';
    lengthFeedback = 'Too brief (aim for 80-180 chars)';
  } else if (len > 220) {
    lengthRating = 'warn';
    lengthFeedback = 'Too verbose for ATS quick scan';
  }

  return { len, firstWord, hasStrongVerb, lengthRating, lengthFeedback };
}

export default function ResumePage() {
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [resumes, setResumes] = useState<MasterResumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activeResume, setActiveResume] = useState<MasterResumeData | null>(null);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>('');

  const isDirty = Boolean(activeResume && lastSavedSnapshot && JSON.stringify(activeResume) !== lastSavedSnapshot);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const fetchResumes = useCallback(async () => {
    try {
      const res = await fetch('/api/resumes');
      if (res.ok) {
        const data = await res.json();
        const formattedData = data.map((r: any) => ({
          ...r,
          skillGroups: typeof r.skillGroups === 'string' ? JSON.parse(r.skillGroups) : (r.skillGroups || []),
          projects: typeof r.projects === 'string' ? JSON.parse(r.projects) : (r.projects || []),
          certifications: typeof r.certifications === 'string' ? JSON.parse(r.certifications) : (r.certifications || []),
          experience: typeof r.experience === 'string' ? JSON.parse(r.experience) : (r.experience || []),
          education: typeof r.education === 'string' ? JSON.parse(r.education) : (r.education || []),
        }));
        setResumes(formattedData);
        if (formattedData.length > 0 && !activeResume) {
          setActiveResume(formattedData[0]);
          setLastSavedSnapshot(JSON.stringify(formattedData[0]));
        }
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  }, [activeResume]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleSelectResume = async (targetResume: MasterResumeData) => {
    if (isDirty) {
      if (!await confirm({
        title: 'Unsaved Changes',
        description: 'You have unsaved changes on this resume. Switching will discard those changes. Continue?',
        confirmLabel: 'Discard & Switch'
      })) {
        return;
      }
    }
    setActiveResume(targetResume);
    setLastSavedSnapshot(JSON.stringify(targetResume));
  };

  const handleSave = async () => {
    if (!activeResume) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const isNew = !activeResume.id;
      const url = isNew ? '/api/resumes' : `/api/resumes/${activeResume.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeResume),
      });

      if (!res.ok) throw new Error('Failed to save resume');
      const saved = await res.json();
      
      const formattedSaved = {
        ...saved,
        skillGroups: typeof saved.skillGroups === 'string' ? JSON.parse(saved.skillGroups) : (saved.skillGroups || []),
        projects: typeof saved.projects === 'string' ? JSON.parse(saved.projects) : (saved.projects || []),
        certifications: typeof saved.certifications === 'string' ? JSON.parse(saved.certifications) : (saved.certifications || []),
        experience: typeof saved.experience === 'string' ? JSON.parse(saved.experience) : (saved.experience || []),
        education: typeof saved.education === 'string' ? JSON.parse(saved.education) : (saved.education || []),
      };

      setSuccess('Resume saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setLastSavedSnapshot(JSON.stringify(formattedSaved));
      
      if (isNew) {
        setResumes([formattedSaved, ...resumes]);
        setActiveResume(formattedSaved);
      } else {
        setResumes(resumes.map(r => r.id === saved.id ? formattedSaved : r));
        setActiveResume(formattedSaved);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeResume?.id) return;
    if (!await confirm({ title: 'Delete master resume?', description: 'This cannot be undone. Any linked optimized resumes may no longer have a source resume.', confirmLabel: 'Delete resume' })) return;
    
    try {
      const res = await fetch(`/api/resumes/${activeResume.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      const newResumes = resumes.filter(r => r.id !== activeResume.id);
      setResumes(newResumes);
      const nextActive = newResumes.length > 0 ? newResumes[0] : null;
      setActiveResume(nextActive);
      setLastSavedSnapshot(nextActive ? JSON.stringify(nextActive) : '');
      setSuccess('Resume deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Failed to delete resume');
    }
  };

  const createNewResume = async () => {
    if (isDirty) {
      if (!await confirm({
        title: 'Unsaved Changes',
        description: 'You have unsaved changes on this resume. Creating a new base will discard them. Continue?',
        confirmLabel: 'Discard & Create'
      })) {
        return;
      }
    }
    const newResume: MasterResumeData = {
      name: 'New Master Resume',
      title: 'Job Title',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      twitter: '',
      website: '',
      summary: '',
      skills: [],
      skillGroups: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
    };
    setActiveResume(newResume);
    setLastSavedSnapshot(JSON.stringify(newResume));
  };

  const moveExperience = (expId: string, direction: 'up' | 'down') => {
    if (!activeResume) return;
    const index = activeResume.experience.findIndex(e => e.id === expId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeResume.experience.length) return;
    const newExp = [...activeResume.experience];
    const [moved] = newExp.splice(index, 1);
    newExp.splice(targetIndex, 0, moved);
    setActiveResume({ ...activeResume, experience: newExp });
  };

  const moveExpBullet = (expId: string, bulletIndex: number, direction: 'up' | 'down') => {
    if (!activeResume) return;
    const targetIndex = direction === 'up' ? bulletIndex - 1 : bulletIndex + 1;
    setActiveResume({
      ...activeResume,
      experience: activeResume.experience.map(e => {
        if (e.id === expId) {
          if (targetIndex < 0 || targetIndex >= e.bullets.length) return e;
          const newBullets = [...e.bullets];
          const [moved] = newBullets.splice(bulletIndex, 1);
          newBullets.splice(targetIndex, 0, moved);
          return { ...e, bullets: newBullets };
        }
        return e;
      }),
    });
  };

  const moveProject = (projId: string, direction: 'up' | 'down') => {
    if (!activeResume) return;
    const index = activeResume.projects.findIndex(p => p.id === projId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeResume.projects.length) return;
    const newProjects = [...activeResume.projects];
    const [moved] = newProjects.splice(index, 1);
    newProjects.splice(targetIndex, 0, moved);
    setActiveResume({ ...activeResume, projects: newProjects });
  };

  const addExperience = () => {
    if (!activeResume) return;
    const newExp: Experience = {
      id: crypto.randomUUID(),
      company: '',
      title: '',
      startDate: '',
      endDate: '',
      bullets: [''],
    };
    setActiveResume({
      ...activeResume,
      experience: [newExp, ...activeResume.experience],
    });
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    if (!activeResume) return;
    setActiveResume({
      ...activeResume,
      experience: activeResume.experience.map(e => e.id === id ? { ...e, [field]: value } : e),
    });
  };

  const removeExperience = (id: string) => {
    if (!activeResume) return;
    setActiveResume({
      ...activeResume,
      experience: activeResume.experience.filter(e => e.id !== id),
    });
  };

  const updateExpBullet = (expId: string, bulletIndex: number, value: string) => {
    if (!activeResume) return;
    setActiveResume({
      ...activeResume,
      experience: activeResume.experience.map(e => {
        if (e.id === expId) {
          const newBullets = [...e.bullets];
          newBullets[bulletIndex] = value;
          return { ...e, bullets: newBullets };
        }
        return e;
      }),
    });
  };

  const addExpBullet = (expId: string) => {
    if (!activeResume) return;
    setActiveResume({
      ...activeResume,
      experience: activeResume.experience.map(e => {
        if (e.id === expId) {
          return { ...e, bullets: [...e.bullets, ''] };
        }
        return e;
      }),
    });
  };

  const removeExpBullet = (expId: string, bulletIndex: number) => {
    if (!activeResume) return;
    setActiveResume({
      ...activeResume,
      experience: activeResume.experience.map(e => {
        if (e.id === expId) {
          const newBullets = e.bullets.filter((_, i) => i !== bulletIndex);
          return { ...e, bullets: newBullets };
        }
        return e;
      }),
    });
  };

  const addEducation = () => {
    if (!activeResume) return;
    const newEdu: Education = {
      id: crypto.randomUUID(),
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
    };
    setActiveResume({
      ...activeResume,
      education: [newEdu, ...activeResume.education],
    });
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    if (!activeResume) return;
    setActiveResume({
      ...activeResume,
      education: activeResume.education.map(e => e.id === id ? { ...e, [field]: value } : e),
    });
  };

  const removeEducation = (id: string) => {
    if (!activeResume) return;
    setActiveResume({
      ...activeResume,
      education: activeResume.education.filter(e => e.id !== id),
    });
  };

  const addSkillGroup = () => {
    if (!activeResume) return;
    const newGroup: SkillGroup = {
      id: crypto.randomUUID(),
      category: '',
      skills: [],
    };
    setActiveResume({
      ...activeResume,
      skillGroups: [...activeResume.skillGroups, newGroup],
    });
  };

  const updateSkillGroup = (id: string, field: keyof SkillGroup, value: any) => {
    if (!activeResume) return;
    setActiveResume({
      ...activeResume,
      skillGroups: activeResume.skillGroups.map(g => g.id === id ? { ...g, [field]: value } : g),
    });
  };

  const removeSkillGroup = (id: string) => {
    if (!activeResume) return;
    setActiveResume({
      ...activeResume,
      skillGroups: activeResume.skillGroups.filter(g => g.id !== id),
    });
  };

  const addProject = () => {
    if (!activeResume) return;
    const newProj: Project = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
    };
    setActiveResume({
      ...activeResume,
      projects: [newProj, ...activeResume.projects],
    });
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    if (!activeResume) return;
    setActiveResume({
      ...activeResume,
      projects: activeResume.projects.map(p => p.id === id ? { ...p, [field]: value } : p),
    });
  };

  const removeProject = (id: string) => {
    if (!activeResume) return;
    setActiveResume({
      ...activeResume,
      projects: activeResume.projects.filter(p => p.id !== id),
    });
  };

  const addCertification = () => {
    if (!activeResume) return;
    const newCert: Certification = {
      id: crypto.randomUUID(),
      name: '',
      issuer: '',
    };
    setActiveResume({
      ...activeResume,
      certifications: [newCert, ...activeResume.certifications],
    });
  };

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    if (!activeResume) return;
    setActiveResume({
      ...activeResume,
      certifications: activeResume.certifications.map(c => c.id === id ? { ...c, [field]: value } : c),
    });
  };

  const removeCertification = (id: string) => {
    if (!activeResume) return;
    setActiveResume({
      ...activeResume,
      certifications: activeResume.certifications.filter(c => c.id !== id),
    });
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <AppTopbar />
      {confirmDialog}
      <main className="main-content">
        <div className="page-header resume-page-header">
          <div>
            <div className="resume-page-eyebrow"><FileText size={14} /> YOUR CAREER PROFILE</div>
            <h1 className="page-title resume-page-title">
              <FileText size={24} /> Master Resume
            </h1>
            <p className="page-subtitle">Manage your base experience for professional formatting</p>
          </div>
          <div className="resume-page-actions">
             <button className="btn btn-ghost" onClick={createNewResume}>
              <Plus size={16} /> New Base
            </button>
            {activeResume?.id && (
              <button className="btn btn-ghost" style={{ color: 'var(--accent-red)' }} onClick={handleDelete}>
                <Trash2 size={16} /> Delete
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || !activeResume}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Master'}</span>
              {isDirty && (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-amber)',
                    boxShadow: '0 0 6px var(--accent-amber)',
                    display: 'inline-block'
                  }}
                  title="Unsaved changes"
                />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="resume-feedback resume-feedback-error">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="resume-feedback resume-feedback-success">
            {success}
          </div>
        )}

        {loading ? (
          <div className="loading-overlay">
            <div className="spinner" /> Loading...
          </div>
        ) : !activeResume ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={32} /></div>
            <p className="empty-state-title">No Resumes Found</p>
            <button className="btn btn-primary" onClick={createNewResume} style={{ marginTop: 12 }}>Create One</button>
          </div>
        ) : (
          <div className="resume-editor-layout">
            
            {/* Resume Selector */}
            <aside className="resume-navigation-rail">
              {resumes.length > 0 && (
               <div className="resume-saved-list">
                <h2>Saved bases <span>{resumes.length}</span></h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {resumes.map(r => (
                    <button
                      key={r.id}
                      className={`resume-saved-item ${r.id === activeResume.id ? 'active' : ''}`}
                      onClick={() => handleSelectResume(r)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <FileText size={15} aria-hidden="true" style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name || 'Untitled'}</span>
                      </div>
                      {r.id === activeResume.id && isDirty && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-amber)',
                            flexShrink: 0
                          }}
                          title="Unsaved changes"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              )}
              <nav className="resume-section-nav" aria-label="Resume sections">
                <h2>Resume sections</h2>
                <a href="#resume-contact">Contact details</a>
                <a href="#resume-summary">Professional summary</a>
                <a href="#resume-skills">Skills & expertise</a>
                <a href="#resume-experience">Experience</a>
                <a href="#resume-projects">Projects</a>
                <a href="#resume-education">Education</a>
                <a href="#resume-certifications">Certifications</a>
              </nav>
            </aside>

            {/* Editor */}
            <div className="card resume-editor-card">
              
              {/* Header Info */}
              <section id="resume-contact" className="resume-editor-section" style={{ marginBottom: 40 }}>
                <h3 className="section-title-editor"><Edit2 size={16} /> Header & Contact</h3>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={activeResume.name} onChange={(e) => setActiveResume({ ...activeResume, name: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Professional Title</label>
                    <input className="form-input" value={activeResume.title} onChange={(e) => setActiveResume({ ...activeResume, title: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={activeResume.email} onChange={(e) => setActiveResume({ ...activeResume, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={activeResume.phone} onChange={(e) => setActiveResume({ ...activeResume, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-input" value={activeResume.location} onChange={(e) => setActiveResume({ ...activeResume, location: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">LinkedIn (URL)</label>
                    <div style={{ position: 'relative' }}>
                      <Link size={14} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-muted)' }} />
                      <input className="form-input" style={{ paddingLeft: 34 }} value={activeResume.linkedin} onChange={(e) => setActiveResume({ ...activeResume, linkedin: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">X (Twitter) (URL)</label>
                    <div style={{ position: 'relative' }}>
                      <Globe size={14} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-muted)' }} />
                      <input className="form-input" style={{ paddingLeft: 34 }} value={activeResume.twitter} onChange={(e) => setActiveResume({ ...activeResume, twitter: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Portfolio Website (URL)</label>
                    <div style={{ position: 'relative' }}>
                      <Globe size={14} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-muted)' }} />
                      <input className="form-input" style={{ paddingLeft: 34 }} value={activeResume.website} onChange={(e) => setActiveResume({ ...activeResume, website: e.target.value })} />
                    </div>
                  </div>
                </div>
              </section>

              {/* Professional Summary */}
              <section id="resume-summary" className="resume-editor-section" style={{ marginBottom: 40 }}>
                <h3 className="section-title-editor"><FileText size={16} /> Professional Summary</h3>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 120 }}
                  value={activeResume.summary}
                  onChange={(e) => setActiveResume({ ...activeResume, summary: e.target.value })}
                />
              </section>

              {/* Categorized Skills */}
              <section id="resume-skills" className="resume-editor-section" style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 className="section-title-editor" style={{ margin: 0 }}><Award size={16} /> Skills & Expertise</h3>
                  <button className="btn btn-ghost btn-sm" onClick={addSkillGroup}>
                    <Plus size={14} /> Add Category
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {activeResume.skillGroups.map((group) => (
                    <div key={group.id} className="experience-card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <input 
                          className="form-input" 
                          placeholder="Category (e.g. Languages, Frontend)" 
                          style={{ fontWeight: 700, width: 250 }}
                          value={group.category} 
                          onChange={(e) => updateSkillGroup(group.id, 'category', e.target.value)} 
                        />
                        <div style={{ flex: 1 }}>
                          <input 
                            className="form-input" 
                            placeholder="Skills (comma separated)" 
                            value={group.skills.join(', ')} 
                            onChange={(e) => updateSkillGroup(group.id, 'skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                          />
                        </div>
                        <button className="btn btn-ghost btn-icon" style={{ color: 'var(--accent-red)' }} onClick={() => removeSkillGroup(group.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {activeResume.skillGroups.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No skill groups added. Click "Add Category" to group your skills like the reference.</p>
                  )}
                </div>
              </section>

              {/* Experience */}
              <section id="resume-experience" className="resume-editor-section" style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 className="section-title-editor" style={{ margin: 0 }}><Briefcase size={16} /> Experience</h3>
                  <button className="btn btn-ghost btn-sm" onClick={addExperience}>
                    <Plus size={14} /> Add Role
                  </button>
                </div>
                
                {activeResume.experience.map((exp, expIdx) => (
                  <div key={exp.id} className="experience-card">
                    <div className="experience-card-header">
                       <div className="form-row" style={{ flex: 1, gap: 12 }}>
                         <input className="form-input" placeholder="Job Title" value={exp.title} onChange={(e) => updateExperience(exp.id, 'title', e.target.value)} />
                         <input className="form-input" placeholder="Company" value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} />
                       </div>
                       <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 12 }}>
                         <button
                           type="button"
                           className="btn btn-ghost btn-icon btn-sm"
                           disabled={expIdx === 0}
                           onClick={() => moveExperience(exp.id, 'up')}
                           title="Move role up"
                         >
                           <ChevronUp size={16} />
                         </button>
                         <button
                           type="button"
                           className="btn btn-ghost btn-icon btn-sm"
                           disabled={expIdx === activeResume.experience.length - 1}
                           onClick={() => moveExperience(exp.id, 'down')}
                           title="Move role down"
                         >
                           <ChevronDown size={16} />
                         </button>
                         <button
                           type="button"
                           className="btn btn-ghost btn-icon btn-sm"
                           style={{ color: 'var(--accent-red)' }}
                           onClick={() => removeExperience(exp.id)}
                           title="Remove role"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                      <input className="form-input" placeholder="Start Date" value={exp.startDate} onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)} style={{ width: 150 }} />
                      <input className="form-input" placeholder="End Date" value={exp.endDate} onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)} style={{ width: 150 }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {exp.bullets.map((bullet, bIdx) => {
                        const inspection = inspectBullet(bullet);
                        return (
                          <div key={bIdx} style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-secondary)' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                              <span style={{ display: 'inline-block', width: 6, height: 6, minWidth: 6, minHeight: 6, borderRadius: '50%', backgroundColor: 'var(--text-muted)', marginTop: 12, flexShrink: 0 }} />
                              <textarea 
                                className="form-textarea" 
                                style={{ minHeight: 44, padding: '8px 12px', flex: 1 }} 
                                placeholder="Action verb + scope + measurable metric (e.g. Architected microservices cutting latency 35%)..."
                                value={bullet} 
                                onChange={(e) => updateExpBullet(exp.id, bIdx, e.target.value)}
                              />
                              <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-icon btn-sm"
                                  style={{ width: 28, height: 28, padding: 0 }}
                                  disabled={bIdx === 0}
                                  onClick={() => moveExpBullet(exp.id, bIdx, 'up')}
                                  title="Move bullet up"
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-icon btn-sm"
                                  style={{ width: 28, height: 28, padding: 0 }}
                                  disabled={bIdx === exp.bullets.length - 1}
                                  onClick={() => moveExpBullet(exp.id, bIdx, 'down')}
                                  title="Move bullet down"
                                >
                                  <ChevronDown size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-icon btn-sm"
                                  style={{ width: 28, height: 28, padding: 0, color: 'var(--accent-red)' }}
                                  onClick={() => removeExpBullet(exp.id, bIdx)}
                                  title="Delete bullet"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            {bullet.trim() && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingLeft: 14, fontSize: 11 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {inspection.hasStrongVerb ? (
                                    <span style={{ color: 'var(--accent-green)', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
                                      <Check size={12} /> Strong verb: "{inspection.firstWord}"
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                      <Sparkles size={11} style={{ color: 'var(--accent-amber)' }} /> Tip: begin with a strong action verb (e.g. Architected, Accelerated, Reduced)
                                    </span>
                                  )}
                                </div>
                                <span style={{
                                  color: inspection.lengthRating === 'good' ? 'var(--text-muted)' : 'var(--accent-amber)',
                                  fontWeight: 500
                                }}>
                                  {inspection.len} chars {inspection.lengthRating !== 'good' && `• ${inspection.lengthFeedback}`}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={() => addExpBullet(exp.id)}>
                        <Plus size={14} /> Add Bullet
                      </button>
                    </div>
                  </div>
                ))}
              </section>

              {/* Projects */}
              <section id="resume-projects" className="resume-editor-section" style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 className="section-title-editor" style={{ margin: 0 }}><ExternalLink size={16} /> Projects</h3>
                  <button className="btn btn-ghost btn-sm" onClick={addProject}>
                    <Plus size={14} /> Add Project
                  </button>
                </div>
                
                {activeResume.projects.map((proj, projIdx) => (
                  <div key={proj.id} className="experience-card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <input className="form-input" placeholder="Project Name" style={{ fontWeight: 700, width: 300 }} value={proj.name} onChange={(e) => updateProject(proj.id, 'name', e.target.value)} />
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          disabled={projIdx === 0}
                          onClick={() => moveProject(proj.id, 'up')}
                          title="Move project up"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          disabled={projIdx === activeResume.projects.length - 1}
                          onClick={() => moveProject(proj.id, 'down')}
                          title="Move project down"
                        >
                          <ChevronDown size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          style={{ color: 'var(--accent-red)' }}
                          onClick={() => removeProject(proj.id)}
                          title="Delete project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <textarea 
                      className="form-textarea" 
                      placeholder="Project description and impact..." 
                      style={{ minHeight: 60 }} 
                      value={proj.description} 
                      onChange={(e) => updateProject(proj.id, 'description', e.target.value)} 
                    />
                  </div>
                ))}
              </section>

              {/* Education */}
              <section id="resume-education" className="resume-editor-section" style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 className="section-title-editor" style={{ margin: 0 }}><GraduationCap size={16} /> Education</h3>
                  <button className="btn btn-ghost btn-sm" onClick={addEducation}>
                    <Plus size={14} /> Add Education
                  </button>
                </div>
                
                {activeResume.education.map((edu) => (
                  <div key={edu.id} className="experience-card">
                    <div className="experience-card-header">
                       <div className="form-row" style={{ flex: 1, gap: 12 }}>
                         <input className="form-input" placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} />
                         <input className="form-input" placeholder="School" value={edu.school} onChange={(e) => updateEducation(edu.id, 'school', e.target.value)} />
                       </div>
                       <button className="btn btn-ghost btn-icon" style={{ color: 'var(--accent-red)' }} onClick={() => removeEducation(edu.id)}>
                         <Trash2 size={16} />
                       </button>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                      <input className="form-input" placeholder="Field of Study" value={edu.field} onChange={(e) => updateEducation(edu.id, 'field', e.target.value)} />
                      <input className="form-input" placeholder="Year / End Date" value={edu.endDate} onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)} style={{ width: 140 }} />
                    </div>
                  </div>
                ))}
              </section>

              {/* Certifications */}
              <section id="resume-certifications" className="resume-editor-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 className="section-title-editor" style={{ margin: 0 }}><Award size={16} /> Certifications</h3>
                  <button className="btn btn-ghost btn-sm" onClick={addCertification}>
                    <Plus size={14} /> Add Certification
                  </button>
                </div>
                
                {activeResume.certifications.map((cert) => (
                  <div key={cert.id} className="experience-card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input className="form-input" placeholder="Certification Name" style={{ fontWeight: 600 }} value={cert.name} onChange={(e) => updateCertification(cert.id, 'name', e.target.value)} />
                    <input className="form-input" placeholder="Issuer" value={cert.issuer} onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)} />
                    <button className="btn btn-ghost btn-icon" style={{ color: 'var(--accent-red)' }} onClick={() => removeCertification(cert.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </section>

            </div>
          </div>
        )}
      </main>
      
      <style jsx>{`
        .section-title-editor {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 20px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-secondary);
        }
      `}</style>
    </div>
  );
}
