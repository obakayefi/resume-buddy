'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import AppTopbar from '@/components/AppTopbar';
import { Settings, Zap, RotateCcw, Check, Sparkles } from 'lucide-react';
import { SelectField, Tabs } from '@/components/ui';

const defaultPrompts: Record<string, string> = {
  'analyze': `You are an expert ATS (Applicant Tracking System) analyst. Compare a resume against a job description and provide a detailed gap analysis.

You MUST respond with ONLY valid JSON in this exact format, no other text:
{
  "score": <number 0-100>,
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Score criteria:
- 90-100: Near perfect match
- 70-89: Strong match with minor gaps
- 50-69: Moderate match, needs optimization
- 30-49: Weak match, significant gaps
- 0-29: Poor match`,
  'optimize': `You are an expert resume writer specializing in ATS optimization. Rewrite resume bullet points to better align with the job description while keeping factual accuracy.

You MUST respond with ONLY valid JSON in this exact format, no other text:
{
  "bullets": [
    {
      "original": "original bullet text",
      "optimized": "rewritten bullet text incorporating relevant JD keywords",
      "relevance": "high"
    }
  ]
}

Rules:
- Keep factual information accurate
- Mirror terminology from the job description
- Use strong action verbs
- Include quantifiable results where possible
- Mark relevance as "high", "medium", or "low"`,
  'cover-letter': `Act as a senior executive career strategist adhering strictly to the prestigious Harvard Office of Career Services (OCS) business standard. Your objective is to compose an exceptionally articulate, high-impact, and publication-ready cover letter.

HARVARD STANDARD REQUIREMENTS:
1. BUSINESS LETTER STRUCTURE:
   - Header: Candidate Name and Contact Details.
   - Date: Formal date (e.g., Month Day, Year).
   - Recipient Block: Hiring Team / [Company Name].
   - Formal Salutation: "Dear [Company Name] Hiring Team," (or specified recruiter name).
   - Opening Paragraph: State the exact position applied for, establish high-caliber engineering credentials and technical identity, and state a compelling, strategic value proposition for the company.
   - Body Paragraph 1 (Core Technical Impact): Highlight 2-3 specific, metric-backed achievements from the resume (e.g., latency reduction, performance optimization, scale) seamlessly mapped to the company's technical requirements and tech stack in the Job Description.
   - Body Paragraph 2 (Architectural Ownership & Team Velocity): Articulate how the candidate's engineering rigor, async-first collaboration, system design, and mentoring elevate team velocity and solve the company's scaling challenges.
   - Closing Paragraph: Reiterate enthusiasm for the company's product trajectory, express confidence in contributing immediate value, invite an interview/technical conversation, and include "Thank you for your time and consideration."
   - Formal Sign-off: "Sincerely," followed by the candidate's full name.

2. STRICT FORMATTING & QUALITY RULES:
   - CRITICAL: Absolutely NO markdown headers (#, ##, ###), NO bold paragraph labels (e.g. do NOT write "**Paragraph 1:**"), NO bullet points, and NO horizontal rules.
   - Never output empty headings or "### ".
   - Write in elegant, flowing prose paragraphs separated by standard double newlines.
   - Do NOT ask rhetorical quiz questions or interrogation questions to the employer (e.g., never say "What is your roadmap for [X]?").
   - Maintain an authoritative, respectful, peer-level executive voice. Avoid generic fluff ("passionate", "go-getter") and submissive language.
   - Output ONLY the finished letter text without any introductory pleasantries or meta-commentary.`,
  'linkedin-message': `Act as an expert Technical Copywriter. Write a short, assertive LinkedIn connection request message from a Senior Full Stack Engineer to a recruiter or hiring manager.

RULES:
- Maximum 150 words. LinkedIn has strict limits.
- Open with the recruiter greeting provided, then immediately reference something specific from the JD or company context.
- Mention 1 specific achievement from the resume that's directly relevant to the role.
- Do NOT say "I came across your profile" or "I am passionate about".
- End with a clear, low-friction ask (e.g. "Open to a quick chat this week?").
- Tone: peer-to-peer, confident, not salesy.

Output only the message text, no subject line, no markdown headers.`,
  'qa-chat': `Act as the job candidate. You have the candidate's full resume and the job description as context.

Answer application and interview questions in FIRST PERSON as the candidate — specific, confident, and human-sounding.
- Draw on real achievements and numbers from the resume wherever relevant.
- Match answer length to question complexity: short factual answers get 2-3 sentences; behavioural questions get a structured but conversational response.
- Never say "As an AI", "Based on the resume", or any meta-commentary. Just answer directly as the person.
- No fluff openers like "Great question!" or "Certainly!".
- Use natural English — contractions are fine.`
};

type ActionConfigMap = Record<string, { model?: string; prompt?: string }>;

export default function SettingsPage() {
  const [globalModel, setGlobalModel] = useState('llama3');
  const [baseUrl, setBaseUrl] = useState('http://127.0.0.1:11434');
  const [actionConfig, setActionConfig] = useState<ActionConfigMap>({});

  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  
  const [activeTab, setActiveTab] = useState('global');

  const tabs = [
    { id: 'global', label: 'Global defaults', detail: 'Endpoint and fallback model' },
    { id: 'analyze', label: 'Gap analysis', detail: 'Resume and role comparison' },
    { id: 'optimize', label: 'Resume optimizer', detail: 'Tailored resume content' },
    { id: 'cover-letter', label: 'Cover letter', detail: 'Application letter drafting' },
    { id: 'linkedin-message', label: 'Outreach message', detail: 'Recruiter and hiring team notes' },
    { id: 'qa-chat', label: 'AI Q&A', detail: 'Application and interview answers' },
  ];

  const loadSettingsAndModels = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setGlobalModel(data.ollamaModel || 'llama3');
        setBaseUrl(data.ollamaBaseUrl || 'http://127.0.0.1:11434');
        setActionConfig(data.actionConfig || {});
      }

      setFetchingModels(true);
      const mRes = await fetch('/api/ollama/models');
      if (mRes.ok) {
        setAvailableModels(await mRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingModels(false);
    }
  };

  useEffect(() => {
    loadSettingsAndModels();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ollamaModel: globalModel, 
          ollamaBaseUrl: baseUrl,
          actionConfig 
        }),
      });
      if (res.ok) {
        setMsg('Settings saved successfully!');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      setMsg('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleActionChange = (field: 'model' | 'prompt', value: string) => {
    setActionConfig(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value
      }
    }));
  };

  const activeConf = actionConfig[activeTab] || {};
  const installedModelOptions = availableModels.map((model) => ({
    value: model.name,
    label: model.name,
    description: 'Available on this device',
    group: 'Installed models',
    icon: <Sparkles size={14} />,
  }));
  const fallbackModelOptions = fetchingModels
    ? [{ value: '__loading__', label: 'Checking available models', description: 'Reading your local model list.', group: 'Model status', icon: <Sparkles size={14} /> }]
    : availableModels.length
      ? [
          ...(availableModels.some((model) => model.name === globalModel) ? [] : [{ value: globalModel, label: globalModel, description: 'Configured model was not detected locally.', group: 'Configured model', icon: <Settings size={14} /> }]),
          ...installedModelOptions,
        ]
      : [{ value: '__no-models__', label: 'No models found', description: 'Install a model or check the Ollama service URL.', group: 'Model status', icon: <Settings size={14} /> }];
  const workflowModelOptions = [
    { value: '', label: `Use Global Model (${globalModel})`, description: 'Inherit the workspace fallback model.', group: 'Global model', icon: <Zap size={14} /> },
    ...installedModelOptions,
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <AppTopbar />
      <main className="main-content settings-page">
        <div className="page-header settings-page-header">
          <div>
            <div className="settings-eyebrow">WORKSPACE PREFERENCES</div>
            <h1 className="page-title settings-page-title"><Settings size={23} aria-hidden="true" /> AI Settings</h1>
            <p className="page-subtitle">Choose the model and instructions that power each Applikator AI workflow.</p>
          </div>
          <button className="btn btn-primary settings-save-button" onClick={saveSettings} disabled={saving}>
            {saving ? <span className="spinner" /> : <Check size={16} />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        <div className="settings-layout">
          <nav className="settings-nav" aria-label="AI settings categories">
            <span className="settings-nav-heading">CONFIGURATION</span>
            <Tabs items={tabs.map(({ id, label, detail }) => ({ id, label, description: detail }))} value={activeTab} onChange={setActiveTab} label="AI settings categories" orientation="vertical" idPrefix="settings" className="settings-shared-tabs" />
            <div className={`settings-model-status ${fetchingModels ? 'pending' : availableModels.length ? 'ready' : 'offline'}`}>
              <span className="settings-status-dot" />
              <span><strong>{fetchingModels ? 'Checking Ollama' : availableModels.length ? 'Ollama connected' : 'No models detected'}</strong><small>{fetchingModels ? 'Loading available models' : availableModels.length ? `${availableModels.length} model${availableModels.length === 1 ? '' : 's'} available` : 'Check the service URL below'}</small></span>
            </div>
          </nav>

        <section className="card settings-card" id={`panel-settings-${activeTab}`} role="tabpanel" aria-labelledby={`tab-settings-${activeTab}`}>
          {activeTab === 'global' ? (
            <>
              <div className="settings-section-heading"><div><span className="settings-section-kicker">BASE CONFIGURATION</span><h2 className="card-title">Global defaults</h2></div><span className="settings-section-icon"><Zap size={17} /></span></div>
              <p className="settings-section-intro">
                These are the baseline settings. Any specific sector that doesn't have a model override will fall back to this Global Model.
              </p>

              <div className="form-group settings-field">
                <label className="form-label" htmlFor="ollama-base-url">Ollama service URL</label>
                <input id="ollama-base-url" className="form-input" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="http://127.0.0.1:11434" />
                <small>Applikator uses this local Ollama endpoint to discover and run models.</small>
              </div>

              <div className="form-group settings-field">
                <SelectField
                  label="Global fallback model"
                  options={fallbackModelOptions}
                  value={fetchingModels ? '__loading__' : availableModels.length ? globalModel : '__no-models__'}
                  onChange={setGlobalModel}
                  disabled={fetchingModels || availableModels.length === 0}
                  leadingIcon={<Sparkles size={14} />}
                  name="global-fallback-model"
                  hint="Used by workflows without a model override."
                />
              </div>
              <div className="settings-tips">
                <h3>RAM & performance tips</h3>
                <ul>
                  <li><strong><span style={{ color: 'var(--accent-green)' }}>8GB RAM:</span></strong> Use <b>phi3:mini</b> or <b>tinyllama</b> for the best experience.</li>
                  <li><strong><span style={{ color: 'var(--accent-amber)' }}>16GB RAM:</span></strong> You can comfortably run <b>llama3</b> or <b>mistral</b>.</li>
                  <li><strong>Troubleshooting:</strong> If you get a "System Memory" error, close your browser tabs or restart Ollama to free up fragmented RAM.</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <div className="settings-section-heading"><div><span className="settings-section-kicker">WORKFLOW CONFIGURATION</span><h2 className="card-title">{tabs.find((tab) => tab.id === activeTab)?.label} settings</h2></div><span className="settings-section-icon"><Settings size={17} /></span></div>
              <p className="settings-section-intro">
                Override the AI model and customize the specific System Prompt guidelines for this feature.
              </p>

              <div className="form-group settings-field">
                <SelectField
                  label="Override default model (optional)"
                  options={workflowModelOptions}
                  value={activeConf.model || ''}
                  onChange={(value) => handleActionChange('model', value)}
                  leadingIcon={<Sparkles size={14} />}
                  name="workflow-model"
                  hint="Choose a workflow-specific model or inherit the global fallback."
                />
              </div>

              <div className="form-group settings-field settings-prompt-field">
                <div className="settings-prompt-heading">
                  <label className="form-label" htmlFor="workflow-prompt">System prompt instructions</label>
                  <button 
                    type="button"
                    className="btn btn-ghost btn-sm settings-reset-button"
                    onClick={() => handleActionChange('prompt', defaultPrompts[activeTab] || '')}
                  >
                    <RotateCcw size={12} /> Reset to Default
                  </button>
                </div>
                <p className="settings-prompt-help">
                  Be careful modifying strict prompts (like Analyze/Optimize) as the application requires specific JSON structures to render properly.
                </p>
                <textarea 
                  id="workflow-prompt"
                  className="form-textarea" 
                  value={activeConf.prompt !== undefined ? activeConf.prompt : (defaultPrompts[activeTab] || '')}
                  onChange={(e) => handleActionChange('prompt', e.target.value)}
                />
              </div>
            </>
          )}

          {msg && <p className={`settings-save-message ${msg.startsWith('Error') ? 'error' : ''}`} role="status">{msg}</p>}
        </section>
        </div>
      </main>
    </div>
  );
}
