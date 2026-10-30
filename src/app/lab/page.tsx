'use client';

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from 'react';
import type { ElementType } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppTopbar from '@/components/AppTopbar';
import { SelectField, Tabs, TextField } from '@/components/ui';
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
  RotateCcw,
  Copy,
  Check,
  Pencil,
  X,
  BookOpen,
} from 'lucide-react';
import type { MasterResumeData, GapAnalysis, OptimizedBullet, StoryBankItem } from '@/lib/types';
import PDFDownloadButton from '@/components/PDFDownloadButton';
import CoverLetterPDF from '@/components/CoverLetterPDF';
import { pdf } from '@react-pdf/renderer';
import { registerInterFont } from '@/lib/registerFonts';

function cleanCoverLetter(text: string): string {
  if (!text) return '';
  return text
    .replace(/^###\s*$/gm, '')
    .replace(/^#+\s+/gm, '')
    .replace(/^\s*(#|\*\*)*\s*cover letter:?\s*(#|\*\*)*\s*\n+/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function resumeToText(resume: MasterResumeData): string {
  let text = `${resume.name}\n${resume.title}\n`;
  const contact: string[] = [];
  if (resume.location) contact.push(resume.location);
  if (resume.phone) contact.push(resume.phone);
  if (resume.email) contact.push(resume.email);
  if (contact.length) text += `${contact.join(' | ')}\n`;

  const links: string[] = [];
  if (resume.linkedin) links.push(`LinkedIn: ${resume.linkedin}`);
  if (resume.twitter) links.push(`X: ${resume.twitter}`);
  if (resume.website) links.push(`Website: ${resume.website}`);
  if (links.length) text += `${links.join(' | ')}\n`;
  text += '\n';

  if (resume.summary) text += `PROFESSIONAL SUMMARY\n${resume.summary}\n\n`;

  if (resume.skillGroups && resume.skillGroups.length) {
    text += 'SKILLS\n';
    for (const group of resume.skillGroups) {
      text += `• ${group.category}: ${group.skills.join(', ')}\n`;
    }
    text += '\n';
  } else if (resume.skills && resume.skills.length) {
    text += `SKILLS\n${resume.skills.join(', ')}\n\n`;
  }

  if (resume.experience && resume.experience.length) {
    text += 'PROFESSIONAL EXPERIENCE\n';
    for (const exp of resume.experience) {
      text += `${exp.title}\n${exp.company} (${exp.startDate} - ${exp.endDate})\n`;
      for (const b of exp.bullets) text += `• ${b.trim()}\n`;
      text += '\n';
    }
  }

  if ((resume.projects ?? []).length > 0) {
    text += 'PROJECTS\n';
    for (const proj of resume.projects) {
      text += `• ${proj.name}${proj.url ? ` (${proj.url})` : ''}: ${proj.description}\n`;
    }
    text += '\n';
  }

  if (resume.education && resume.education.length) {
    text += 'EDUCATION\n';
    for (const edu of resume.education) {
      text += `${edu.degree}${edu.field ? ` in ${edu.field}` : ''} - ${edu.school} (${edu.startDate ? `${edu.startDate} - ` : ''}${edu.endDate})\n`;
    }
    text += '\n';
  }

  if ((resume.certifications ?? []).length > 0) {
    text += 'CERTIFICATIONS\n';
    for (const cert of resume.certifications) {
      text += `• ${cert.name}${cert.issuer ? ` - ${cert.issuer}` : ''}${cert.date ? ` (${cert.date})` : ''}\n`;
    }
  }

  return text;
}

function formatOllamaError(e: unknown, modelName: string, baseUrl: string): string {
  if (e instanceof Error) {
    const msg = e.message.toLowerCase();
    if (msg.includes('system memory') || msg.includes('out of memory') || msg.includes('cuda out of memory')) {
      return `Out of Memory: ${modelName} requires more RAM than currently available. Try switching to a lighter model (e.g. phi3 or tinyllama).`;
    }
    if (msg.includes('fetch failed') || msg.includes('failed to fetch') || msg.includes('econnrefused')) {
      return `Cannot connect to Ollama at ${baseUrl}. Ensure Ollama is running locally ('ollama serve').`;
    }
    return e.message;
  }
  return 'AI generation failed. Please try again.';
}

function LabContent() {
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
  const [mobileSetupOpen, setMobileSetupOpen] = useState(true);
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
  const [storyBankItems, setStoryBankItems] = useState<StoryBankItem[]>([]);

  // Automatically find relevant Story Bank accomplishments matching Job Description keywords
  const matchedStories = useMemo(() => {
    if (!jobDescription.trim() || storyBankItems.length === 0) return [];
    const jdWords = new Set(
      jobDescription.toLowerCase().match(/[a-z0-9_-]{3,}/g) || []
    );
    return storyBankItems
      .map((item) => {
        const text = `${item.title} ${item.category} ${item.content}`.toLowerCase();
        const itemWords = text.match(/[a-z0-9_-]{3,}/g) || [];
        let matches = 0;
        for (const w of itemWords) {
          if (jdWords.has(w)) matches++;
        }
        return { item, matches };
      })
      .filter((res) => res.matches > 0)
      .sort((a, b) => b.matches - a.matches)
      .map((res) => res.item);
  }, [jobDescription, storyBankItems]);

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

  const searchParams = useSearchParams();
  const queryAppId = searchParams.get('appId');
  const queryResumeId = searchParams.get('resumeId');

  // Check query params and localStorage on mount
  useEffect(() => {
    async function loadFromQueryOrStorage() {
      if (queryAppId) {
        try {
          const appRes = await fetch(`/api/applications/${queryAppId}`);
          if (appRes.ok) {
            const app = await appRes.json();
            setApplicationId(app.id);
            setCompany(app.company || '');
            setJobTitle(app.jobTitle || '');
            setJobDescription(app.jobDescription || '');
            setExtraInfo(app.extraInfo || '');
            setRecruiterName(app.recruiterName || '');
            setApplicationStatus(app.status === 'applied' ? 'applied' : 'saved');
            if (app.optimizedSummary) setOptimizedSummary(app.optimizedSummary);
            if (app.coverLetter) setCoverLetter(app.coverLetter);
            if (app.linkedinMessage) setLinkedinMessage(app.linkedinMessage);
            if (app.generationTimes) {
              try {
                setGenerationTimes(typeof app.generationTimes === 'string' ? JSON.parse(app.generationTimes) : app.generationTimes);
              } catch (e) {}
            }
            let embeddedResume: MasterResumeData | null = null;
            if (app.optimizedResume) {
              try {
                const parsed = JSON.parse(app.optimizedResume);
                if (Array.isArray(parsed)) {
                  setOptimizedBullets(parsed);
                } else if (parsed?.bullets) {
                  setOptimizedBullets(parsed.bullets);
                }
                if (parsed?.resume) {
                  embeddedResume = parsed.resume;
                }
              } catch (e) {}
            }

            // Load master resume if specified in query or in the application
            const resumeIdToFetch = queryResumeId || app.masterResumeId;
            if (resumeIdToFetch) {
              try {
                const resumeRes = await fetch(`/api/resumes/${resumeIdToFetch}`);
                if (resumeRes.ok) {
                  const resumeData = await resumeRes.json();
                  setSelectedResume(resumeData);
                } else if (embeddedResume) {
                  setSelectedResume(embeddedResume);
                }
              } catch (e) {
                if (embeddedResume) setSelectedResume(embeddedResume);
              }
            } else if (embeddedResume) {
              setSelectedResume(embeddedResume);
            }

            setIsInitialized(true);
            return;
          }
        } catch (e) {
          console.error('Failed to load application from appId query:', e);
        }
      } else if (queryResumeId) {
        try {
          const resumeRes = await fetch(`/api/resumes/${queryResumeId}`);
          if (resumeRes.ok) {
            const resumeData = await resumeRes.json();
            setSelectedResume(resumeData);
          }
        } catch (e) {
          console.error('Failed to load resume from resumeId query:', e);
        }
      }

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
    }

    loadFromQueryOrStorage();
  }, [queryAppId, queryResumeId]);

  const handleRestore = (restore: boolean) => {
    if (restore && savedData) {
      if (savedData.applicationId) setApplicationId(savedData.applicationId);
      if (savedData.selectedResume) setSelectedResume(savedData.selectedResume);
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
      selectedResume,
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
  }, [applicationId, applicationStatus, jobDescription, company, jobTitle, extraInfo, recruiterName, selectedResume, analysis, optimizedBullets, optimizedSummary, coverLetter, linkedinMessage, chatMessages, activeTab, generationTimes, isInitialized]);

  const notify = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const fetchResumes = useCallback(async () => {
    try {
      const [resumesRes, settingsRes, storyRes] = await Promise.all([
        fetch('/api/resumes'),
        fetch('/api/settings'),
        fetch('/api/story-bank'),
      ]);

      if (resumesRes.ok) {
        const data: MasterResumeData[] = await resumesRes.json();
        setResumes(data);
        if (data.length > 0) {
          setSelectedResume(prev => {
            if (prev) return prev;
            if (queryResumeId) {
              const matched = data.find((r: MasterResumeData) => r.id === queryResumeId);
              if (matched) return matched;
            }
            return data[0];
          });
        }
      }

      if (storyRes.ok) {
        const stories = await storyRes.json();
        if (Array.isArray(stories)) {
          setStoryBankItems(stories);
        }
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
  }, [queryResumeId]);

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
      setError(formatOllamaError(e, labModel || ollamaSettings.model, ollamaSettings.baseUrl));
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
          stories: matchedStories.length > 0 ? matchedStories : storyBankItems,
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
      setError(formatOllamaError(e, labModel || ollamaSettings.model, ollamaSettings.baseUrl));
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
          candidateName: selectedResume.name,
          candidateEmail: selectedResume.email,
          candidatePhone: selectedResume.phone,
          candidateLocation: selectedResume.location,
          candidateWebsite: selectedResume.website,
          candidateLinkedin: selectedResume.linkedin,
          candidateTitle: selectedResume.title,
          recruiterName,
          jobDescription,
          company: company || '',
          jobTitle: jobTitle || '',
          action: 'cover-letter',
          model: labModel || ollamaSettings.model,
          baseUrl: ollamaSettings.baseUrl,
          stories: matchedStories.length > 0 ? matchedStories : storyBankItems,
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
        const cleaned = cleanCoverLetter(fullLetter);
        setCoverLetter(cleaned);
      }
      const finalLetter = cleanCoverLetter(fullLetter);
      setCoverLetter(finalLetter);
      setGenerationTimes(prev => ({ ...prev, coverLetter: (prev.coverLetter || 0) + (Date.now() - startTime) }));

      notify('Cover Letter Ready!', 'Your Harvard-standard cover letter is complete.');
    } catch (e) {
      setError(formatOllamaError(e, labModel || ollamaSettings.model, ollamaSettings.baseUrl));
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
      setError(formatOllamaError(e, labModel || ollamaSettings.model, ollamaSettings.baseUrl));
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
          stories: matchedStories.length > 0 ? matchedStories : storyBankItems,
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
      setError(formatOllamaError(e, labModel || ollamaSettings.model, ollamaSettings.baseUrl));
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
          optimizedResume: JSON.stringify({ version: 2, bullets: optimizedBullets, resume: selectedResume }),
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
  const resumeOptions = resumes.length > 0
    ? resumes.map((resume) => ({
        value: resume.id || '',
        label: resume.name || 'Untitled resume',
        description: resume.title || 'Master resume',
        group: 'Master resumes',
        icon: <FileText size={14} />,
      }))
    : [{ value: '__no-resume__', label: 'No master resume available', description: 'Create a resume in Master Resume.', group: 'Master resumes', icon: <FileText size={14} /> }];
  const modelOptions = availableModels.length > 0
    ? availableModels.map((model) => ({ value: model.name, label: model.name, description: 'Available on this device', group: 'Installed models', icon: <Sparkles size={14} /> }))
    : [{
        value: fetchingModels ? '__loading-models__' : '__no-models__',
        label: fetchingModels ? 'Checking available models' : 'No models installed',
        description: fetchingModels ? 'Reading your local model list.' : 'Configure a model in Settings to continue.',
        group: 'Model status',
        icon: <Sparkles size={14} />,
      }];
  const selectedModel = availableModels.some((model) => model.name === (labModel || ollamaSettings.model))
    ? (labModel || ollamaSettings.model)
    : modelOptions[0]?.value || '';

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
      <AppTopbar />
      <main className={`main-content lab-main-content ${mobileSetupOpen ? '' : 'mobile-setup-collapsed'}`}>
        <div className="page-header lab-page-header">
          <div>
            <h1 className="page-title lab-page-title">
              <FlaskConical size={20} aria-hidden="true" /> The Lab
            </h1>
            <p className="page-subtitle">Tailor your materials to the role.</p>
          </div>
          <div className="lab-header-actions">
            <span className="lab-header-actions-label">GENERATE MATERIALS</span>
            <div className="lab-action-grid" aria-label="Application generation actions">
              <button className="btn lab-action-button lab-action-analyze" onClick={handleAnalyze} disabled={isProcessing}>
                <span className="lab-action-icon">{analyzing ? <div className="spinner" /> : <Zap size={18} />}</span>
                <span className="lab-action-copy"><strong>{analyzing ? 'Analyzing…' : 'Analyze gap'}</strong><small>Check role alignment</small></span>
              </button>
              <button className="btn lab-action-button lab-action-optimize" onClick={handleOptimize} disabled={isProcessing}>
                <span className="lab-action-icon">{optimizing ? <div className="spinner" /> : <Sparkles size={18} />}</span>
                <span className="lab-action-copy"><strong>{optimizing ? 'Optimizing…' : 'Optimize resume'}</strong><small>Tailor to this role</small></span>
              </button>
              <button className="btn lab-action-button lab-action-secondary" onClick={handleCoverLetter} disabled={isProcessing}>
                <span className="lab-action-icon"><FileText size={18} /></span>
                <span className="lab-action-copy"><strong>Cover letter</strong><small>Draft a tailored letter</small></span>
              </button>
              <button className="btn lab-action-button lab-action-secondary" onClick={handleLinkedinMessage} disabled={isProcessing}>
                <span className="lab-action-icon"><Send size={18} /></span>
                <span className="lab-action-copy"><strong>Outreach message</strong><small>Start a conversation</small></span>
              </button>
            </div>
            <button type="button" className="lab-mobile-setup-toggle" aria-expanded={mobileSetupOpen} aria-controls="lab-setup-controls" onClick={() => setMobileSetupOpen((open) => !open)}>
              {mobileSetupOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              {mobileSetupOpen ? 'Hide position setup' : 'Show position setup'}
            </button>
          </div>
        </div>

        <div className="lab-workstation">
          {/* Left Column: Control Panel */}
          <div id="lab-setup-controls" className={`control-panel ${mobileSetupOpen ? '' : 'mobile-setup-collapsed'}`}>
            {/* Context Card */}
            <div className="workspace-card lab-card">
              <div>
                <label className="premium-label lab-section-label">
                  <Zap size={14} /> AI Intelligence & Target
                </label>
                <div className="lab-field-stack">
                  <SelectField
                    label="Master resume"
                    options={resumeOptions}
                    value={selectedResume?.id || (resumes.length === 0 ? '__no-resume__' : '')}
                    placeholder="Choose a master resume"
                    disabled={resumes.length === 0}
                    onChange={(id) => {
                      const resume = resumes.find((item) => item.id === id);
                      if (resume) setSelectedResume(resume);
                    }}
                    name="lab-master-resume"
                  />

                  <div className="lab-model-select-wrap">
                    <SelectField
                      label="AI model"
                      options={modelOptions}
                      value={selectedModel}
                      placeholder="Choose a model"
                      disabled={availableModels.length === 0}
                      onChange={setLabModel}
                      leadingIcon={<Sparkles size={14} />}
                      name="lab-ai-model"
                    />
                    <div className="lab-model-meta">
                      <span>Default: {ollamaSettings.model}</span>
                      <a href="/settings">Configure model</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details Card */}
            <div className="workspace-card lab-card">
              <div>
                <label className="premium-label lab-section-label">
                  <FileText size={14} /> Position Details
                </label>
                
                <div className="lab-field-stack">
                  <div className="lab-field-grid">
                    <TextField label="Company" placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} name="lab-company" />
                    <TextField label="Role title" placeholder="e.g. Product Designer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} name="lab-job-title" />
                  </div>

                  <div className="lab-field-grid">
                    <TextField label="Recruiter (optional)" placeholder="Recruiter name" value={recruiterName} onChange={(e) => setRecruiterName(e.target.value)} name="lab-recruiter" />
                    <TextField label="Extra context" placeholder="Values, priorities, or notes" value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} name="lab-extra-context" />
                  </div>

                  <div className="premium-input-group lab-description-group">
                    <label className="lab-description-label" htmlFor="lab-job-description">Job description</label>
                    <textarea
                      id="lab-job-description"
                      className="premium-textarea lab-job-description"
                      placeholder="Paste the position requirements and responsibilities here..."
                      value={jobDescription}
                      aria-label="Job description"
                      onChange={(e) => setJobDescription(e.target.value)}
                    />
                    <div className="lab-character-count">
                      <span>
                        {jobDescription.length.toLocaleString()} characters
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Story Bank Intelligence Card */}
            {storyBankItems.length > 0 && (
              <div className="workspace-card lab-card" style={{ marginTop: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="premium-label lab-section-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BookOpen size={14} style={{ color: 'var(--accent-primary)' }} /> Story Bank Integration
                    </label>
                    <span className={`badge ${matchedStories.length > 0 ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: 10 }}>
                      {matchedStories.length > 0 ? `${matchedStories.length} matched` : `${storyBankItems.length} active`}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    {matchedStories.length > 0
                      ? 'STAR accomplishments matching this role will enrich your Cover Letter and AI Chat.'
                      : 'Saved accomplishments are ready to enrich your Cover Letter and AI Q&A responses.'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {(matchedStories.length > 0 ? matchedStories : storyBankItems).slice(0, 3).map((s) => (
                      <span
                        key={s.id}
                        style={{
                          fontSize: 11,
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-secondary)',
                          color: 'var(--text-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          maxWidth: '100%',
                        }}
                      >
                        <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--accent-primary)', fontWeight: 700 }}>
                          {s.category}
                        </span>
                        <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.title}
                        </span>
                      </span>
                    ))}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <a href="/story-bank" style={{ fontSize: 11, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
                      Open Story Bank ({storyBankItems.length}) →
                    </a>
                  </div>
                </div>
              </div>
            )}

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
          <div className="display-panel lab-results-panel">
            <div className="display-panel-header lab-results-header">
              <Tabs
                items={[
                  { id: 'analysis', label: 'Gap Analysis' },
                  { id: 'optimize', label: 'Tailored Resume' },
                  { id: 'cover', label: 'Cover Letter' },
                  { id: 'linkedin', label: 'Outreach' },
                  { id: 'chat', label: 'AI Q&A' },
                ]}
                value={activeTab}
                onChange={(tab) => setActiveTab(tab as typeof activeTab)}
                label="Generated results"
                idPrefix="lab-results"
                className="lab-results-tabs"
              />
            </div>

            <div className="display-panel-body" id={`panel-lab-results-${activeTab}`} role="tabpanel" aria-labelledby={`tab-lab-results-${activeTab}`} style={{ background: activeTab === 'optimize' || activeTab === 'cover' ? 'var(--bg-primary)' : 'transparent' }}>
              {activeTab === 'analysis' && <AnalysisView analysis={analysis} loading={analyzing} scoreColor={scoreColor} />}
              {activeTab === 'optimize' && (
                <OptimizeView
                  bullets={optimizedBullets}
                  onUpdateBullets={setOptimizedBullets}
                  summary={optimizedSummary}
                  onUpdateSummary={setOptimizedSummary}
                  onUpdateResume={setSelectedResume}
                  loading={optimizing}
                  resume={selectedResume}
                />
              )}
              {activeTab === 'cover' && (
                <CoverLetterView
                  letter={coverLetter}
                  onUpdateLetter={setCoverLetter}
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

            {((analysis || optimizedBullets.length > 0 || coverLetter) || Object.keys(generationTimes).length > 0) && (
              <div className="lab-results-actions">
                <div className="lab-execution-summary">
                  <div className="lab-ai-time">
                    {Object.keys(generationTimes).length > 0 ? <>
                      Total AI time <strong>{(Object.values(generationTimes).reduce((a, b) => a + b, 0) / 1000).toFixed(1)}s</strong>
                    </> : <><span className="status-dot connected" /> Generation complete</>}
                  </div>
                  {(analysis || optimizedBullets.length > 0 || coverLetter) && (
                    <div className="lab-commit-actions">
                      <button className="btn btn-ghost btn-sm" title={applicationStatus === 'applied' ? 'This application is already marked as applied.' : undefined} onClick={() => handleSaveApplication('saved')} disabled={saving || applicationStatus === 'applied'}>
                        <Save size={14} /> {saving && applicationStatus === 'saved' ? 'Saving…' : 'Save Draft'}
                      </button>
                      <button className="btn btn-primary btn-sm" title={applicationStatus === 'applied' ? 'Application marked as applied.' : undefined} onClick={() => handleSaveApplication('applied')} disabled={saving || applicationStatus === 'applied'}>
                        <CheckCircle2 size={14} /> {saving ? 'Finishing…' : applicationStatus === 'applied' ? 'Finished' : 'Finish'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {error && (
          <div className="lab-error-toast" role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, lineHeight: 1.4 }}>{error}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {error.toLowerCase().includes('memory') && availableModels.some(m => ['phi3', 'tinyllama', 'llama3.2:1b', 'qwen2.5:1.5b'].some(s => m.name.toLowerCase().includes(s))) && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: 11, padding: '4px 10px' }}
                  onClick={() => {
                    const smaller = availableModels.find(m => ['phi3', 'tinyllama', 'llama3.2:1b', 'qwen2.5:1.5b'].some(s => m.name.toLowerCase().includes(s)));
                    if (smaller) {
                      setLabModel(smaller.name);
                      setError('');
                    }
                  }}
                >
                  Switch to lighter model
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setError('')}
                style={{ width: 24, height: 24, padding: 0 }}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
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

function normalizeForMatching(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .replace(/[“”"']/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchOptimizedBullet(bullet: string, optimizedList: OptimizedBullet[]): { text: string; isOptimized: boolean; relevance?: string; item?: OptimizedBullet } {
  if (!optimizedList || optimizedList.length === 0) return { text: bullet.trim(), isOptimized: false };
  const trimmed = bullet.trim();

  // 1. Direct trimmed match
  const direct = optimizedList.find(ob => ob.original.trim() === trimmed);
  if (direct) return { text: direct.optimized.trim(), isOptimized: true, relevance: direct.relevance, item: direct };

  // 2. Full normalized match
  const norm = normalizeForMatching(bullet);
  if (!norm) return { text: trimmed, isOptimized: false };

  const fullNorm = optimizedList.find(ob => normalizeForMatching(ob.original) === norm);
  if (fullNorm) return { text: fullNorm.optimized.trim(), isOptimized: true, relevance: fullNorm.relevance, item: fullNorm };

  // 3. Prefix/substring match
  const prefix = norm.slice(0, 35);
  if (prefix.length >= 18) {
    const partial = optimizedList.find(ob => {
      const obNorm = normalizeForMatching(ob.original);
      return obNorm.includes(prefix) || norm.includes(obNorm.slice(0, 35));
    });
    if (partial) return { text: partial.optimized.trim(), isOptimized: true, relevance: partial.relevance, item: partial };
  }

  return { text: trimmed, isOptimized: false };
}

function BulletDot({ color = '#000000', size = 4.5, top = 6.5 }: { color?: string; size?: number; top?: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: '50%',
        backgroundColor: color,
        marginTop: `${top}px`,
        marginRight: '9px',
        flexShrink: 0,
      }}
    />
  );
}

function cloneResume(resume: MasterResumeData): MasterResumeData {
  return {
    ...resume,
    skills: [...(resume.skills || [])],
    skillGroups: (resume.skillGroups || []).map((group) => ({ ...group, skills: [...group.skills] })),
    experience: (resume.experience || []).map((item) => ({ ...item, bullets: [...item.bullets] })),
    projects: (resume.projects || []).map((item) => ({ ...item })),
    education: (resume.education || []).map((item) => ({ ...item })),
    certifications: (resume.certifications || []).map((item) => ({ ...item })),
  };
}

function EditableText({ editing, value, onCommit, as = 'span', className = '' }: { editing: boolean; value?: string | null; onCommit: (value: string) => void; as?: ElementType; className?: string }) {
  const Tag = as;
  return <Tag
    className={`resume-editable-text ${className}`.trim()}
    contentEditable={editing}
    suppressContentEditableWarning
    role={editing ? 'textbox' : undefined}
    aria-multiline={editing ? true : undefined}
    data-placeholder={editing && !value ? 'Type here' : undefined}
    onBlur={editing ? (event: React.FocusEvent<HTMLElement>) => onCommit(event.currentTarget.innerText.replace(/\u00a0/g, ' ')) : undefined}
  >{value || ''}</Tag>;
}

function OptimizeView({ bullets, onUpdateBullets, summary, onUpdateSummary, onUpdateResume, loading, resume }: { bullets: OptimizedBullet[]; onUpdateBullets: (value: OptimizedBullet[]) => void; summary?: string; onUpdateSummary?: (val: string) => void; onUpdateResume: (value: MasterResumeData) => void; loading: boolean; resume?: MasterResumeData | null }) {
  const [viewMode, setViewMode] = useState<'preview' | 'diff'>('preview');
  const [isEditingOutput, setIsEditingOutput] = useState(false);
  const [editSummaryText, setEditSummaryText] = useState(summary || '');
  const [editBullets, setEditBullets] = useState<OptimizedBullet[]>(bullets);
  const [editResume, setEditResume] = useState<MasterResumeData | null>(resume || null);

  useEffect(() => {
    setEditSummaryText(summary || '');
    setEditBullets(bullets);
    setEditResume(resume ? cloneResume(resume) : null);
  }, [summary, bullets, resume]);

  if (loading) return <div className="loading-overlay" style={{ height: '100%' }}><div className="spinner" /><span>Optimizing resume content for ATS...</span></div>;
  if (bullets.length === 0 && !summary) return <div className="empty-state" style={{ height: '100%' }}><div className="empty-state-icon"><Sparkles size={28} /></div><p className="empty-state-title">No optimization data</p><p className="empty-state-text">Click &quot;Optimize&quot; to generate ATS-tailored resume content.</p></div>;

  if (!resume) return <div className="empty-state"><p>Please select a Master Resume to preview.</p></div>;

  const displaySummary = (isEditingOutput ? editSummaryText : summary || resume.summary || '').trim();
  const beginEditing = () => {
    setEditSummaryText(summary || resume.summary || '');
    setEditBullets(bullets.map((item) => ({ ...item })));
    setEditResume(cloneResume(resume));
    setIsEditingOutput(true);
  };
  const saveEdits = () => {
    onUpdateSummary?.(editSummaryText);
    onUpdateBullets(editBullets);
    if (editResume) onUpdateResume(editResume);
    setIsEditingOutput(false);
  };
  const updateBullet = (index: number, value: string) => {
    setEditBullets((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, optimized: value } : item));
  };
  const outputResume = isEditingOutput && editResume ? editResume : resume;
  const updateResumeField = <K extends keyof MasterResumeData>(field: K, value: MasterResumeData[K]) => {
    setEditResume((current) => current ? { ...current, [field]: value } : current);
  };
  const updateExperienceField = (index: number, field: string, value: string) => setEditResume((current) => current ? ({ ...current, experience: current.experience.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }) : current);
  const updateExperienceBullet = (experienceIndex: number, bulletIndex: number, value: string) => setEditResume((current) => current ? ({ ...current, experience: current.experience.map((item, itemIndex) => itemIndex === experienceIndex ? { ...item, bullets: item.bullets.map((bullet, index) => index === bulletIndex ? value : bullet) } : item) }) : current);
  const updateEducationField = (index: number, field: string, value: string) => setEditResume((current) => current ? ({ ...current, education: current.education.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }) : current);
  const updateProjectField = (index: number, field: string, value: string) => setEditResume((current) => current ? ({ ...current, projects: current.projects.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }) : current);
  const updateCertificationField = (index: number, field: string, value: string) => setEditResume((current) => current ? ({ ...current, certifications: current.certifications.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }) : current);

  // Format link helper
  const formatUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  };

  const getLinkLabel = (url: string, defaultLabel: string) => {
    if (!url) return defaultLabel.toUpperCase();
    const clean = url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    if (clean.includes('linkedin.com')) return 'LINKEDIN';
    if (clean.includes('twitter.com') || clean.includes('x.com')) return 'X';
    if (clean.includes('github.com')) return 'GITHUB';
    return defaultLabel.toUpperCase();
  };

  // Build contact items array
  const contactParts: { text: string; field: 'location' | 'phone' | 'email'; isEmail?: boolean }[] = [];
  if (outputResume.location || isEditingOutput) contactParts.push({ text: outputResume.location, field: 'location' });
  if (outputResume.phone || isEditingOutput) contactParts.push({ text: outputResume.phone, field: 'phone' });
  if (outputResume.email || isEditingOutput) contactParts.push({ text: outputResume.email, field: 'email', isEmail: true });

  // Build link items array
  const linkParts: { url: string; label: string; field: 'linkedin' | 'twitter' | 'website' }[] = [];
  if (outputResume.linkedin || isEditingOutput) linkParts.push({ url: outputResume.linkedin, label: getLinkLabel(outputResume.linkedin, 'LinkedIn'), field: 'linkedin' });
  if (outputResume.twitter || isEditingOutput) linkParts.push({ url: outputResume.twitter, label: getLinkLabel(outputResume.twitter, 'X'), field: 'twitter' });
  if (outputResume.website || isEditingOutput) linkParts.push({ url: outputResume.website, label: getLinkLabel(outputResume.website, 'Portfolio Website'), field: 'website' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Action & View Switcher Bar */}
      <div className="resume-preview-toolbar">
        <div className="resume-preview-context">
          <span className="resume-preview-kicker">DOCUMENT PREVIEW</span>
          <strong>Tailored resume</strong>
        </div>

        <div className="resume-view-switcher" aria-label="Resume view">
          <button
            type="button"
            className={`resume-view-button ${viewMode === 'preview' ? 'active' : ''}`}
            aria-pressed={viewMode === 'preview'}
            onClick={() => setViewMode('preview')}
          >
            <FileText size={15} /> Full Resume Document
          </button>
          <button
            type="button"
            className={`resume-view-button ${viewMode === 'diff' ? 'active' : ''}`}
            aria-pressed={viewMode === 'diff'}
            onClick={() => setViewMode('diff')}
          >
            <Sparkles size={15} /> Optimization Diff <span className="resume-diff-count">{bullets.length}</span>
          </button>
        </div>

        <div className="resume-preview-actions">
          <span className="resume-ats-status">
            <span className="status-dot connected" /> ATS aligned
          </span>
          {isEditingOutput ? <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsEditingOutput(false)}><X size={14} /> Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveEdits}><Check size={14} /> Save edits</button>
          </> : <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={beginEditing}><Pencil size={14} /> Edit output</button>
            <PDFDownloadButton resume={resume} optimizedBullets={bullets} optimizedSummary={summary || ''} />
          </>}
        </div>
      </div>

      {viewMode === 'diff' ? (
        /* Diff Breakdown View */
        <div className="document-paper resume-diff-paper" style={{ fontFamily: 'inherit', color: 'inherit', background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
          {(isEditingOutput ? editSummaryText : summary) && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border-primary)', paddingBottom: 6 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', margin: 0 }}>
                  Tailored Professional Summary
                </h3>
                <span className="badge badge-success" style={{ fontSize: 10 }}>ATS Optimized</span>
              </div>
              {isEditingOutput ? <EditableText editing value={editSummaryText} onCommit={setEditSummaryText} as="div" className="resume-editable-text-block" /> :
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', background: 'var(--bg-card)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>{summary}</p>}
            </div>
          )}

              <div className="resume-diff-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border-primary)', paddingBottom: 6 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-green)', margin: 0 }}>
              Tailored Experience Bullets ({bullets.length})
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Google XYZ & STAR Impact Format</span>
          </div>

          <div className="resume-diff-bullet-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(isEditingOutput ? editBullets : bullets).map((b, i) => (
              <div key={i} className="resume-diff-bullet-card" style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8, fontStyle: 'italic', textDecoration: 'line-through', opacity: 0.7 }}>
                  {b.original}
                </div>
                {isEditingOutput ? <EditableText editing value={b.optimized} onCommit={(value) => updateBullet(i, value)} as="div" className="resume-editable-text-block" /> :
                  <div className="resume-diff-optimized-copy" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start' }}><BulletDot color="var(--accent-green)" size={4.5} top={6.5} /><span>{b.optimized}</span></div>}
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                  <span className={`badge ${b.relevance === 'high' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                    {b.relevance ? `${b.relevance.toUpperCase()} ATS RELEVANCE` : 'ATS OPTIMIZED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Full Resume Document View (Exact match to sample PDF) */
        <div className="document-paper resume-preview-paper">
          {/* Header */}
          <div style={{ marginBottom: 16 }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#000000', margin: '0 0 4px 0', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
              <EditableText editing={isEditingOutput} value={outputResume.name} onCommit={(value) => updateResumeField('name', value)} as="span" />
            </h1>
            {(outputResume.title || isEditingOutput) && (
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#111111', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
                <EditableText editing={isEditingOutput} value={outputResume.title} onCommit={(value) => updateResumeField('title', value)} />
              </div>
            )}

            {/* Contact Row 1 */}
            {contactParts.length > 0 && (
              <div style={{ fontSize: '12.5px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                {contactParts.map((item, idx) => (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {idx > 0 && <span style={{ fontWeight: 800, margin: '0 6px', color: '#000000' }}>|</span>}
                    {isEditingOutput ? <EditableText editing value={item.text} onCommit={(value) => updateResumeField(item.field, value)} /> : item.isEmail ? (
                      <a href={`mailto:${item.text}`} style={{ color: '#0056B3', textDecoration: 'underline', fontWeight: 700 }}>
                        {item.text}
                      </a>
                    ) : (
                      <strong style={{ color: '#000000' }}>{item.text}</strong>
                    )}
                  </span>
                ))}
              </div>
            )}

            {/* Links Row 2 */}
            {linkParts.length > 0 && (
              <div style={{ fontSize: '12.5px', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                {linkParts.map((item, idx) => (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {idx > 0 && <span style={{ fontWeight: 800, margin: '0 6px', color: '#000000' }}>|</span>}
                    {isEditingOutput ? <EditableText editing value={item.url} onCommit={(value) => updateResumeField(item.field, value)} /> : <a href={formatUrl(item.url)} target="_blank" rel="noopener noreferrer" style={{ color: '#0056B3', textDecoration: 'underline' }}>{item.label}</a>}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Professional Summary */}
          {(displaySummary || isEditingOutput) && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#000000' }}>
                  Professional Summary
                </div>
              </div>
              <div style={{ borderBottom: '2px solid #000000', marginBottom: 8 }} />
              {isEditingOutput ? <EditableText editing value={editSummaryText} onCommit={setEditSummaryText} as="div" className="resume-editable-block" /> : (
                <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.45, color: '#111111', textAlign: 'left' }}>
                  {displaySummary}
                </p>
              )}
            </div>
          )}

          {/* Skills */}
          {((outputResume.skillGroups ?? []).length > 0 || (outputResume.skills ?? []).length > 0 || isEditingOutput) && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#000000', marginBottom: 3 }}>
                Skills
              </div>
              <div style={{ borderBottom: '2px solid #000000', marginBottom: 8 }} />
              {(outputResume.skillGroups ?? []).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {(outputResume.skillGroups ?? []).map((group, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', paddingLeft: 6, fontSize: '12.5px', lineHeight: 1.4 }}>
                      <BulletDot size={4.5} top={6.5} />
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: '#000000' }}><EditableText editing={isEditingOutput} value={group.category} onCommit={(value) => setEditResume((current) => current ? ({ ...current, skillGroups: current.skillGroups.map((item, itemIndex) => itemIndex === i ? { ...item, category: value } : item) }) : current)} />:</strong>{' '}
                        <span style={{ color: '#111111' }}><EditableText editing={isEditingOutput} value={group.skills.join(', ')} onCommit={(value) => setEditResume((current) => current ? ({ ...current, skillGroups: current.skillGroups.map((item, itemIndex) => itemIndex === i ? { ...item, skills: value.split(',').map((skill) => skill.trim()).filter(Boolean) } : item) }) : current)} /></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', paddingLeft: 6, fontSize: '12.5px', lineHeight: 1.4 }}>
                  <BulletDot size={4.5} top={6.5} />
                  <span style={{ flex: 1 }}><EditableText editing={isEditingOutput} value={(outputResume.skills ?? []).join(', ')} onCommit={(value) => updateResumeField('skills', value.split(',').map((skill) => skill.trim()).filter(Boolean))} /></span>
                </div>
              )}
            </div>
          )}

          {/* Professional Experience */}
          {(outputResume.experience ?? []).length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#000000', marginBottom: 3 }}>
                Professional Experience
              </div>
              <div style={{ borderBottom: '2px solid #000000', marginBottom: 10 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {outputResume.experience.map((exp, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#000000', marginBottom: 2 }}>
                      <EditableText editing={isEditingOutput} value={exp.title} onCommit={(value) => updateExperienceField(i, 'title', value)} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '12.5px', marginBottom: 6 }}>
                      <span style={{ fontStyle: 'italic', color: '#333333' }}>
                        <EditableText editing={isEditingOutput} value={exp.company} onCommit={(value) => updateExperienceField(i, 'company', value)} />{(exp.location || isEditingOutput) && <> - <EditableText editing={isEditingOutput} value={exp.location} onCommit={(value) => updateExperienceField(i, 'location', value)} /></>}
                      </span>
                      <strong style={{ color: '#000000' }}>
                        <EditableText editing={isEditingOutput} value={exp.startDate} onCommit={(value) => updateExperienceField(i, 'startDate', value)} />{(exp.endDate || isEditingOutput) && <> – <EditableText editing={isEditingOutput} value={exp.endDate} onCommit={(value) => updateExperienceField(i, 'endDate', value)} /></>}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {(exp.bullets || []).map((bullet, j) => {
                        const matched = matchOptimizedBullet(bullet, isEditingOutput ? editBullets : bullets);
                        const matchedIndex = matched.item ? (isEditingOutput ? editBullets : bullets).findIndex((item) => item.original === matched.item?.original) : -1;
                        return (
                          <div key={j} style={{ display: 'flex', alignItems: 'flex-start', paddingLeft: 6, fontSize: '12.5px', lineHeight: 1.45, color: '#111111' }}>
                            <BulletDot size={4.5} top={7} />
                            {isEditingOutput && matchedIndex >= 0 ? <EditableText editing value={editBullets[matchedIndex].optimized} onCommit={(value) => updateBullet(matchedIndex, value)} as="div" className="resume-editable-text-block" /> : isEditingOutput ? <EditableText editing value={matched.text} onCommit={(value) => updateExperienceBullet(i, j, value)} as="div" className="resume-editable-text-block" /> :
                              <span style={{ flex: 1, ...(matched.isOptimized ? { background: 'rgba(34, 197, 94, 0.08)', borderRadius: 2, padding: '1px 3px' } : {}) }}>{matched.text}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {(outputResume.projects ?? []).length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#000000', marginBottom: 3 }}>
                Projects
              </div>
              <div style={{ borderBottom: '2px solid #000000', marginBottom: 8 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(outputResume.projects ?? []).map((proj, i) => {
                  const cleanUrl = proj.url ? proj.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
                  const nameHasUrl = cleanUrl && proj.name.toLowerCase().includes(cleanUrl.toLowerCase());
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', paddingLeft: 6, fontSize: '12.5px', lineHeight: 1.45 }}>
                      <BulletDot size={4.5} top={7} />
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: '#000000' }}><EditableText editing={isEditingOutput} value={proj.name} onCommit={(value) => updateProjectField(i, 'name', value)} /></strong>
                        {(proj.url || isEditingOutput) && (isEditingOutput || !nameHasUrl) && (
                          <span>{' '}({isEditingOutput ? <EditableText editing value={proj.url} onCommit={(value) => updateProjectField(i, 'url', value)} /> : <a href={formatUrl(proj.url || '')} target="_blank" rel="noopener noreferrer" style={{ color: '#0056B3', textDecoration: 'underline' }}>{cleanUrl}</a>})</span>
                        )}
                        <span style={{ color: '#111111' }}>: <EditableText editing={isEditingOutput} value={proj.description} onCommit={(value) => updateProjectField(i, 'description', value)} /></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Education */}
          {(outputResume.education ?? []).length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#000000', marginBottom: 3 }}>
                Education
              </div>
              <div style={{ borderBottom: '2px solid #000000', marginBottom: 8 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {outputResume.education.map((edu, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '13.5px', marginBottom: 2 }}>
                      <strong style={{ color: '#000000' }}><EditableText editing={isEditingOutput} value={edu.degree} onCommit={(value) => updateEducationField(i, 'degree', value)} />{(edu.field || isEditingOutput) && <> in <EditableText editing={isEditingOutput} value={edu.field} onCommit={(value) => updateEducationField(i, 'field', value)} /></>}</strong>
                      <strong style={{ color: '#000000', fontSize: '12.5px' }}>
                        <EditableText editing={isEditingOutput} value={`${edu.startDate || ''}${edu.startDate && edu.endDate ? ' – ' : ''}${edu.endDate || ''}`} onCommit={(value) => { const [startDate = '', endDate = ''] = value.split(/\s+[–-]\s+/, 2); updateEducationField(i, 'startDate', startDate); updateEducationField(i, 'endDate', endDate); }} />
                      </strong>
                    </div>
                    <div style={{ fontStyle: 'italic', color: '#333333', fontSize: '12.5px' }}>
                      <EditableText editing={isEditingOutput} value={edu.school} onCommit={(value) => updateEducationField(i, 'school', value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {(outputResume.certifications ?? []).length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#000000', marginBottom: 3 }}>
                Certifications
              </div>
              <div style={{ borderBottom: '2px solid #000000', marginBottom: 8 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(outputResume.certifications ?? []).map((cert, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', paddingLeft: 6, fontSize: '12.5px', lineHeight: 1.4 }}>
                    <BulletDot size={4.5} top={6.5} />
                    <span style={{ flex: 1, color: '#111111' }}>
                      <EditableText editing={isEditingOutput} value={cert.name} onCommit={(value) => updateCertificationField(i, 'name', value)} />{(cert.issuer || isEditingOutput) && <> - <EditableText editing={isEditingOutput} value={cert.issuer} onCommit={(value) => updateCertificationField(i, 'issuer', value)} /></>}{(cert.date || isEditingOutput) && <> (<EditableText editing={isEditingOutput} value={cert.date} onCommit={(value) => updateCertificationField(i, 'date', value)} />)</>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CoverLetterView({ letter, onUpdateLetter, loading, onRegenerate }: { letter: string; onUpdateLetter: (value: string) => void; loading: boolean; onRegenerate: () => void }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftLetter, setDraftLetter] = useState(letter);

  useEffect(() => setDraftLetter(letter), [letter]);

  if (loading) return <div className="loading-overlay" style={{ height: '100%' }}><div className="spinner" /><span>Crafting your Harvard-standard cover letter...</span></div>;
  if (!letter) return <div className="empty-state" style={{ height: '100%' }}><div className="empty-state-icon"><FileText size={28} /></div><p className="empty-state-title">No cover letter yet</p><p className="empty-state-text">Click &quot;Cover Letter&quot; to generate an executive tailored letter.</p></div>;

  const displayLetter = cleanCoverLetter(letter);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await registerInterFont();
      const blob = await pdf(<CoverLetterPDF text={displayLetter} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cover_letter.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="paper-actions cover-letter-actions" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
        <span className="cover-letter-toolbar-label">Cover letter</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {isEditing ? <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setDraftLetter(letter); setIsEditing(false); }}><X size={14} /> Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => { onUpdateLetter(draftLetter); setIsEditing(false); }}><Check size={14} /> Save edits</button>
          </> : <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setDraftLetter(displayLetter); setIsEditing(true); }} style={{ fontSize: 12 }}><Pencil size={14} /> Edit letter</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopy} style={{ fontSize: 12 }}>
              {copied ? <><Check size={14} style={{ color: 'var(--accent-green)' }} /> Copied!</> : <><Copy size={14} /> Copy Letter</>}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onRegenerate} style={{ fontSize: 12 }}><RotateCcw size={14} /> Regenerate</button>
            <button type="button" className="btn btn-primary btn-sm" style={{ fontSize: 12 }} onClick={handleDownloadPDF} disabled={downloading}>
              {downloading ? <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Exporting...</> : <><Download size={14} /> Download PDF</>}
            </button>
          </>}
        </div>
      </div>
      <div
        className="document-paper"
        style={{
          background: '#ffffff',
          color: '#1a1a1a',
          padding: '48px 56px',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: '14px',
          lineHeight: '1.75',
          boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          letterSpacing: '0.05px',
        }}
      >
        {isEditing ? <div
          aria-label="Edit generated cover letter"
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          className="cover-letter-editor"
          onInput={(event) => setDraftLetter(event.currentTarget.innerText.replace(/\u00a0/g, ' '))}
        >{displayLetter}</div> : displayLetter}
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

export default function LabPage() {
  return (
    <Suspense
      fallback={
        <div className="app-layout">
          <Sidebar />
          <AppTopbar />
          <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ width: 20, height: 20 }} />
              <span>Loading Lab...</span>
            </div>
          </main>
        </div>
      }
    >
      <LabContent />
    </Suspense>
  );
}

