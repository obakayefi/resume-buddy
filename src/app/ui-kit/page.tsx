'use client';

import { useState } from 'react';
import { Activity, ArrowRight, Briefcase, Check, FileText, Search, Sparkles, Target } from 'lucide-react';
import AppTopbar from '@/components/AppTopbar';
import Sidebar from '@/components/Sidebar';
import { Alert, Badge, Button, Card, CharacterCount, CheckboxField, EmptyState, IconButton, LoadingState, MetricCard, ProgressBar, SelectField, Tabs, TextareaField, TextField } from '@/components/ui';

const kitTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity', count: 8 },
  { id: 'saved', label: 'Saved', count: 3 },
];

const statusOptions = [
  { value: 'saved', label: 'Saved', description: 'Keep this role in your review queue.', group: 'Application pipeline', icon: <Briefcase size={14} /> },
  { value: 'applied', label: 'Applied', description: 'You have submitted an application.', group: 'Application pipeline', icon: <FileText size={14} /> },
  { value: 'interviewing', label: 'Interviewing', description: 'An active conversation is underway.', group: 'In progress', icon: <Activity size={14} /> },
  { value: 'offer', label: 'Offer received', description: 'A company has made an offer.', group: 'In progress', icon: <Check size={14} /> },
  { value: 'rejected', label: 'Closed', description: 'Rejected or withdrawn applications.', group: 'Completed', icon: <Target size={14} /> },
];

const colors = [
  { name: 'Canvas', token: '--bg-primary', value: '#F5F6F8' },
  { name: 'Surface', token: '--bg-secondary', value: '#FFFFFF' },
  { name: 'Elevated', token: '--bg-elevated', value: '#F1F4F8' },
  { name: 'Text', token: '--text-primary', value: '#171A20' },
  { name: 'Muted', token: '--text-muted', value: '#798393' },
  { name: 'Primary', token: '--accent-primary', value: '#3567C8' },
  { name: 'Teal', token: '--accent-green', value: '#17A99B' },
  { name: 'Pink', token: 'Status accent', value: '#D74791' },
  { name: 'Border', token: '--border-primary', value: '#DFE4EB' },
];

export default function UiKitPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStatus, setSelectedStatus] = useState('interviewing');

  return (
    <div className="app-layout">
      <Sidebar />
      <AppTopbar />
      <main className="main-content ui-kit-content">
        <div className="ui-kit-page">
          <header className="ui-kit-intro">
            <div className="ui-kit-eyebrow"><Sparkles size={14} /> APPLIKATOR DESIGN SYSTEM</div>
            <h1 className="page-title">UI Kit</h1>
            <p className="page-subtitle">A working library of shared components and visual tokens for the application.</p>
            <Badge tone="blue" dot>Light theme · 3px corners</Badge>
            <p className="ui-kit-note">Sample values below demonstrate the component styles; they are not live application data.</p>
          </header>

          <section className="ui-kit-section">
            <div className="ui-kit-section-heading"><span>01</span><div><h2>Color tokens</h2><p>Light-first surfaces with clear blue, teal, and pink accents.</p></div></div>
            <div className="ui-kit-color-grid">
              {colors.map((color) => (
                <div key={color.name} className="ui-kit-color-swatch">
                  <span className="ui-kit-color-chip" style={{ background: color.value }} />
                  <strong>{color.name}</strong>
                  <code>{color.token}</code>
                  <small>{color.value}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="ui-kit-section">
            <div className="ui-kit-section-heading"><span>02</span><div><h2>Actions</h2><p>Button hierarchy, sizing, disabled state, and icon placement.</p></div></div>
            <Card title="Button variants" description="Use one primary action per group, with quieter options for supporting actions." className="ui-kit-card">
              <div className="ui-kit-button-row">
                <Button leadingIcon={<Sparkles size={15} />}>Primary action</Button>
                <Button variant="secondary" leadingIcon={<FileText size={15} />}>Secondary</Button>
                <Button variant="ghost">Quiet action</Button>
                <Button variant="danger">Delete</Button>
                <Button disabled>Disabled</Button>
              </div>
              <div className="ui-kit-button-row ui-kit-button-sizes">
                <Button size="sm" variant="secondary">Small</Button>
                <Button size="md" variant="secondary">Default</Button>
                <Button size="lg" variant="secondary" trailingIcon={<ArrowRight size={15} />}>Large action</Button>
              </div>
            </Card>
          </section>

          <section className="ui-kit-section">
            <div className="ui-kit-section-heading"><span>03</span><div><h2>Form controls</h2><p>Consistent labels, focus states, helper text, and comfortable hit areas.</p></div></div>
            <Card title="Inputs" description="Keep labels visible and explain expected content when it helps." className="ui-kit-card">
              <div className="ui-kit-form-grid">
                <TextField label="Company name" placeholder="e.g. Acme Studio" leadingIcon={<Briefcase size={15} />} />
                <TextField label="Search roles" placeholder="Search by title or keyword" leadingIcon={<Search size={15} />} />
                <TextField label="Email address" type="email" defaultValue="alex@example.com" hint="Used only for your application workspace." />
                <TextField label="Resume title" required error="Enter a title to continue." defaultValue="" placeholder="e.g. Product designer resume" />
                <TextareaField label="Short introduction" hint="A few sentences about the role you want." rows={3} placeholder="Write a short introduction…" />
                <SelectField
                  label="Application status"
                  options={statusOptions}
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  hint="Choose the current stage in the hiring process."
                  leadingIcon={<Activity size={15} />}
                  defaultOpen
                  name="ui-kit-status"
                />
              </div>
              <CheckboxField label="Keep this profile private" description="Only you can view your saved profile details." defaultChecked />
              <div className="ui-kit-control-examples"><CharacterCount value="A concise resume summary" max={120} /><LoadingState label="Loading applications" compact /><IconButton label="Close preview"><span aria-hidden="true">×</span></IconButton></div>
            </Card>
          </section>

          <section className="ui-kit-section">
            <div className="ui-kit-section-heading"><span>08</span><div><h2>Feedback and overlays</h2><p>Use clear status messages and consistent confirmation dialogs for important actions.</p></div></div>
            <div className="ui-kit-two-column">
              <Card title="Alerts" description="Inline feedback communicates success, guidance, and errors." className="ui-kit-card">
                <div className="ui-kit-alert-stack">
                  <Alert tone="info" title="Helpful tip">Add measurable outcomes to strengthen this resume bullet.</Alert>
                  <Alert tone="success" title="Changes saved">Your profile is up to date.</Alert>
                  <Alert tone="warning" title="Review required">One section is missing a date.</Alert>
                  <Alert tone="danger" title="Could not save">Check your connection and try again.</Alert>
                </div>
              </Card>
              <Card title="Confirmation" description="Confirm destructive actions with a clear consequence and explicit choice." className="ui-kit-card">
                <div className="ui-kit-dialog-preview"><strong>Delete this saved item?</strong><p>This action cannot be undone.</p><div><Button variant="secondary" size="sm">Cancel</Button><Button variant="danger" size="sm">Delete item</Button></div></div>
              </Card>
            </div>
          </section>

          <section className="ui-kit-section">
            <div className="ui-kit-section-heading"><span>04</span><div><h2>Navigation and status</h2><p>Tabs and badges keep related content grouped and status easy to scan.</p></div></div>
            <div className="ui-kit-two-column">
              <Card title="Tabs" description="A compact segmented navigation for related views." className="ui-kit-card">
                <Tabs items={kitTabs} value={activeTab} onChange={setActiveTab} label="UI kit preview tabs" idPrefix="ui-kit-preview" />
                <div className="ui-kit-tab-panel" id={`panel-ui-kit-preview-${activeTab}`} role="tabpanel" aria-labelledby={`tab-ui-kit-preview-${activeTab}`}>
                  Selected view: <strong>{kitTabs.find((tab) => tab.id === activeTab)?.label}</strong>
                </div>
              </Card>
              <Card title="Status badges" description="Tone supports meaning; text always carries the status." className="ui-kit-card">
                <div className="ui-kit-badge-row">
                  <Badge tone="neutral" dot>Saved</Badge><Badge tone="blue" dot>Applied</Badge><Badge tone="pink" dot>Interviewing</Badge>
                  <Badge tone="success" dot>Offer</Badge><Badge tone="warning" dot>Needs review</Badge><Badge tone="danger" dot>Closed</Badge>
                </div>
              </Card>
            </div>
          </section>

          <section className="ui-kit-section">
            <div className="ui-kit-section-heading"><span>05</span><div><h2>Dashboard cards</h2><p>Metrics and progress summaries use aligned values and restrained color.</p></div></div>
            <div className="ui-kit-metric-grid">
              <MetricCard label="Saved roles" value="24" detail="Sample metric" icon={<Briefcase size={16} />} tone="blue" />
              <MetricCard label="Applications sent" value="18" detail="Sample metric" icon={<FileText size={16} />} tone="teal" />
              <MetricCard label="Interviews" value="6" detail="Sample metric" icon={<Activity size={16} />} tone="pink" />
              <MetricCard label="Resume match" value="82%" detail="Sample metric" icon={<Target size={16} />} tone="success" />
            </div>
            <Card title="Progress indicators" description="Keep the label and value visible alongside the visual progress." className="ui-kit-card ui-kit-progress-card">
              <ProgressBar label="Resume keyword match" value={82} tone="blue" />
              <ProgressBar label="Application pipeline" value={58} tone="teal" />
              <ProgressBar label="Profile completeness" value={74} tone="pink" />
            </Card>
          </section>

          <section className="ui-kit-section">
            <div className="ui-kit-section-heading"><span>06</span><div><h2>Empty states</h2><p>Explain what belongs here and provide a useful next step.</p></div></div>
            <Card className="ui-kit-empty-card">
              <EmptyState
                icon={<Briefcase size={20} />}
                title="No applications yet"
                description="When you save a role, your application pipeline will appear here."
                action={<Button size="sm" leadingIcon={<Check size={14} />}>Add your first role</Button>}
              />
            </Card>
          </section>

          <section className="ui-kit-section ui-kit-spacing-section">
            <div className="ui-kit-section-heading"><span>07</span><div><h2>Spacing scale</h2><p>Use a consistent rhythm to give each screen room to breathe.</p></div></div>
            <Card className="ui-kit-card">
              <div className="ui-kit-spacing-list">
                {[4, 8, 12, 16, 24, 32].map((size) => (
                  <div key={size} className="ui-kit-spacing-row"><code>{size}px</code><span><i style={{ width: size * 4 }} /></span></div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
