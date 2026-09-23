'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  FlaskConical,
  Zap,
  FileText,
  Download,
  Save,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  Send,
  Plus,
  RotateCcw
} from 'lucide-react';
import type { MasterResumeData, GapAnalysis, OptimizedBullet } from '@/lib/types';
import PDFDownloadButton from '@/components/PDFDownloadButton';

function resumeToText(resume: MasterResumeData): string {
  let text = `${resume.name}\n${resume.title}\n${resume.email} | ${resume.phone} | ${resume.location}\n\n`;
  if (resume.summary) text += `SUMMARY\n${resume.summary}\n\n`;

  if (resume.skillGroups && resume.skillGroups.length) {
    text += 'SKILLS\n';
    for (const group of resume.skillGroups) {
      text += `● ${group.category}: ${group.skills.join(', ')}\n`;
    }
    text += '\n';
  } else if (resume.skills.length) {
    text += `SKILLS\n${resume.skills.join(', ')}\n\n`;
  }
  if (resume.experience.length) {
    text += 'EXPERIENCE\n';
    for (const exp of resume.experience) {
      text += `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})\n`;
      for (const b of exp.bullets) text += `• ${b}\n`;
      text += '\n';
    }
  }

  if ((resume.projects ?? []).length > 0) {
    text += 'PROJECTS\n';
    for (const proj of resume.projects) {
      text += `${proj.name}\n${proj.description}\n\n`;
    }
  }

  if (resume.education.length) {
    text += 'EDUCATION\n';
    for (const edu of resume.education) {
      text += `${edu.degree} in ${edu.field} - ${edu.school} (${edu.startDate} - ${edu.endDate})\n`;
    }
    text += '\n';
  }

  if ((resume.certifications ?? []).length > 0) {
    text += 'CERTIFICATIONS\n';
    for (const cert of resume.certifications) {
      text += `● ${cert.name} - ${cert.issuer}\n`;
    }
  }

  return text;
}

export default function LabPage() {
  const [resumes, setResumes] = useState<MasterResumeData[]>([]);
  const [selectedResume, setSelectedResume] = useState<MasterResumeData | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [recruiterName, setRecruiterName] = useState('');

  const [analysis, setAnalysis] = useState<GapAnalysis | null>(null);
  const [optimizedBullets, setOptimizedBullets] = useState<OptimizedBullet[]>([]);
  const [optimizedSummary, setOptimizedSummary] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [linkedinMessage, setLinkedinMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<'idle' | 'saved' | 'applied'>('idle');
  const [generationTimes, setGenerationTimes] = useState<Record<string, number>>({});

  const [activeTab, setActiveTab] = useState<'analysis' | 'optimize' | 'cover' | 'linkedin' | 'chat'>('analysis');
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [generatingLinkedin, setGeneratingLinkedin] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [ollamaSettings, setOllamaSettings] = useState({ model: 'qwen3.5:4b', baseUrl: 'http://127.0.0.1:11434' });
  const [labModel, setLabModel] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<{ name: string }[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [showPostApplyModal, setShowPostApplyModal] = useState(false);
  const [savedData, setSavedData] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Add notification permission request
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Check localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('resume-buddy-lab-state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.applicationId || state.company || state.jobDescription) {
          setSavedData(state);
          setShowRestorePrompt(true);
        } else {
          setIsInitialized(true);
        }
      } catch (e) {
        setIsInitialized(true);
      }
    } else {
      setIsInitialized(true);
    }
  }, []);

  const handleRestore = (restore: boolean) => {
    if (restore && savedData) {
      if (savedData.applicationId) setApplicationId(savedData.applicationId);
      if (savedData.applicationStatus) setApplicationStatus(savedData.applicationStatus);
      if (savedData.jobDescription) setJobDescription(savedData.jobDescription);
      if (savedData.company) setCompany(savedData.company);
      if (savedData.jobTitle) setJobTitle(savedData.jobTitle);
      if (savedData.extraInfo) setExtraInfo(savedData.extraInfo);
      if (savedData.recruiterName) setRecruiterName(savedData.recruiterName);
      if (savedData.analysis) setAnalysis(savedData.analysis);
      if (savedData.optimizedBullets) setOptimizedBullets(savedData.optimizedBullets);
      if (savedData.optimizedSummary) setOptimizedSummary(savedData.optimizedSummary);
      if (savedData.coverLetter) setCoverLetter(savedData.coverLetter);
      if (savedData.linkedinMessage) setLinkedinMessage(savedData.linkedinMessage);
      if (savedData.chatMessages) setChatMessages(savedData.chatMessages);
      if (savedData.activeTab) setActiveTab(savedData.activeTab);
      if (savedData.generationTimes) setGenerationTimes(savedData.generationTimes);
    } else {
      localStorage.removeItem('resume-buddy-lab-state');
    }
    setShowRestorePrompt(false);
    setIsInitialized(true);
  };

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!isInitialized) return;
    const state = {
      applicationId,
      applicationStatus,
      jobDescription,
      company,
      jobTitle,
      extraInfo,
      recruiterName,
      analysis,
      optimizedBullets,
      optimizedSummary,
      coverLetter,
      linkedinMessage,
      chatMessages,
      activeTab,
      generationTimes
    };
    localStorage.setItem('resume-buddy-lab-state', JSON.stringify(state));
  }, [applicationId, applicationStatus, jobDescription, company, jobTitle, extraInfo, recruiterName, analysis, optimizedBullets, optimizedSummary, coverLetter, linkedinMessage, chatMessages, activeTab, generationTimes, isInitialized]);

  const notify = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const fetchResumes = useCallback(async () => {
    try {
      const [resumesRes, settingsRes] = await Promise.all([
        fetch('/api/resumes'),
        fetch('/api/settings')
      ]);

      if (resumesRes.ok) {
        const data = await resumesRes.json();
        setResumes(data);
        if (data.length > 0 && !selectedResume) setSelectedResume(data[0]);
      }

      if (settingsRes.ok) {
        const s = await settingsRes.json();
        setOllamaSettings({ model: s.ollamaModel, baseUrl: s.ollamaBaseUrl });
      }

      setFetchingModels(true);
      try {
        const modelsRes = await fetch('/api/ollama/models');
        if (modelsRes.ok) {
          const models = await modelsRes.json();
          setAvailableModels(models);
        }
      } catch (e) {
        console.error('Failed to fetch models:', e);
      } finally {
        setFetchingModels(false);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  }, [selectedResume]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleStartNewApplication = () => {
    setApplicationId(null);
    setApplicationStatus('idle');
    setJobDescription('');
    setCompany('');
    setJobTitle('');
    setExtraInfo('');
    setRecruiterName('');
    setAnalysis(null);
    setOptimizedBullets([]);
    setOptimizedSummary('');
    setCoverLetter('');
    setLinkedinMessage('');
    setChatMessages([]);
    setGenerationTimes({});
    localStorage.removeItem('resume-buddy-lab-state');
    setActiveTab('analysis');
  };

  const handleAnalyze = async () => {
    if (!selectedResume) {
      alert('Missing Resume: Please select a Master Resume from the top-right dropdown.');
      return;
    }
    if (!jobDescription.trim()) {
      alert('Missing Job Description: Please paste the job description into the main text box.');
      return;
    }
    setAnalyzing(true);
    setError('');
    setAnalysis(null);
    const startTime = Date.now();
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeToText(selectedResume),
          jobDescription,
          action: 'analyze',
          model: labModel || ollamaSettings.model,
          baseUrl: ollamaSettings.baseUrl,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Analysis failed');
      }
      const data = await res.json();
      setAnalysis(data.result);
      setGenerationTimes(prev => ({ ...prev, analyze: (prev.analyze || 0) + (Date.now() - startTime) }));
      setActiveTab('analysis');
      notify('Analysis Ready!', 'Resume analysis against JD is complete.');
    } catch (e) {
      if (e instanceof Error && e.message.toLowerCase().includes('system memory')) {
        setError('Out of Memory: Your computer doesn\'t have enough RAM to run ' + (labModel || ollamaSettings.model) + '. Please select a smaller model like phi3 or tinyllama from the dropdown above.');
      } else {
        setError(e instanceof Error ? e.message : 'Analysis failed');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    if (!selectedResume) {
      alert('Missing Resume: Please select a Master Resume from the top-right dropdown.');
      return;
    }
    if (!jobDescription.trim()) {
      alert('Missing Job Description: Please paste the job description into the main text box.');
      return;
    }
    setOptimizing(true);
    setError('');
    setOptimizedBullets([]);
    setOptimizedSummary('');
    const startTime = Date.now();
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeToText(selectedResume),
          jobDescription,
          action: 'optimize',
          model: labModel || ollamaSettings.model,
          baseUrl: ollamaSettings.baseUrl,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Optimization failed');
      }
      const data = await res.json();
      setOptimizedBullets(data.result.bullets || []);
      setOptimizedSummary(data.result.optimizedSummary || '');
      setGenerationTimes(prev => ({ ...prev, optimize: (prev.optimize || 0) + (Date.now() - startTime) }));
      setActiveTab('optimize');
      notify('Optimization Ready!', 'Tailored bullet points are ready.');
    } catch (e) {
      if (e instanceof Error && e.message.toLowerCase().includes('system memory')) {
        setError('Out of Memory: ' + (labModel || ollamaSettings.model) + ' is too large for your available RAM. Try switching to phi3 or tinyllama above.');
      } else {
        setError(e instanceof Error ? e.message : 'Optimization failed');
      }
    } finally {
      setOptimizing(false);
    }
  };

  const handleCoverLetter = async () => {
    if (!selectedResume) {
      alert('Missing Resume: Please select a Master Resume from the top-right dropdown.');
      return;
    }
    if (!jobDescription.trim()) {
      alert('Missing Job Description: Please paste the job description into the main text box.');
      return;
    }
    setGeneratingCover(true);
    setError('');
    setCoverLetter('');
    const startTime = Date.now();
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeToText(selectedResume),
          jobDescription,
          company: company || 'the company',
          jobTitle: jobTitle || 'the position',
          action: 'cover-letter',
          model: labModel || ollamaSettings.model,
          baseUrl: ollamaSettings.baseUrl,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        const msg = errData.error || '';
        if (msg.toLowerCase().includes('system memory')) {
          throw new Error('Out of Memory: ' + (labModel || ollamaSettings.model) + ' is too large for your RAM. Try switching to phi3 or tinyllama.');
        }
        throw new Error(msg || 'Cover letter generation failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Failed to read stream');

      let fullLetter = '';
      const decoder = new TextDecoder();
      setActiveTab('cover');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullLetter += chunk;
        fullLetter = fullLetter.replace(/^\s*(#|\*\*)*\s*cover letter\s*(#|\*\*)*\s*\n+/i, '');
        setCoverLetter(fullLetter);
      }
      setGenerationTimes(prev => ({ ...prev, coverLetter: (prev.coverLetter || 0) + (Date.now() - startTime) }));

      notify('Cover Letter Ready!', 'Your tailored cover letter is complete.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cover letter generation failed');
    } finally {
      setGeneratingCover(false);
    }
  };

  const handleLinkedinMessage = async () => {
    if (!selectedResume) {
      alert('Missing Resume: Please select a Master Resume from the top-right dropdown.');
      return;
    }
    if (!jobDescription.trim()) {
      alert('Missing Job Description: Please paste the job description into the main text box.');
      return;
    }
    setGeneratingLinkedin(true);
    setError('');
    setLinkedinMessage('');
    const startTime = Date.now();
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeToText(selectedResume),
          jobDescription,
          company: company || 'the company',
          jobTitle: jobTitle || 'the position',
          extraInfo,
          recruiterName,
          action: 'linkedin-message',
          model: labModel || ollamaSettings.model,
          baseUrl: ollamaSettings.baseUrl,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        const msg = errData.error || '';
        if (msg.toLowerCase().includes('system memory')) {
          throw new Error('Out of Memory: ' + (labModel || ollamaSettings.model) + ' is too large for your RAM. Try switching to phi3 or tinyllama.');
        }
        throw new Error(msg || 'LinkedIn message generation failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Failed to read stream');

      let fullMsg = '';
      const decoder = new TextDecoder();
      setActiveTab('linkedin');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullMsg += decoder.decode(value, { stream: true });
        setLinkedinMessage(fullMsg);
      }
      setGenerationTimes(prev => ({ ...prev, linkedinMessage: (prev.linkedinMessage || 0) + (Date.now() - startTime) }));

      notify('LinkedIn Message Ready!', 'Outreach message generated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGeneratingLinkedin(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedResume) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setSendingChat(true);
    const newContext = [...chatMessages, { role: 'user', content: userMsg }];
    setChatMessages(newContext as any);
    const startTime = Date.now();

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeToText(selectedResume),
          jobDescription,
          extraInfo,
          messages: newContext,
          action: 'qa-chat',
          model: labModel || ollamaSettings.model,
          baseUrl: ollamaSettings.baseUrl,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        const msg = errData.error || '';
        if (msg.toLowerCase().includes('system memory')) {
          throw new Error('Out of Memory: ' + (labModel || ollamaSettings.model) + ' is too large for your RAM. Try switching to phi3 or tinyllama.');
        }
        throw new Error(msg || 'Chat failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Failed to read stream');

      let currentResponse = '';
      const decoder = new TextDecoder();

      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        currentResponse += decoder.decode(value, { stream: true });
        setChatMessages(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1].content = currentResponse;
          return newHistory;
        });
      }
      setGenerationTimes(prev => ({ ...prev, chat: (prev.chat || 0) + (Date.now() - startTime) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chat failed');
    } finally {
      setSendingChat(false);
    }
  };

  const handleSaveApplication = async (newStatus: 'saved' | 'applied') => {
    if (!selectedResume?.id || !jobDescription.trim()) return;
    setSaving(true);
    setError('');
    try {
      const method = applicationId ? 'PUT' : 'POST';
      const url = applicationId ? `/api/applications/${applicationId}` : '/api/applications';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: company || 'Unknown Company',
          jobTitle: jobTitle || 'Unknown Position',
          jobDescription,
          extraInfo,
          recruiterName,
          status: newStatus,
          atsScore: analysis?.score || 0,
          optimizedResume: JSON.stringify(optimizedBullets),
          optimizedSummary: optimizedSummary || '',
          coverLetter: coverLetter || '',
          linkedinMessage: linkedinMessage || '',
          masterResumeId: selectedResume.id,
          generationTimes: JSON.stringify(generationTimes),
          appliedAt: newStatus === 'applied' ? new Date().toISOString() : undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setApplicationId(data.id);
      setApplicationStatus(newStatus);
      if (newStatus === 'applied') {
        setShowPostApplyModal(true);
      } else {
        setSuccessMsg('Application saved to Job Log!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save application');
    } finally {
      setSaving(false);
    }
  };

  const scoreColor = (score: number) =>
    score >= 70 ? 'var(--accent-green)' : score >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)';

  const isProcessing = analyzing || optimizing || generatingCover || generatingLinkedin || sendingChat;

  return (
    <div className="app-layout">
      {showRestorePrompt && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400, padding: 24, textAlign: 'center' }}>
            <h2 style={{ fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Save size={20} color="var(--accent-primary)" /> Draft Found
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
              You have {savedData?.jobTitle && savedData?.company ? <strong>{savedData.jobTitle} at {savedData.company}</strong> : 'an unsaved application draft'}. Do you want to restore it?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => handleRestore(false)}>
                Discard
              </button>
              <button className="btn btn-primary" onClick={() => handleRestore(true)}>
                Restore Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {showPostApplyModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400, padding: 32, textAlign: 'center', animation: 'scaleIn 0.3s ease-out' }}>
            <div style={{ width: 64, height: 64, background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={32} color="var(--accent-green)" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Application Finalized!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14, lineHeight: 1.5 }}>
              Your application for <strong>{jobTitle}</strong> at <strong>{company}</strong> has been marked as applied and saved to your Job Log. What would you like to do next?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               <button 
                className="btn btn-primary" 
                style={{ padding: '12px 0', fontSize: 14, fontWeight: 600 }}
                onClick={() => {
                  setShowPostApplyModal(false);
                  handleStartNewApplication();
                }}
              >
                Apply to Another Job
              </button>
              <button 
                className="btn btn-ghost" 
                style={{ padding: '12px 0', border: '1px solid var(--border-secondary)', fontSize: 14 }}
                onClick={() => window.location.href = '/applications'}
              >
                Go to Job Log
              </button>
              <button 
                className="btn btn-ghost" 
                style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}
                onClick={() => setShowPostApplyModal(false)}
              >
                Just Close
              </button>
            </div>
          </div>
        </div>
      )}
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <div className="dashboard-grid" style={{ gridTemplateColumns: '400px 1fr', height: 'calc(100vh - 100px)' }}>
          {/* Left Column: Control Panel */}
          <div className="control-panel">
            <div className="page-header" style={{ marginBottom: 8, paddingLeft: 8 }}>
              <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FlaskConical size={24} color="var(--accent-primary)" /> AI Lab
              </h1>
              <p className="page-subtitle">Configure your optimization workstation</p>
            </div>

            {/* Context Card */}
            <div className="workspace-card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label className="premium-label">
                  <Zap size={14} /> AI Intelligence & Target
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <select
                      className="form-select"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}
                      value={selectedResume?.id || ''}
                      onChange={(e) => {
                        const r = resumes.find((r) => r.id === e.target.value);
                        if (r) setSelectedResume(r);
                      }}
                    >
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>{r.name} — {r.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <select
                      className="form-select"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}
                      value={labModel || ollamaSettings.model}
                      onChange={(e) => setLabModel(e.target.value)}
                    >
                      {availableModels.length > 0 ? (
                        availableModels.map(m => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))
                      ) : fetchingModels ? (
                        <option value="">Fetching models...</option>
                      ) : (
                        <option value="">No models installed</option>
                      )}
                    </select>
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Default: {ollamaSettings.model}</span>
                      <a href="/settings" style={{ fontSize: 10, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Configure Model</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details Card */}
            <div className="workspace-card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label className="premium-label">
                  <FileText size={14} /> Position Details
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="premium-input-group">
                      <input 
                        className="premium-textarea" 
                        style={{ height: 44, padding: '10px 16px' }} 
                        placeholder="Company Name" 
                        value={company} 
                        onChange={(e) => setCompany(e.target.value)} 
                      />
                    </div>
                    <div className="premium-input-group">
                      <input 
                        className="premium-textarea" 
                        style={{ height: 44, padding: '10px 16px' }} 
                        placeholder="Job Title" 
                        value={jobTitle} 
                        onChange={(e) => setJobTitle(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="premium-input-group">
                      <input 
                        className="premium-textarea" 
                        style={{ height: 44, padding: '10px 16px' }} 
                        placeholder="Recruiter (Optional)" 
                        value={recruiterName} 
                        onChange={(e) => setRecruiterName(e.target.value)} 
                      />
                    </div>
                    <div className="premium-input-group">
                      <input 
                        className="premium-textarea" 
                        style={{ height: 44, padding: '10px 16px' }} 
                        placeholder="Extra Context (Values, etc)" 
                        value={extraInfo} 
                        onChange={(e) => setExtraInfo(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="premium-input-group" style={{ display: 'flex', flexDirection: 'column' }}>
                    <textarea
                      className="premium-textarea"
                      style={{ minHeight: 280 }}
                      placeholder="Paste the position requirements and responsibilities here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                    />
                    <div style={{ padding: '4px 16px 12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                        {jobDescription.length.toLocaleString()} characters
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button className="btn btn-primary" onClick={handleAnalyze} disabled={isProcessing} style={{ padding: '12px 0', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}>
                  {analyzing ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Zap size={15} />} Analyze Gap
                </button>
                <button className="btn btn-green" onClick={handleOptimize} disabled={isProcessing} style={{ padding: '12px 0', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)' }}>
                  {optimizing ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Sparkles size={15} />} Optimize
                </button>
                <button className="btn btn-ghost" onClick={handleCoverLetter} disabled={isProcessing} style={{ padding: '12px 0', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)' }}>
                  <FileText size={15} /> Cover Letter
                </button>
                <button className="btn btn-ghost" onClick={handleLinkedinMessage} disabled={isProcessing} style={{ padding: '12px 0', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)' }}>
                  <Send size={15} /> Outreach Msg
                </button>
              </div>
            </div>

            {/* Status Footer */}
            {applicationStatus !== 'idle' && (
              <div style={{ padding: '16px 20px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 'var(--radius-xl)', animation: 'fadeInSlideUp 0.4s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                  <CheckCircle2 size={18} color="var(--accent-green)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>Application {applicationStatus === 'applied' ? 'Applied' : 'Saved'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{company} &middot; {jobTitle}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={handleStartNewApplication} style={{ padding: '6px 10px', height: 'auto', background: 'rgba(255, 255, 255, 0.05)' }}>
                    <Plus size={12} /> New
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Display Panel */}
          <div className="display-panel">
            <div className="display-panel-header">
              <div className="tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
                <button className={`tab ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>Gap Analysis</button>
                <button className={`tab ${activeTab === 'optimize' ? 'active' : ''}`} onClick={() => setActiveTab('optimize')}>Tailored Resume</button>
                <button className={`tab ${activeTab === 'cover' ? 'active' : ''}`} onClick={() => setActiveTab('cover')}>Cover Letter</button>
                <button className={`tab ${activeTab === 'linkedin' ? 'active' : ''}`} onClick={() => setActiveTab('linkedin')}>Outreach</button>
                <button className={`tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>AI Q&A</button>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {Object.keys(generationTimes).length > 0 && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="spinner" style={{ width: 8, height: 8, animationDuration: '3s' }} /> Total AI Time: <strong style={{color: 'var(--text-primary)'}}>{(Object.values(generationTimes).reduce((a, b) => a + b, 0) / 1000).toFixed(1)}s</strong>
                  </div>
                )}
                {(analysis || optimizedBullets.length > 0 || coverLetter) && applicationStatus !== 'applied' && (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleSaveApplication('saved')} disabled={saving}>
                      <Save size={14} /> {saving && applicationStatus === 'saved' ? '...' : 'Save Draft'}
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveApplication('applied')} disabled={saving}>
                      <CheckCircle2 size={14} /> Finish
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="display-panel-body" style={{ background: activeTab === 'optimize' || activeTab === 'cover' ? 'var(--bg-primary)' : 'transparent' }}>
              {activeTab === 'analysis' && <AnalysisView analysis={analysis} loading={analyzing} scoreColor={scoreColor} />}
              {activeTab === 'optimize' && (
                <OptimizeView
                  bullets={optimizedBullets}
                  summary={optimizedSummary}
                  loading={optimizing}
                  resume={selectedResume}
                />
              )}
              {activeTab === 'cover' && (
                <CoverLetterView
                  letter={coverLetter}
                  loading={generatingCover}
                  onRegenerate={handleCoverLetter}
                />
              )}
              {activeTab === 'linkedin' && (
                <LinkedinView
                  message={linkedinMessage}
                  loading={generatingLinkedin}
                  onRegenerate={handleLinkedinMessage}
                />
              )}
              {activeTab === 'chat' && (
                <ChatView
                  messages={chatMessages}
                  input={chatInput}
                  setInput={setChatInput}
                  onSubmit={handleChatSubmit}
                  loading={sendingChat}
                />
              )}
            </div>
          </div>
        </div>
        {error && (
          <div style={{
            position: 'fixed', bottom: 32, right: 32, zIndex: 100,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px',
            background: 'rgba(239,68,68,0.9)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)', color: 'white', fontSize: 14,
            boxShadow: 'var(--shadow-lg)'
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </main>
    </div>
  );
}

function AnalysisView({ analysis, loading, scoreColor }: { analysis: GapAnalysis | null; loading: boolean; scoreColor: (s: number) => string; }) {
  if (loading) return <div className="loading-overlay" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center' }}><div className="spinner" style={{ width: 40, height: 40 }} /><span>Analyzing ATS compatibility...</span></div>;
  if (!analysis) return <div className="empty-state" style={{ height: '100%' }}><div className="empty-state-icon"><Zap size={28} /></div><p className="empty-state-title">Awaiting Data</p><p className="empty-state-text">Paste a job description and click &quot;Analyze&quot; to see your compatibility score.</p></div>;

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (analysis.score / 100) * circumference;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 40, padding: 40, background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-card) 100%)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-secondary)', boxShadow: 'var(--shadow-lg)' }}>
        <div className="circular-stat" style={{ width: 140, height: 140, position: 'relative' }}>
          <svg width="140" height="140" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={scoreColor(analysis.score)} stopOpacity="0.8" />
                <stop offset="100%" stopColor={scoreColor(analysis.score)} />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-primary)" strokeWidth="6" strokeOpacity="0.3" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="7" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          </svg>
          <div className="stat-value" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>{analysis.score}%</div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="premium-label" style={{ marginBottom: 4 }}>Match Quality</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>ATS Alignment Report</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, maxWidth: 600 }}>
            {analysis.score > 80 ? "Excellent alignment. Your core skills match the primary requirements of this role excellently." :
              analysis.score > 50 ? "Solid foundation. Some key optimizations in your bullet points could significantly improve your ranking." :
                "Significant gaps detected. You may need to incorporate more relevant keywords or bridge experience gaps."}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <CollapsibleSection title="Keywords Found" count={analysis.matchedKeywords.length} defaultOpen>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {analysis.matchedKeywords.map((kw, i) => (
              <span key={i} className="keyword-tag matched">{kw}</span>
            ))}
            {analysis.matchedKeywords.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>No direct keyword matches found.</div>
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Keywords Missing" count={analysis.missingKeywords.length} defaultOpen>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {analysis.missingKeywords.map((kw, i) => (
              <span key={i} className="keyword-tag missing">{kw}</span>
            ))}
            {analysis.missingKeywords.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 500, padding: '12px 0' }}>Perfect! All critical keywords are present.</div>
            )}
          </div>
        </CollapsibleSection>
      </div>

      <div className="workspace-card" style={{ borderStyle: 'solid', borderColor: 'var(--border-secondary)', padding: '32px' }}>
        <div className="premium-label" style={{ marginBottom: 16 }}>Strategic Roadmap</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={20} color="var(--accent-amber)" /> Key Recommendations
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {analysis.suggestions.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-amber)', marginTop: 8, flexShrink: 0 }} />
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OptimizeView({ bullets, summary, loading, resume }: { bullets: OptimizedBullet[]; summary?: string; loading: boolean; resume?: MasterResumeData | null }) {
  if (loading) return <div className="loading-overlay" style={{ height: '100%' }}><div className="spinner" /><span>Optimizing resume content...</span></div>;
  if (bullets.length === 0 && !summary) return <div className="empty-state" style={{ height: '100%' }}><div className="empty-state-icon"><Sparkles size={28} /></div><p className="empty-state-title">No optimization data</p><p className="empty-state-text">Click &quot;Optimize&quot; to generate tailored content.</p></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {resume && (
        <div className="paper-actions">
          <PDFDownloadButton
            resume={resume}
            optimizedBullets={bullets}
            optimizedSummary={summary || ''}
          />
        </div>
      )}

      <div className="document-paper">
        {summary && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 4, marginBottom: 12 }}>PROFESSIONAL SUMMARY</h3>
            <p style={{ fontSize: 14, lineHeight: 1.5, textAlign: 'justify' }}>{summary}</p>
          </div>
        )}

        <h3 style={{ fontSize: 16, fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 4, marginBottom: 12 }}>EXPERIENCE OPTIMIZATIONS</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {bullets.map((b, i) => (
            <div key={i} style={{ fontSize: 14, lineHeight: 1.5 }}>
              <div style={{ color: '#666', fontSize: 11, fontStyle: 'italic', marginBottom: 2 }}>{b.original}</div>
              <div style={{ fontWeight: 500 }}>• {b.optimized}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CoverLetterView({ letter, loading, onRegenerate }: { letter: string; loading: boolean; onRegenerate: () => void }) {
  if (loading) return <div className="loading-overlay" style={{ height: '100%' }}><div className="spinner" /><span>Crafting your cover letter...</span></div>;
  if (!letter) return <div className="empty-state" style={{ height: '100%' }}><div className="empty-state-icon"><FileText size={28} /></div><p className="empty-state-title">No cover letter yet</p><p className="empty-state-text">Click &quot;Cover Letter&quot; to generate a tailored letter.</p></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="paper-actions">
        <button className="btn btn-ghost btn-sm" onClick={onRegenerate}>
          <RotateCcw size={14} /> Regenerate
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(new Blob([letter], { type: 'text/plain' }));
          a.download = 'cover_letter.txt';
          a.click();
        }}><Download size={14} /> Download TXT</button>
      </div>
      <div className="document-paper" style={{ whiteSpace: 'pre-wrap' }}>
        {letter}
      </div>
    </div>
  );
}

function LinkedinView({ message, loading, onRegenerate }: { message: string; loading: boolean; onRegenerate: () => void }) {
  if (loading) return <div className="loading-overlay" style={{ height: '100%' }}><div className="spinner" /><span>Drafting LinkedIn message...</span></div>;
  if (!message) return <div className="empty-state" style={{ height: '100%' }}><div className="empty-state-icon"><Send size={28} /></div><p className="empty-state-title">No message yet</p><p className="empty-state-text">Click &quot;LinkedIn Msg&quot; to generate a short, assertive outreach message.</p></div>;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onRegenerate}>
          <RotateCcw size={14} /> Regenerate
        </button>
      </div>
      <div className="cover-letter-preview" style={{ flex: 1, padding: 24, fontSize: 16 }}>{message}</div>
    </div>
  );
}

function ChatView({ messages, input, setInput, onSubmit, loading }: {
  messages: { role: string, content: string }[];
  input: string;
  setInput: (s: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 && (
          <div className="empty-state" style={{ height: '100%', border: 'none' }}>
            <div className="empty-state-icon"><MessageSquare size={28} /></div>
            <p className="empty-state-title">Workstation Q&A</p>
            <p className="empty-state-text">Ask anything about the JD or how to improve your resume for this specific role.</p>
          </div>
        )}
        <div className="chat-container">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role === 'user' ? 'user' : 'assistant'}`}>
              {m.content}
            </div>
          ))}
          {loading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="chat-bubble assistant" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="spinner" style={{ width: 14, height: 14 }} /> Thinking...
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 12, maxWidth: 800, margin: '0 auto' }}>
          <input
            className="form-input"
            style={{ flex: 1, borderRadius: 12, height: 48, paddingLeft: 20 }}
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" style={{ borderRadius: 12, width: 48, height: 48, padding: 0 }} disabled={loading || !input.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, count, defaultOpen = false, children }: { title: string; count: number; defaultOpen?: boolean; children: React.ReactNode; }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>
        <span>{title} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({count})</span></span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div style={{ padding: '0 16px 16px' }}>{children}</div>}
    </div>
  );
}
