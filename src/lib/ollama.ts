// Ollama API utility for local LLM communication

import { type GapAnalysis, type OptimizedBullet } from './types';

const DEFAULT_BASE_URL = 'http://127.0.0.1:11434';

async function getSettings() {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {
    // fallback to defaults
  }
  return { ollamaModel: 'llama3', ollamaBaseUrl: DEFAULT_BASE_URL };
}

export async function checkOllamaConnection(baseUrl?: string): Promise<{ connected: boolean; models: string[] }> {
  try {
    const url = baseUrl || DEFAULT_BASE_URL;
    const res = await fetch(`${url}/api/tags`);
    if (res.ok) {
      const data = await res.json();
      return { connected: true, models: data.models?.map((m: { name: string }) => m.name) || [] };
    }
    return { connected: false, models: [] };
  } catch {
    return { connected: false, models: [] };
  }
}

export async function generateCompletion(
  prompt: string,
  systemPrompt: string,
  baseUrl?: string,
  model?: string
): Promise<string> {
  const settings = !baseUrl || !model ? await getSettings() : { ollamaBaseUrl: baseUrl, ollamaModel: model };
  const url = settings.ollamaBaseUrl || DEFAULT_BASE_URL;
  const selectedModel = settings.ollamaModel || 'llama3';

  const res = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: selectedModel,
      prompt,
      system: systemPrompt,
      stream: false,
      options: {
        temperature: 0.3,
        num_ctx: 8192,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.response;
}

export async function* streamCompletion(
  prompt: string,
  systemPrompt: string,
  baseUrl?: string,
  model?: string
): AsyncGenerator<string> {
  const url = baseUrl || DEFAULT_BASE_URL;
  const selectedModel = model || 'llama3';

  const res = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: selectedModel,
      prompt,
      system: systemPrompt,
      stream: true,
      options: {
        temperature: 0.3,
        num_ctx: 8192,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.statusText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.response) {
          yield json.response;
        }
      } catch {
        // skip malformed lines
      }
    }
  }
}

// ─── Prompt Templates ───────────────────────────────────────────────

const SCORING_SYSTEM_PROMPT = `Act as a premier Applicant Tracking System (ATS) strategist specializing in executive-level placement. Your objective is to perform a rigorous semantic gap analysis by comparing a resume against a job description, evaluating not only keyword frequency but also the depth of competency and alignment with the strategic requirements of the role. You must output your findings strictly in valid JSON format, containing a numerical 'score' (0-100) based on hierarchical matching, an array of 'matchedKeywords' that demonstrate direct alignment, and an array of 'missingKeywords' prioritized by their impact on candidate viability. Furthermore, provide a 'suggestions' array containing actionable, high-level advice on how to reframe existing experiences or quantify achievements to better satisfy the job's core KPIs. Your scoring must follow a strict rubric: 90-100 for near-perfect alignment across all critical domains, 70-89 for strong matches with minor technical gaps, 50-69 for moderate matches requiring significant optimization, 30-49 for weak matches with fundamental misalignments, and 0-29 for poor matches. Do not include any text, headers, or explanations outside of the JSON object`;

const REWRITE_SYSTEM_PROMPT = `Act as a master executive resume strategist specializing in ATS-algorithmic alignment and high-stakes recruitment. Your objective is to re-engineer resume bullet points into high-impact achievement statements that bridge the gap between a candidate's history and a specific job description. You must output your results strictly in valid JSON format containing an array of 'bullets'—each including the 'original' text, the 'optimized' version, and a 'relevance' rating of high, medium, or low. The optimized content must adhere to a rigorous achievement-oriented framework, utilizing high-precision verbs that imply leadership and strategic ownership while seamlessly integrating keywords from the job description without compromising narrative flow. You are required to prioritize quantifiable outcomes and contextualize metrics to demonstrate the scale and complexity of the candidate's impact. Every rewritten bullet must be concise, grammatically flawless, and strictly in the active voice, ensuring that factual accuracy is maintained while elevating the professional tone to a global executive standard. Do not include any text, explanations, or markdown outside of the JSON object`;

const COVER_LETTER_SYSTEM_PROMPT = `Act as a premier executive communications strategist and master storyteller specializing in high-impact career narratives. Your task is to compose a sophisticated, three-paragraph cover letter that functions as a persuasive business case, seamlessly connecting a candidate’s professional trajectory to the specific strategic needs of the hiring organization. The opening paragraph must eschew generic pleasantries in favor of a compelling value proposition that demonstrates deep institutional knowledge and immediate alignment with the company’s mission. The second paragraph must synthesize two to three signature achievements from the resume, transforming them into a narrative of proven impact that addresses the core challenges identified in the job description. The final paragraph should project executive presence, articulating a forward-looking vision for the role and concluding with a decisive, professional call to action. Maintain a tone of 'sophisticated peer-level discourse'—authoritative yet accessible—while utilizing a high-precision vocabulary and eliminating all industry clichés. Ensure the final output is bespoke, intellectually rigorous, and devoid of any meta-commentary or AI markers`;

export async function analyzeGap(resume: string, jobDescription: string): Promise<GapAnalysis> {
  const prompt = `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nAnalyze this resume against the job description and provide the gap analysis as JSON.`;

  const response = await generateCompletion(prompt, SCORING_SYSTEM_PROMPT);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch {
    return {
      score: 0,
      matchedKeywords: [],
      missingKeywords: [],
      suggestions: ['Failed to parse AI response. Please try again.'],
    };
  }
}

export async function optimizeBullets(resume: string, jobDescription: string): Promise<OptimizedBullet[]> {
  const prompt = `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nRewrite the resume bullet points to better match the job description. Return JSON.`;

  const response = await generateCompletion(prompt, REWRITE_SYSTEM_PROMPT);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.bullets || [];
    }
    const parsed = JSON.parse(response);
    return parsed.bullets || [];
  } catch {
    return [];
  }
}

export async function generateCoverLetter(resume: string, jobDescription: string, company: string, jobTitle: string): Promise<string> {
  const prompt = `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nCOMPANY: ${company}\nJOB TITLE: ${jobTitle}\n\nWrite a professional cover letter.`;

  return generateCompletion(prompt, COVER_LETTER_SYSTEM_PROMPT);
}
