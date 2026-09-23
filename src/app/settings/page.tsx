'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { Settings, Zap, RotateCcw } from 'lucide-react';

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
  'cover-letter': `Act as an expert Technical Copywriter and Senior Engineering Manager. Your goal is to write a high-conversion cover letter that sounds human, assertive, and impact-driven.

WRITING RULES (Strict Adherence):

1. NO FLUFF: Avoid "I am thrilled," "passionate innovator," or "ideal candidate."
2. THE HOOK: Start with a direct observation about the company's product or a technical challenge they are likely facing based on the JD.
3. PROVE IT: Do not list tools. Instead, link a tool to a business outcome (e.g., "Used Python/AWS to cut server costs by 20%" rather than "I know Python and AWS").
4. TONE: Professional, peer-to-peer (not submissive), and direct. Use "active" verbs.
5. GLOBAL FIT: Emphasize "Async-friendly" communication and the ability to work independently in a distributed team.

STRUCTURE:
- Para 1: The Hook (Why this company + the specific problem I solve).
- Para 2: The Evidence (The "Hero" story from past work that matches their needs — pull from the resume achievements).
- Para 3: The Culture/Tech Alignment (Briefly why the candidate's stack/workflow fits their specific team).
- Para 4: The Call to Action (Assertive closing — NOT "I look forward to hearing from you").

Output the cover letter in clean, professional Markdown format. Use the candidate's real name from the resume. Keep it concise — no more than 400 words.`,
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
    { id: 'global', label: 'Global' },
    { id: 'analyze', label: 'Analyze' },
    { id: 'optimize', label: 'Optimize' },
    { id: 'cover-letter', label: 'Cover Letter' },
    { id: 'linkedin-message', label: 'LinkedIn' },
    { id: 'qa-chat', label: 'Q&A Chat' },
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

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={28} /> AI Settings
          </h1>
          <button className="btn btn-primary" onClick={saveSettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>

        <div className="tabs">
          {tabs.map(t => (
            <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="card" style={{ maxWidth: 800 }}>
          {activeTab === 'global' ? (
            <>
              <h2 className="card-title">Global Fallbacks</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                These are the baseline settings. Any specific sector that doesn't have a model override will fall back to this Global Model.
              </p>

              <div className="form-group">
                <label className="form-label">Ollama Base URL</label>
                <input className="form-input" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Global Fallback Model</label>
                <select 
                  className="form-select" 
                  value={globalModel}
                  onChange={(e) => setGlobalModel(e.target.value)}
                >
                  {fetchingModels ? <option>Loading models...</option> : null}
                  {!fetchingModels && availableModels.length === 0 && <option value="">No models found</option>}
                  {availableModels.map(m => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginTop: 24, padding: 16, background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>RAM & Performance Tips</h3>
                <ul style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 18, lineHeight: 1.6 }}>
                  <li><strong><span style={{ color: 'var(--accent-green)' }}>8GB RAM:</span></strong> Use <b>phi3:mini</b> or <b>tinyllama</b> for the best experience.</li>
                  <li><strong><span style={{ color: 'var(--accent-amber)' }}>16GB RAM:</span></strong> You can comfortably run <b>llama3</b> or <b>mistral</b>.</li>
                  <li><strong>Troubleshooting:</strong> If you get a "System Memory" error, close your browser tabs or restart Ollama to free up fragmented RAM.</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <h2 className="card-title" style={{ textTransform: 'capitalize' }}>{activeTab.replace('-', ' ')} Settings</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                Override the AI model and customize the specific System Prompt guidelines for this feature.
              </p>

              <div className="form-group">
                <label className="form-label">Override Default Model <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 'normal' }}>(Optional)</span></label>
                <select 
                  className="form-select" 
                  value={activeConf.model || ''}
                  onChange={(e) => handleActionChange('model', e.target.value)}
                >
                  <option value="">Use Global Model ({globalModel})</option>
                  {availableModels.map(m => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>System Prompt Instructions</label>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ fontSize: 11, padding: '2px 8px', height: 'auto' }}
                    onClick={() => handleActionChange('prompt', defaultPrompts[activeTab] || '')}
                  >
                    <RotateCcw size={12} /> Reset to Default
                  </button>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Be careful modifying strict prompts (like Analyze/Optimize) as the application requires specific JSON structures to render properly.
                </p>
                <textarea 
                  className="form-textarea" 
                  style={{ minHeight: 400, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5 }}
                  value={activeConf.prompt !== undefined ? activeConf.prompt : (defaultPrompts[activeTab] || '')}
                  onChange={(e) => handleActionChange('prompt', e.target.value)}
                />
              </div>
            </>
          )}

          {msg && <p style={{ marginTop: 16, fontSize: 14, color: 'var(--accent-green)' }}>{msg}</p>}
        </div>
      </main>
    </div>
  );
}
