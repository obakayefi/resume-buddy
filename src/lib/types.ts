// Types for the Resume Buddy application

export interface ContactInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  twitter: string;
  website: string;
}

export interface Experience {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

export interface SkillGroup {
  id: string;
  category: string;
  skills: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date?: string;
}

export interface MasterResumeData {
  id?: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  twitter: string;
  website: string;
  summary: string;
  skills: string[]; // Deprecated, use skillGroups
  skillGroups: SkillGroup[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  isActive?: boolean;
}

export interface ApplicationData {
  id?: string;
  company: string;
  jobTitle: string;
  jobUrl: string;
  salary: string;
  location: string;
  jobDescription: string;
  extraInfo: string;
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  atsScore: number;
  optimizedResume: string;
  optimizedSummary: string;
  coverLetter: string;
  linkedinMessage: string;
  recruiterName: string;
  recruiterLinkedin: string;
  notes: string;
  appliedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  masterResumeId: string;
  generationTimes?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GapAnalysis {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export interface OptimizedBullet {
  original: string;
  optimized: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface SettingsData {
  ollamaModel: string;
  ollamaBaseUrl: string;
}

export const STATUS_LABELS: Record<string, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

export const STATUS_COLORS: Record<string, string> = {
  saved: '#6366f1',
  applied: '#3b82f6',
  interviewing: '#f59e0b',
  offer: '#22c55e',
  rejected: '#ef4444',
};

export interface ScholarshipQuestion {
  id: string;
  scholarshipId: string;
  prompt: string;
  maxWords: number;
  maxChars: number;
  answer: string;
  status: 'todo' | 'drafting' | 'done';
  createdAt?: string;
  updatedAt?: string;
}

export interface Scholarship {
  id: string;
  name: string;
  organization: string;
  track: 'AI' | 'Cybersecurity' | 'General' | 'Diversity';
  url: string;
  awardAmount: string;
  deadline: string;
  status: 'saved' | 'drafting' | 'review' | 'submitted' | 'awarded';
  notes: string;
  questions?: ScholarshipQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StoryBankItem {
  id: string;
  title: string;
  category: 'AI' | 'Cybersecurity' | 'Leadership' | 'Challenge' | 'Goal' | 'Other';
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export const SCHOLARSHIP_STATUS_LABELS: Record<string, string> = {
  saved: 'Saved',
  drafting: 'In Progress',
  review: 'Under Review',
  submitted: 'Submitted',
  awarded: 'Awarded 🎉',
};

export const SCHOLARSHIP_STATUS_COLORS: Record<string, string> = {
  saved: '#6366f1',
  drafting: '#f59e0b',
  review: '#8b5cf6',
  submitted: '#3b82f6',
  awarded: '#22c55e',
};

