'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AppTopbar from '@/components/AppTopbar';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  Bookmark,
  FlaskConical,
  Briefcase,
  GraduationCap,
  Cpu,
  Database,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  HelpCircle,
  Clock,
  Layers,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  badge: string;
  icon: any;
}

const SECTIONS: GuideSection[] = [
  { id: 'philosophy', title: 'Philosophy & Architecture', badge: 'Core', icon: Shield },
  { id: 'resume', title: 'Master Resume Strategy', badge: 'Step 1', icon: FileText },
  { id: 'story-bank', title: 'Story Bank & STAR Framework', badge: 'Step 2', icon: Bookmark },
  { id: 'lab', title: 'The Lab (Tailoring & ATS)', badge: 'Step 3', icon: FlaskConical },
  { id: 'applications', title: 'Job Log & 7-Day Follow-Ups', badge: 'Step 4', icon: Briefcase },
  { id: 'scholarships', title: 'Scholarships & Grants', badge: 'Step 5', icon: GraduationCap },
  { id: 'ollama', title: 'Local Ollama & AI Setup', badge: 'Engine', icon: Cpu },
  { id: 'backup', title: 'Backup & Data Sovereignty', badge: 'Data', icon: Database },
];

export default function GuidelinesPage() {
  const [activeTab, setActiveTab] = useState('philosophy');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <AppTopbar />
      <main className="main-content guidelines-page">
        <div className="page-header guidelines-header">
          <div>
            <div className="guidelines-eyebrow">
              <BookOpen size={14} /> APPLIKATOR MASTER MANUAL
            </div>
            <h1 className="page-title guidelines-title">How Applikator Works</h1>
            <p className="page-subtitle">
              A comprehensive operational guide for new users to maximize interview callbacks, craft 95%+ ATS resumes, and harness private local AI.
            </p>
          </div>
          <div className="guidelines-quick-links">
            <Link href="/lab" className="btn btn-primary">
              <FlaskConical size={16} /> Open The Lab <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="guidelines-nav-bar" role="tablist" aria-label="Guideline chapters">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                role="tab"
                aria-selected={isActive}
                className={`guidelines-nav-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(sec.id)}
              >
                <Icon size={16} />
                <span>{sec.title}</span>
                <small className="guidelines-tab-badge">{sec.badge}</small>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Philosophy & Architecture */}
        {activeTab === 'philosophy' && (
          <div className="guidelines-content-container">
            <article className="card guidelines-panel">
              <div className="guidelines-chapter-header">
                <div className="guidelines-chapter-icon is-green"><Shield size={22} /></div>
                <div>
                  <span className="guidelines-chapter-kicker">CHAPTER 01</span>
                  <h2>Why Applikator Is Different</h2>
                </div>
              </div>

              <p className="guidelines-lead-text">
                Most career platforms upload your private employment history, salary targets, and proprietary company details to commercial cloud servers. 
                <strong> Applikator was built on an uncompromising local-first philosophy</strong>: your career data remains strictly on your machine, powered by offline AI.
              </p>

              <div className="guidelines-pillars-grid">
                <div className="guidelines-pillar-card">
                  <div className="guidelines-pillar-icon is-emerald"><Shield size={18} /></div>
                  <h3>100% Local-First Privacy</h3>
                  <p>
                    All resume profiles, application logs, and interview responses are stored in your local database. Zero tracking, zero third-party telemetry, and zero data leakage.
                  </p>
                </div>

                <div className="guidelines-pillar-card">
                  <div className="guidelines-pillar-icon is-purple"><Cpu size={18} /></div>
                  <h3>Private Local AI (Ollama)</h3>
                  <p>
                    Applikator interfaces with Ollama running natively on your hardware. Inference happens offline using high-performance open-source LLMs like Llama 3, Qwen 2.5, or Phi-3.
                  </p>
                </div>

                <div className="guidelines-pillar-card">
                  <div className="guidelines-pillar-icon is-blue"><Zap size={18} /></div>
                  <h3>Executive Standards</h3>
                  <p>
                    Our prompts adhere to industry-gold methodologies: the Google XYZ resume bullet formula, the Harvard Business School OCS cover letter structure, and the STAR interview framework.
                  </p>
                </div>
              </div>

              <div className="guidelines-callout tip">
                <CheckCircle2 size={18} />
                <div>
                  <strong>Recommended First Run:</strong> Ensure you have Ollama installed and running before starting The Lab. Run <code>ollama run llama3</code> or <code>ollama run phi3</code> in your terminal. Check the <button type="button" className="guidelines-inline-link" onClick={() => setActiveTab('ollama')}>Ollama Setup Guide</button> for details.
                </div>
              </div>
            </article>

            {/* Application Lifecycle Infographic */}
            <article className="card guidelines-panel">
              <div className="guidelines-chapter-header">
                <div className="guidelines-chapter-icon is-blue"><Layers size={22} /></div>
                <div>
                  <span className="guidelines-chapter-kicker">WORKFLOW LIFECYCLE</span>
                  <h2>The 5-Step Pipeline from Profile to Offer</h2>
                </div>
              </div>

              <div className="guidelines-steps-timeline">
                <div className="guidelines-timeline-step">
                  <span className="guidelines-step-number">01</span>
                  <div className="guidelines-step-body">
                    <h4>Master Resume</h4>
                    <p>Build your complete, exhaustive employment record once. Never re-type roles or education again.</p>
                  </div>
                </div>

                <div className="guidelines-timeline-step">
                  <span className="guidelines-step-number">02</span>
                  <div className="guidelines-step-body">
                    <h4>Story Bank (STAR)</h4>
                    <p>Record your real accomplishments: Situation, Task, Action, and Metrics to power high-conviction cover letters.</p>
                  </div>
                </div>

                <div className="guidelines-timeline-step">
                  <span className="guidelines-step-number">03</span>
                  <div className="guidelines-step-body">
                    <h4>The Lab Workshop</h4>
                    <p>Input target Job Description. Get instant ATS Gap Analysis, tailored Google XYZ bullets, Harvard cover letters, and interview simulations.</p>
                  </div>
                </div>

                <div className="guidelines-timeline-step">
                  <span className="guidelines-step-number">04</span>
                  <div className="guidelines-step-body">
                    <h4>1-Click Job Log</h4>
                    <p>Save targeted documents to your Kanban board. Track status with 1-click steppers.</p>
                  </div>
                </div>

                <div className="guidelines-timeline-step">
                  <span className="guidelines-step-number">05</span>
                  <div className="guidelines-step-body">
                    <h4>7-Day Follow-Up</h4>
                    <p>The dashboard monitors applications pending 7+ days and alerts you to follow up, 3x-ing interview callbacks.</p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        )}

        {/* Tab 2: Master Resume */}
        {activeTab === 'resume' && (
          <div className="guidelines-content-container">
            <article className="card guidelines-panel">
              <div className="guidelines-chapter-header">
                <div className="guidelines-chapter-icon is-blue"><FileText size={22} /></div>
                <div>
                  <span className="guidelines-chapter-kicker">CHAPTER 02</span>
                  <h2>Master Resume Strategy</h2>
                </div>
              </div>

              <p className="guidelines-lead-text">
                Your Master Resume is your <em>canonical career reservoir</em>. It holds every project, skill, and bullet you’ve ever accomplished. 
                You never send the Master Resume directly to employers—instead, <strong>The Lab extracts and tailors tailored versions for specific roles</strong>.
              </p>

              <h3 className="guidelines-subhead">The Google XYZ Formula for High-Impact Bullets</h3>
              <p>
                Google recruiters recommend structuring every achievement using this formula:
              </p>

              <div className="guidelines-formula-card">
                <code>Accomplished [X] as measured by [Y] by doing [Z]</code>
              </div>

              <div className="guidelines-comparison-table">
                <div className="guidelines-comparison-col before">
                  <span className="guidelines-comparison-badge bad">Weak / Passive Bullet</span>
                  <p>&ldquo;Responsible for improving backend API performance and rewriting database queries.&rdquo;</p>
                  <small>No metrics, passive language (&ldquo;Responsible for&rdquo;), vague actions.</small>
                </div>
                <div className="guidelines-comparison-col after">
                  <span className="guidelines-comparison-badge good">Google XYZ Formula</span>
                  <p>&ldquo;Reduced p99 checkout API latency by 42% (520ms &rarr; 300ms) by indexing high-cardinality PostgreSQL columns and implementing Redis caching.&rdquo;</p>
                  <small>Metric-driven, strong active verb (&ldquo;Reduced&rdquo;), specific technical execution.</small>
                </div>
              </div>

              <h3 className="guidelines-subhead" style={{ marginTop: 28 }}>Key Features in Master Resume</h3>
              <ul className="guidelines-checklist">
                <li>
                  <strong>Action Verbs Inspector:</strong> Browse 80+ categorized strong power verbs (Executive, Technical, Optimization, Leadership) right from the toolbar.
                </li>
                <li>
                  <strong>Reorder Controls (&uarr; / &darr;):</strong> Prioritize your strongest accomplishments or roles to the top with 1-click reorder buttons.
                </li>
                <li>
                  <strong>Optimal Length Guidelines:</strong> Keep bullets between 35 and 180 characters to ensure ATS readability and clean PDF formatting.
                </li>
                <li>
                  <strong>Dirty State Indicator:</strong> An amber dot notifies you whenever unsaved changes exist, preventing accidental loss.
                </li>
              </ul>

              <div style={{ marginTop: 24 }}>
                <Link href="/resume" className="btn btn-primary">
                  <FileText size={16} /> Edit Master Resume <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          </div>
        )}

        {/* Tab 3: Story Bank & STAR Framework */}
        {activeTab === 'story-bank' && (
          <div className="guidelines-content-container">
            <article className="card guidelines-panel">
              <div className="guidelines-chapter-header">
                <div className="guidelines-chapter-icon is-purple"><Bookmark size={22} /></div>
                <div>
                  <span className="guidelines-chapter-kicker">CHAPTER 03</span>
                  <h2>Story Bank & STAR Framework</h2>
                </div>
              </div>

              <p className="guidelines-lead-text">
                Resumes list what you did, but <strong>stories explain how you think, lead, and overcome obstacles</strong>. 
                The Story Bank is your personal repository of high-impact behavioral vignettes formatted with the STAR framework.
              </p>

              <div className="guidelines-star-breakdown">
                <div className="guidelines-star-item">
                  <span className="guidelines-star-letter">S</span>
                  <div>
                    <h4>Situation</h4>
                    <p>The business context, system architecture, or crisis you faced. Keep it concise (1-2 sentences).</p>
                  </div>
                </div>

                <div className="guidelines-star-item">
                  <span className="guidelines-star-letter">T</span>
                  <div>
                    <h4>Task</h4>
                    <p>Your specific ownership, responsibility, and the core engineering or organizational problem to resolve.</p>
                  </div>
                </div>

                <div className="guidelines-star-item">
                  <span className="guidelines-star-letter">A</span>
                  <div>
                    <h4>Action</h4>
                    <p>The exact technical interventions, architecture changes, leadership decisions, or trade-offs you executed.</p>
                  </div>
                </div>

                <div className="guidelines-star-item">
                  <span className="guidelines-star-letter">R</span>
                  <div>
                    <h4>Result & Metrics</h4>
                    <p>Quantifiable outcomes: latency cut by 40%, zero downtime during migration, $120k cloud savings, or team velocity increase.</p>
                  </div>
                </div>
              </div>

              <h3 className="guidelines-subhead" style={{ marginTop: 24 }}>How Applikator Uses Your Story Bank</h3>
              <p>
                When you generate a Cover Letter or practice Interview Q&A in The Lab, Applikator automatically selects relevant stories from your bank and weaves them into your documents. This ensures your applications sound genuinely human and grounded in real evidence.
              </p>

              <div className="guidelines-callout info">
                <Sparkles size={18} />
                <div>
                  <strong>AI Polish Feature:</strong> Have a rough draft? Click &ldquo;AI Polish into STAR&rdquo; inside the Story Bank editor. Applikator&rsquo;s local AI will instantly restructure your notes into clean, metric-focused STAR sections.
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <Link href="/story-bank" className="btn btn-primary">
                  <Bookmark size={16} /> Open Story Bank <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          </div>
        )}

        {/* Tab 4: The Lab Workshop */}
        {activeTab === 'lab' && (
          <div className="guidelines-content-container">
            <article className="card guidelines-panel">
              <div className="guidelines-chapter-header">
                <div className="guidelines-chapter-icon is-green"><FlaskConical size={22} /></div>
                <div>
                  <span className="guidelines-chapter-kicker">CHAPTER 04</span>
                  <h2>The Lab: Tailoring & ATS Optimization</h2>
                </div>
              </div>

              <p className="guidelines-lead-text">
                The Lab is the core creative workshop of Applikator. Here you compare your Master Resume against a real Job Description to bridge keyword gaps, craft Harvard-standard cover letters, and rehearse interview answers.
              </p>

              <div className="guidelines-tools-grid">
                <div className="guidelines-tool-card">
                  <div className="guidelines-tool-header">
                    <span className="guidelines-badge blue">Tool 01</span>
                    <h4>ATS Gap Analysis</h4>
                  </div>
                  <p>
                    Compares your resume against the target role. Produces an ATS Match Score (0-100%), displays matching keywords, highlights critical missing skills, and gives actionable advice.
                  </p>
                </div>

                <div className="guidelines-tool-card">
                  <div className="guidelines-tool-header">
                    <span className="guidelines-badge green">Tool 02</span>
                    <h4>Interactive Bullet Optimizer</h4>
                  </div>
                  <p>
                    Rewrites your resume bullets to incorporate missing keywords while preserving factual truth. Includes an interactive Diff Inspector so you can review and accept tailored changes with 1 click.
                  </p>
                </div>

                <div className="guidelines-tool-card">
                  <div className="guidelines-tool-header">
                    <span className="guidelines-badge purple">Tool 03</span>
                    <h4>Harvard-Standard Cover Letter</h4>
                  </div>
                  <p>
                    Follows the prestigious Harvard Office of Career Services business letter standard: formal header, technical impact paragraph, architectural leadership, and confident close—zero generic fluff.
                  </p>
                </div>

                <div className="guidelines-tool-card">
                  <div className="guidelines-tool-header">
                    <span className="guidelines-badge amber">Tool 04</span>
                    <h4>Recruiter Outreach (LinkedIn)</h4>
                  </div>
                  <p>
                    Drafts a concise, punchy &lt;150 word direct message formatted specifically for LinkedIn connection requests or InMails to recruiters and engineering managers.
                  </p>
                </div>

                <div className="guidelines-tool-card" style={{ gridColumn: 'span 2' }}>
                  <div className="guidelines-tool-header">
                    <span className="guidelines-badge pink">Tool 05</span>
                    <h4>First-Person AI Interview Simulation</h4>
                  </div>
                  <p>
                    Ask any interview question (&ldquo;Tell me about a time you handled a production outage&rdquo; or &ldquo;How do you design scalable APIs?&rdquo;). The AI speaks in <em>first person as you</em>, drawing directly from your resume and Story Bank metrics.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <Link href="/lab" className="btn btn-primary">
                  <FlaskConical size={16} /> Enter The Lab <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          </div>
        )}

        {/* Tab 5: Job Log & 7-Day Follow-Ups */}
        {activeTab === 'applications' && (
          <div className="guidelines-content-container">
            <article className="card guidelines-panel">
              <div className="guidelines-chapter-header">
                <div className="guidelines-chapter-icon is-amber"><Briefcase size={22} /></div>
                <div>
                  <span className="guidelines-chapter-kicker">CHAPTER 05</span>
                  <h2>Job Log & The 7-Day Follow-Up Rule</h2>
                </div>
              </div>

              <p className="guidelines-lead-text">
                Sending your application is only the first step. Top job candidates follow up strategically. Applikator&rsquo;s Job Log tracks your entire pipeline and proactively alerts you when follow-ups are due.
              </p>

              <h3 className="guidelines-subhead">The Application Stepper</h3>
              <p>Each application progresses through five standard states:</p>
              
              <div className="guidelines-stepper-preview">
                <span className="guidelines-step-badge saved">1. Saved</span>
                <span className="guidelines-step-arrow">&rarr;</span>
                <span className="guidelines-step-badge applied">2. Applied</span>
                <span className="guidelines-step-arrow">&rarr;</span>
                <span className="guidelines-step-badge interviewing">3. Interviewing</span>
                <span className="guidelines-step-arrow">&rarr;</span>
                <span className="guidelines-step-badge offer">4. Offer &#127881;</span>
                <span className="guidelines-step-arrow">&rarr;</span>
                <span className="guidelines-step-badge closed">5. Closed</span>
              </div>

              <h3 className="guidelines-subhead" style={{ marginTop: 24 }}>Why 7-Day Follow-Ups Matter</h3>
              <p>
                Recruiters receive hundreds of inbound resumes per open req. An application often sits in an ATS inbox unreviewed. 
                Applikator tracks the exact timestamp when you applied:
              </p>
              <ul className="guidelines-checklist">
                <li>
                  <strong>Automatic Dashboard Alerts:</strong> Applications in &ldquo;Applied&rdquo; status older than 7 days trigger an amber notification card on your main Dashboard.
                </li>
                <li>
                  <strong>Re-open in Lab Shortcut:</strong> Click &ldquo;Re-open in Lab&rdquo; right from the alert or Job Log row to generate a personalized recruiter follow-up message or brush up on technical interview questions.
                </li>
                <li>
                  <strong>Optimistic Status Stepper:</strong> Advance applications with 1-click on your Kanban cards without page reloads.
                </li>
              </ul>

              <div style={{ marginTop: 24 }}>
                <Link href="/applications" className="btn btn-primary">
                  <Briefcase size={16} /> Open Job Log <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          </div>
        )}

        {/* Tab 6: Scholarships & Grants */}
        {activeTab === 'scholarships' && (
          <div className="guidelines-content-container">
            <article className="card guidelines-panel">
              <div className="guidelines-chapter-header">
                <div className="guidelines-chapter-icon is-purple"><GraduationCap size={22} /></div>
                <div>
                  <span className="guidelines-chapter-kicker">CHAPTER 06</span>
                  <h2>Scholarships & Grant Funding</h2>
                </div>
              </div>

              <p className="guidelines-lead-text">
                Managing scholarship and fellowship essays requires strict adherence to word limits, prompt fidelity, and clear demonstration of impact. Applikator provides a dedicated suite for funding opportunities.
              </p>

              <div className="guidelines-pillars-grid">
                <div className="guidelines-pillar-card">
                  <div className="guidelines-pillar-icon is-purple"><Sparkles size={18} /></div>
                  <h3>Track Categorization</h3>
                  <p>Organize grants across AI & Machine Learning, Cybersecurity & Defense, General STEM, and Diversity & Inclusion.</p>
                </div>

                <div className="guidelines-pillar-card">
                  <div className="guidelines-pillar-icon is-blue"><Layers size={18} /></div>
                  <h3>Prompt Workspaces</h3>
                  <p>Add specific essay questions with target word counts. Draft, polish, and track readiness per question.</p>
                </div>

                <div className="guidelines-pillar-card">
                  <div className="guidelines-pillar-icon is-green"><Zap size={18} /></div>
                  <h3>Word-Count Trimmer & Critique</h3>
                  <p>Enforce strict essay length constraints. Local AI safely trims excess prose without losing your core impact.</p>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <Link href="/scholarships" className="btn btn-primary">
                  <GraduationCap size={16} /> Manage Scholarships <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          </div>
        )}

        {/* Tab 7: Local Ollama & AI Setup */}
        {activeTab === 'ollama' && (
          <div className="guidelines-content-container">
            <article className="card guidelines-panel">
              <div className="guidelines-chapter-header">
                <div className="guidelines-chapter-icon is-emerald"><Cpu size={22} /></div>
                <div>
                  <span className="guidelines-chapter-kicker">CHAPTER 07</span>
                  <h2>Setting Up Local Ollama & Models</h2>
                </div>
              </div>

              <p className="guidelines-lead-text">
                Applikator communicates with Ollama via its local REST API (default: <code>http://127.0.0.1:11434</code>). 
                Here is the quick setup procedure for your operating system.
              </p>

              <h3 className="guidelines-subhead">1. Install Ollama</h3>
              <p>Download the free installer for your OS from <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="guidelines-inline-link">ollama.com/download <ExternalLink size={12} /></a>.</p>

              <h3 className="guidelines-subhead" style={{ marginTop: 20 }}>2. Pick Your Hardware Tier & Pull a Model</h3>
              <div className="guidelines-ram-tiers">
                <div className="guidelines-ram-tier">
                  <span className="guidelines-ram-tag green">8 GB RAM (Lightweight)</span>
                  <p>Fast inference, minimal memory footprint:</p>
                  <code>ollama run phi3:mini</code>
                  <small>or <code>ollama run tinyllama</code></small>
                </div>

                <div className="guidelines-ram-tier">
                  <span className="guidelines-ram-tag amber">16 GB RAM (Balanced / Recommended)</span>
                  <p>Exceptional reasoning and formatting for resumes:</p>
                  <code>ollama run llama3</code>
                  <small>or <code>ollama run qwen2.5:7b</code></small>
                </div>

                <div className="guidelines-ram-tier">
                  <span className="guidelines-ram-tag purple">32+ GB RAM (High Performance)</span>
                  <p>Highest quality executive prose and synthesis:</p>
                  <code>ollama run llama3.1:8b</code>
                  <small>or <code>ollama run qwen2.5:14b</code></small>
                </div>
              </div>

              <h3 className="guidelines-subhead" style={{ marginTop: 28 }}>Troubleshooting Connection Issues</h3>
              <ul className="guidelines-checklist">
                <li>
                  <strong>&ldquo;Cannot connect to Ollama&rdquo;:</strong> Verify the service is active by running <code>ollama serve</code> in a terminal or opening <code>http://127.0.0.1:11434</code> in your browser (it should display &ldquo;Ollama is running&rdquo;).
                </li>
                <li>
                  <strong>System Memory Error / Out of RAM:</strong> Applikator includes automatic error detection. If a 7B model fails due to low RAM, use the 1-click model switcher inside The Lab to immediately switch to <code>phi3</code>.
                </li>
                <li>
                  <strong>Custom Host / Remote GPU:</strong> Change the Ollama URL in <Link href="/settings" className="guidelines-inline-link">Settings</Link> to point to any remote Ollama server.
                </li>
              </ul>

              <div style={{ marginTop: 24 }}>
                <Link href="/settings" className="btn btn-primary">
                  <Cpu size={16} /> Open AI Settings <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          </div>
        )}

        {/* Tab 8: Backup & Data Sovereignty */}
        {activeTab === 'backup' && (
          <div className="guidelines-content-container">
            <article className="card guidelines-panel">
              <div className="guidelines-chapter-header">
                <div className="guidelines-chapter-icon is-blue"><Database size={22} /></div>
                <div>
                  <span className="guidelines-chapter-kicker">CHAPTER 08</span>
                  <h2>Backup, Restore & Migration</h2>
                </div>
              </div>

              <p className="guidelines-lead-text">
                Your data is yours forever. Applikator provides a single-click JSON workspace backup that captures all master profiles, job applications, interview stories, scholarships, and prompt customizations.
              </p>

              <div className="guidelines-comparison-table">
                <div className="guidelines-comparison-col">
                  <span className="guidelines-comparison-badge good">Exporting Data</span>
                  <p>Navigate to <strong>Settings &rarr; Workspace Backup</strong> and click &ldquo;Download Full Backup (.json)&rdquo;.</p>
                  <small>Saves an uncompressed, human-readable JSON file named <code>applikator-workspace-backup-YYYY-MM-DD.json</code>.</small>
                </div>
                <div className="guidelines-comparison-col">
                  <span className="guidelines-comparison-badge good">Restoring & Merging</span>
                  <p>Select your backup JSON file and click &ldquo;Restore Workspace Now&rdquo;.</p>
                  <small>Applikator safely upserts records by ID, making it easy to migrate across laptops without losing history.</small>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <Link href="/settings" className="btn btn-primary">
                  <Database size={16} /> Open Backup Center <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          </div>
        )}

        {/* FAQ Section */}
        <section className="card guidelines-panel guidelines-faq-section">
          <div className="guidelines-chapter-header">
            <div className="guidelines-chapter-icon is-amber"><HelpCircle size={22} /></div>
            <div>
              <span className="guidelines-chapter-kicker">COMMONLY ASKED</span>
              <h2>Frequently Asked Questions</h2>
            </div>
          </div>

          <div className="guidelines-faq-list">
            {[
              {
                q: 'Do I need an active internet connection to use Applikator?',
                a: 'No! Applikator is completely local-first. Both the database (Prisma / MongoDB) and your AI engine (Ollama) run 100% offline on your device.',
              },
              {
                q: 'How does The Lab calculate the ATS Match Score?',
                a: 'The ATS Gap Analysis scans the Job Description for core technical competencies, libraries, methodologies, and architectural keywords, and calculates semantic alignment against your resume. A score of 70%+ represents a strong match.',
              },
              {
                q: 'What is the fastest way to get started as a new user?',
                a: 'Start by updating your Master Resume (/resume) with your basic contact info and top 2 recent roles. Next, add 2-3 STAR stories to your Story Bank (/story-bank). Then jump into The Lab (/lab) with a job description you want to apply for!',
              },
              {
                q: 'Can I use Applikator for multiple different career tracks (e.g. Frontend vs Backend)?',
                a: 'Yes. Keep all your experiences in your Master Resume. When tailoring in The Lab, the AI extracts only the experiences relevant to the target job description.',
              },
              {
                q: 'How do I download my finished tailored resume as a PDF?',
                a: 'Inside The Lab, after tailoring your bullets, click the "Export PDF" button in the action bar to generate an ATS-formatted PDF document ready for submission.',
              },
            ].map((faq, idx) => (
              <div key={idx} className={`guidelines-faq-item ${expandedFaq === idx ? 'expanded' : ''}`}>
                <button
                  type="button"
                  className="guidelines-faq-question"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={expandedFaq === idx}
                >
                  <span>{faq.q}</span>
                  {expandedFaq === idx ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                </button>
                {expandedFaq === idx && (
                  <div className="guidelines-faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
