import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Allow route handler to run up to 300 seconds on supported serverless platforms
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

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
  'optimize': `You are an elite Applicant Tracking System (ATS) optimization specialist, executive resume architect, and Staff Engineering Leader.
Your mission is to optimize the candidate's resume content to achieve a 95%+ ATS match score against the provided Job Description, outranking competing candidates in enterprise ATS algorithms (Workday, Greenhouse, Lever, Taleo) while creating an exceptionally impressive, high-caliber impression on hiring managers and CTOs.

CORE ATS OPTIMIZATION MANDATES:

1. PROFESSIONAL SUMMARY (ELITE EXECUTIVE & TECHNICAL IMPACT STANDARD):
   - CRAFT AN IMPRESSIVE, COMPELLING SUMMARY: Never write a dry, bland, or cookie-cutter summary. It must immediately establish the candidate as a top-tier engineer, technical leader, and strategic problem-solver.
   - SENTENCE 1 (THE POWER HOOK & LEADERSHIP IDENTITY): Open with high authority, matching the exact target role/seniority level. State total years of experience, core engineering specialization, and high-stakes problem-solving capacity (e.g., "High-impact Senior Software Engineer & Technical Lead with 6+ years of experience architecting distributed, mission-critical systems and high-throughput web platforms.").
   - SENTENCE 2 (DEEP TECHNICAL RELEVANCE TO JD): Showcase deep mastery across the exact architectural pillars and core technologies demanded in the Job Description (e.g., full-stack React/Next.js, TypeScript, cloud-native microservices, GraphQL/REST APIs, real-time data streaming, and scalable database systems).
   - SENTENCE 3 (QUANTIFIABLE ENGINEERING & BUSINESS TRIUMPHS): Highlight concrete, metric-driven achievements pulled directly from the candidate's background (e.g., reducing API response times by 30-40%, boosting user engagement by 20%, accelerating transaction throughput, driving 90%+ client retention).
   - SENTENCE 4 (COLLABORATIVE VELOCITY & ARCHITECTURAL INTEGRITY): Close with the candidate's ability to drive zero-to-one product velocity, establish engineering best practices, mentor high-performing teams, and ensure enterprise-grade security and data isolation.
   - TONE: Confident, sophisticated, impactful, and commanding. Strictly ban empty filler words ("passionate", "detail-oriented", "hardworking", "motivated", "results-driven").

2. EXPERIENCE BULLET POINTS (THE GOOGLE XYZ & STAR FORMULA):
   - Rewrite EVERY bullet using the formula: [High-Power Action Verb] + [Context & Specific Technical Deliverable with JD Keywords] + [Quantifiable Metric / Measurable Outcome].
   - Examples of high-power verbs: Architected, Engineered, Spearheaded, Orchestrated, Optimized, Deployed, Automated, Scaled, Streamlined.
   - Seamlessly integrate critical keywords from the JD (technologies, architectures, cloud platforms, methodologies) directly into the bullets where technically truthful to the candidate's domain.
   - Sharpen quantifiable metrics (% reduction in API latency, % increase in user retention, transaction throughput, sprint velocity, uptime, load time drops).
   - Preserve real companies, roles, and project facts — do not invent fictional employers or degrees.

You MUST respond with ONLY valid JSON in this exact structure, with no surrounding markdown or extra text:
{
  "optimizedSummary": "The rewritten impressive, high-density executive ATS professional summary...",
  "bullets": [
    {
      "original": "exact or key original bullet text",
      "optimized": "The ATS-optimized, metric-driven replacement bullet incorporating JD keywords",
      "relevance": "high"
    }
  ]
}

Rules:
- Mark relevance as "high", "medium", or "low".
- Optimize each bullet from the candidate's experience to maximize ATS keyword relevance and impact.
- Keep output strictly parseable JSON.`,
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

Output only the RAW message text. DO NOT wrap it in JSON, DO NOT use Markdown code blocks, and DO NOT use any subject lines. Just the person-to-person message content.`,
  'qa-chat': `Act as the job candidate. You have the candidate's full resume and the job description as context.

Answer application and interview questions in FIRST PERSON as the candidate — specific, confident, and human-sounding.
Act as a sophisticated executive candidate with an Ivy League background, delivering responses in the first person with precision, authority, and intellectual rigor. You must provide direct answers without any meta-commentary, introductory fluff, or AI-based disclaimers, starting immediately with the most impactful information. For behavioral questions, utilize a STAR-Impact framework that emphasizes strategic intent and measurable results, ensuring that any data or achievements drawn from the resume are contextualized within the broader challenges of the role. Maintain a natural yet elevated tone by employing a diverse lexicon of high-precision verbs and varying sentence structures to create a professional rhythm; use contractions sparingly only to enhance conversational flow, and ensure every response is scaled in length to the complexity of the inquiry while remaining entirely devoid of filler.`,
  'polish-star': `You are an elite executive career coach and technical storytelling specialist.
Transform the candidate's raw notes, achievements, or project summary into a high-impact, publication-grade STAR (Situation, Task, Action, Result) narrative formatted for behavioral interviews and application essays.

STRUCTURE:
Situation: Concise description of the business context, engineering challenge, or high-stakes scenario.
Task: The exact strategic objective, ownership scope, and responsibility assigned to the candidate.
Action: Concrete, high-power technical decisions, tools/technologies used, leadership actions, and problem-solving execution.
Result: Quantifiable business outcome, metrics (percentages, latency, throughput, dollars, retention), and broader organizational impact.

Rules:
- Write in confident first-person ("I").
- Use powerful action verbs (Architected, Spearheaded, Optimized, Orchestrated).
- Highlight concrete metrics and deliverables.
- Keep output cleanly structured with Situation, Task, Action, and Result.
- Output only the polished STAR narrative without meta-commentary or conversational filler.`
};

async function fetchWithFailover(urlPath: string, options: RequestInit, preferredUrl: string): Promise<Response> {
  const urls = [preferredUrl];
  // Logic to flip between 127.0.0.1 and localhost
  const altUrl = preferredUrl.includes('127.0.0.1')
    ? preferredUrl.replace('127.0.0.1', 'localhost')
    : preferredUrl.includes('localhost')
      ? preferredUrl.replace('localhost', '127.0.0.1')
      : null;

  if (altUrl && altUrl !== preferredUrl) urls.push(altUrl);

  let lastError: any;
  for (const baseUrl of urls) {
    try {
      const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const fullUrl = `${normalizedBase}${urlPath}`;

      const timeoutSignal = AbortSignal.timeout(300000); // 300 seconds
      const combinedOptions: RequestInit = {
        ...options,
        signal: options.signal || timeoutSignal,
      };

      const res = await fetch(fullUrl, combinedOptions);
      return res;
    } catch (e: any) {
      lastError = e;
      // If it's a connection error or timeout, try the next URL
      continue;
    }
  }
  throw lastError;
}

async function getActualModel(url: string, preferredModel: string): Promise<string> {
  try {
    const res = await fetchWithFailover('/api/tags', { method: 'GET' }, url);
    if (!res.ok) return preferredModel;

    const data = await res.json();
    const models = data.models || [];
    if (models.length === 0) return preferredModel;

    const modelNames = models.map((m: any) => m.name);

    // 1. Exact match
    if (modelNames.includes(preferredModel)) return preferredModel;

    // 2. Fuzzy match (e.g. llama3 matches llama3:8b)
    const baseName = preferredModel.split(':')[0];
    const fuzzyMatch = modelNames.find((name: string) => name.startsWith(baseName));
    if (fuzzyMatch) return fuzzyMatch;

    // 3. Fallback to first available model
    return modelNames[0];
  } catch (e) {
    return preferredModel;
  }
}

export async function POST(request: Request) {
  try {
    const {
      resume,
      jobDescription,
      action,
      company,
      jobTitle,
      extraInfo,
      recruiterName,
      messages,
      baseUrl,
      model,
      candidateName,
      candidateEmail,
      candidatePhone,
      candidateLocation,
      candidateWebsite,
      candidateLinkedin,
      stories,
      stream: clientStream,
    } = await request.json();

    let settingsObj = null;
    let actionConfig: Record<string, { model?: string; prompt?: string }> = {};
    try {
      settingsObj = await prisma.settings.findUnique({ where: { id: 'default' } });
      if (settingsObj?.actionConfig) {
        actionConfig = JSON.parse(settingsObj.actionConfig);
      }
    } catch (dbErr) {
      console.warn('Could not read settings from DB (using defaults / client params):', (dbErr as any)?.message || dbErr);
    }

    let resolvedStories: Array<{ title: string; category?: string; content: string }> = Array.isArray(stories) ? stories.slice(0, 2) : [];
    if (resolvedStories.length === 0 && (action === 'cover-letter' || action === 'qa-chat' || action === 'optimize')) {
      try {
        resolvedStories = await prisma.storyBankItem.findMany({ take: 2, orderBy: { createdAt: 'desc' } });
      } catch (err) {
        console.warn('Could not load StoryBankItems from DB:', err);
      }
    }

    const storiesText = resolvedStories.length > 0
      ? resolvedStories.map((s, idx) => `STORY #${idx + 1} [${s.category || 'General'}]: ${s.title}\n${s.content}`).join('\n\n')
      : '';

    const ollamaUrl = baseUrl || settingsObj?.ollamaBaseUrl || 'http://127.0.0.1:11434';

    // Normalize model name - prioritize client request, then sector override, then global default
    let ollamaModel = (model || actionConfig[action]?.model || settingsObj?.ollamaModel || 'llama3').trim();
    if (!ollamaModel) ollamaModel = 'llama3';

    // Verify model exists in Ollama, fallback if missing
    const actualModel = await getActualModel(ollamaUrl, ollamaModel);
    const wasRedirected = actualModel !== ollamaModel;
    const finalModel = actualModel;

    // Debug logging to a file
    try {
      const logPath = path.join(process.cwd(), 'ai-debug.log');
      const logEntry = `[${new Date().toISOString()}] Action: ${action} | Input: "${model}" | Resolved: "${ollamaModel}" | Final: "${finalModel}"${wasRedirected ? ' (REDIRECTED)' : ''} | URL: ${ollamaUrl}\n`;
      fs.appendFileSync(logPath, logEntry);
    } catch (logErr) {
      console.error('Failed to write to debug log:', logErr);
    }

    let systemPrompt = actionConfig[action]?.prompt || defaultPrompts[action] || '';
    let prompt = '';

    switch (action) {
      case 'analyze': {
        prompt = `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nAnalyze this resume against the job description. Return ONLY JSON.`;
        break;
      }

      case 'optimize': {
        prompt = `CANDIDATE RESUME:
${resume}
${storiesText ? `\nVERIFIED CANDIDATE ACCOMPLISHMENTS (STORY BANK):\n${storiesText}\n` : ''}
TARGET JOB DESCRIPTION:
${jobDescription}
${company ? `TARGET COMPANY: ${company}\n` : ''}${jobTitle ? `TARGET ROLE: ${jobTitle}\n` : ''}

TASK:
1. Craft an exceptionally impressive, authoritative, and compelling Professional Summary (3-4 sentences) that immediately highlights the candidate as a senior-tier engineering powerhouse, weaves in the exact core technologies and architectural pillars from the Job Description, and features quantifiable metrics and leadership scope.
2. Rewrite each relevant experience bullet point using the Google XYZ formula ([Action Verb] + [Technical Deliverable with JD Keywords] + [Measurable Metric]).

Return ONLY valid JSON.`;
        break;
      }

      case 'cover-letter': {
        const currentDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const cName = (candidateName || '').trim() || 'Emmanuel Giwa';
        const contactItems = [
          candidateLocation,
          candidatePhone,
          candidateEmail,
          candidateWebsite,
          candidateLinkedin,
        ].filter(Boolean);
        const contactLine = contactItems.join(' | ');
        const targetCompany = company?.trim() || 'the Company';
        const targetTitle = jobTitle?.trim() || 'Software Engineer';
        const salutation = recruiterName?.trim()
          ? `Dear ${recruiterName.trim()},`
          : `Dear ${targetCompany} Hiring Team,`;

        prompt = `CANDIDATE PROFILE:
Name: ${cName}
Contact Details: ${contactLine}
Current Date: ${currentDate}

TARGET OPPORTUNITY:
Target Company: ${targetCompany}
Target Role: ${targetTitle}
Salutation to Use: ${salutation}

CANDIDATE MASTER RESUME:
${resume}
${storiesText ? `\nCANDIDATE STORY BANK / VERIFIED STAR ACCOMPLISHMENTS:\n${storiesText}\n` : ''}
TARGET JOB DESCRIPTION:
${jobDescription}

TASK:
Write an authoritative, publication-ready Harvard Standard Cover Letter for ${cName} applying for ${targetTitle} at ${targetCompany}.

LETTER STRUCTURE TO FOLLOW STRICTLY:
${cName}
${contactLine}

${currentDate}

Hiring Team
${targetCompany}

${salutation}

[Opening Paragraph: Clear statement of the position, candidate's senior technical profile and years of experience, and a compelling strategic value proposition for ${targetCompany}.]

[Body Paragraph 1 - Technical Impact & Evidence: 2-3 specific, metric-backed achievements from the resume and Story Bank accomplishments such as latency reductions, load time optimizations, or system architecture, directly aligned with the core technical stack and requirements from the Job Description.]

[Body Paragraph 2 - Systems, Velocity & Execution: How the candidate drives engineering velocity, async-first collaboration, architectural scalability, and mentorship to solve ${targetCompany}'s challenges from day one.]

[Closing Paragraph: Reiterate alignment with ${targetCompany}'s mission, invite an interview to discuss how candidate's background supports their roadmap, and conclude with "Thank you for your time and consideration."]

Sincerely,

${cName}

MANDATORY RULES:
- DO NOT use markdown headers (#, ##, ###), bold section labels, bullet points, or horizontal rules.
- Under NO circumstances output empty headers or "### ".
- Do NOT ask rhetorical or interrogation questions to the hiring manager.
- Output ONLY the formatted letter. No preamble, no conversational intro.`;
        break;
      }

      case 'linkedin-message': {
        const recruiterGreeting = recruiterName ? `Hi ${recruiterName},` : 'Hi,';
        systemPrompt = systemPrompt.replace('the recruiter greeting provided', recruiterGreeting);
        prompt = `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nCOMPANY CONTEXT: ${extraInfo || 'Not provided'}\nCOMPANY: ${company}\nJOB TITLE: ${jobTitle}\nRECRUITER GREETING: ${recruiterGreeting}\n\nWrite the LinkedIn message now.`;
        break;
      }

      case 'qa-chat': {
        systemPrompt = `Act as the job candidate. You have the candidate's full resume and the job description as context.

Answer application and interview questions in FIRST PERSON as the candidate — specific, confident, and human-sounding.
- Draw on real achievements, numbers, and STAR stories from both the resume and the Story Bank wherever relevant.
- Match answer length to question complexity: short factual answers get 2-3 sentences; behavioural questions get a structured but conversational response.
- Never say "As an AI", "Based on the resume", or any meta-commentary. Just answer directly as the person.
- No fluff openers like "Great question!" or "Certainly!".
- Use natural English — contractions are fine.`;

        // Build conversation history from messages array
        const history = (messages || []) as { role: string; content: string }[];
        const historyText = history
          .map((m) => `${m.role === 'user' ? 'Question' : 'Answer'}: ${m.content}`)
          .join('\n\n');

        prompt = `RESUME:\n${resume}\n\n${storiesText ? `CANDIDATE STORY BANK / STAR STORIES:\n${storiesText}\n\n` : ''}JOB DESCRIPTION:\n${jobDescription}\n\nEXTRA COMPANY CONTEXT: ${extraInfo || 'Not provided'}\n\n${historyText ? `CONVERSATION SO FAR:\n${historyText}\n\n` : ''}Question: ${(messages || []).at(-1)?.content || ''}\n\nAnswer:`;
        break;
      }

      case 'scholarship-essay-draft': {
        const { questionPrompt, maxWords, track, storyBankItems, scholarshipName, organization } = await request.json().catch(() => ({}));
        systemPrompt = `You are an elite academic advisor and scholarship reviewer specializing in undergraduate fellowships and scholarships for ${track || 'STEM'} programs (with expertise in AI, Machine Learning, and Cybersecurity).
Your goal is to write a powerful, authentic, evidence-backed essay response in FIRST PERSON as the candidate.

RULES:
1. WORD LIMIT: Strictly observe the word limit of ${maxWords || 300} words. Aim for 90-98% of the maximum word count (do NOT exceed ${maxWords || 300} words).
2. EVIDENCE & STORY BANK: Use real metrics, technical projects, hackathons, lab experiments, and personal experiences provided in the Candidate Resume and Story Bank context.
3. DOMAIN FOCUS (${track || 'General'}):
   - If AI: Highlight mathematical/statistical foundations, machine learning projects (LLMs, PyTorch, Computer Vision), research curiosity, and ethical AI vision.
   - If Cybersecurity: Highlight security mindset, hands-on lab experience (CTFs, network analysis, security audits, cryptography), and commitment to protecting digital infrastructure.
   - If General STEM/Diversity: Focus on leadership, resilience, technical problem solving, and community impact.
4. TONE: Confident, articulate, intellectually curious, and driven. Avoid cliché openers like "Ever since I was a child..." or generic buzzwords.
5. Direct answer: Output ONLY the essay text in clean markdown.`;

        prompt = `SCHOLARSHIP PROGRAM: ${scholarshipName || 'Scholarship'} (${organization || 'Organization'})
TRACK: ${track || 'General'}
QUESTION PROMPT: ${questionPrompt}
MAX WORD COUNT: ${maxWords || 300} words

CANDIDATE RESUME SUMMARY:
${resume || 'Not provided'}

SELECTED STORY BANK & EXPERIENCE HIGHLIGHTS:
${storyBankItems || 'Not provided'}

Write the scholarship essay now:`;
        break;
      }

      case 'scholarship-essay-trim': {
        const { textToTrim, maxWords, track } = await request.json().catch(() => ({}));
        systemPrompt = `You are a precision editor for academic and technical scholarship essays. Your sole job is to rewrite and trim an essay so that it strictly fits within ${maxWords || 300} words while preserving all specific technical metrics, project details, and core narrative flow.

RULES:
1. Maximum word count: ${maxWords || 300} words.
2. Maintain first-person voice.
3. Keep technical depth and metrics.
4. Output ONLY the trimmed essay in clean markdown.`;

        prompt = `TARGET WORD COUNT: ${maxWords || 300} words
TRACK: ${track || 'General'}

ORIGINAL ESSAY:
${textToTrim}

Trimmed version:`;
        break;
      }

      case 'scholarship-essay-critique': {
        const { questionPrompt, essayText, track } = await request.json().catch(() => ({}));
        systemPrompt = `You are a scholarship selection committee chair reviewing undergraduate applications for ${track || 'STEM'} fellowships (including AI and Cybersecurity awards). Evaluate the essay and provide constructive critique.

Return ONLY valid JSON in this exact structure:
{
  "score": <number 0-100>,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`;

        prompt = `QUESTION PROMPT: ${questionPrompt}
TRACK: ${track || 'General'}

ESSAY TEXT:
${essayText}

Evaluate this response now. Return ONLY JSON.`;
        break;
      }

      case 'polish-star': {
        prompt = `STORY / ACCOMPLISHMENT TITLE: ${jobTitle || company || 'Career Accomplishment'}
CATEGORY: ${extraInfo || 'General'}

RAW NOTES & DRAFT CONTENT:
${resume || jobDescription || extraInfo}

TASK:
Transform the raw details above into a high-impact, professional STAR (Situation, Task, Action, Result) narrative. Use strong action verbs and highlight concrete metrics.`;
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const isJsonAction = action === 'analyze' || action === 'optimize' || action === 'scholarship-essay-critique';
    const isStreamAction = clientStream === true || action === 'cover-letter' || action === 'linkedin-message' || action === 'qa-chat' || action === 'scholarship-essay-draft' || action === 'scholarship-essay-trim' || action === 'polish-star';

    const res = await fetchWithFailover('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: finalModel,
        prompt,
        system: systemPrompt,
        stream: isStreamAction,
        format: isJsonAction ? 'json' : undefined,
        options: {
          temperature: 0.3,
          num_ctx: 2048,
          num_predict: isJsonAction ? 800 : undefined,
        },
      }),
    }, ollamaUrl);

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Ollama error: ${errText}` },
        { status: 502 }
      );
    }

    // For text tools, stream the response
    if (isStreamAction) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      return new NextResponse(
        new ReadableStream({
          async start(controller) {
            const reader = res.body?.getReader();
            if (!reader) {
              controller.close();
              return;
            }

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n').filter(Boolean);

              for (const line of lines) {
                try {
                  const parsed = JSON.parse(line);
                  if (parsed.response) {
                    controller.enqueue(encoder.encode(parsed.response));
                  }
                } catch (e) {
                  // Ignore parse errors for partial chunks
                }
              }
            }
            controller.close();
          },
        }),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    const data = await res.json();
    const response = data.response;

    // For analyze and optimize, parse JSON from response
    if (isJsonAction) {
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return NextResponse.json({ result: JSON.parse(jsonMatch[0]) });
        }
        return NextResponse.json({ result: JSON.parse(response) });
      } catch {
        return NextResponse.json({
          result: action === 'analyze'
            ? { score: 0, matchedKeywords: [], missingKeywords: [], suggestions: ['Failed to parse AI response. Please try again.'] }
            : { bullets: [], optimizedSummary: '' },
          raw: response,
        });
      }
    }

    let finalResult = response;

    // For LinkedIn message, strip potential JSON/Markdown artifacts
    if (action === 'linkedin-message') {
      try {
        // Attempt to parse if it's pure JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.message) finalResult = parsed.message;
          else if (parsed.content) finalResult = parsed.content;
          else if (parsed.text) finalResult = parsed.text;
        }
      } catch (e) { }

      // Strip markdown code blocks (e.g. ```markdown ... ```)
      finalResult = finalResult.replace(/```[a-z]*\n([\s\S]*?)\n```/g, '$1');
      // Strip horizontal lines often used as separators
      finalResult = finalResult.replace(/^---+$|^- - -+$/gm, '');
      // Final trim
      finalResult = finalResult.trim();
    }

    return NextResponse.json({ result: finalResult });
  } catch (error: any) {
    // Extensive logging for debugging
    const logPath = path.join(process.cwd(), 'ai-debug.log');
    const errorDetail = `[${new Date().toISOString()}] ERROR: ${error.name} | Code: ${error.code} | Msg: ${error.message}\nStack: ${error.stack}\n`;
    try {
      fs.appendFileSync(logPath, errorDetail);
    } catch (e) { }

    console.error('AI Error:', error);

    if (error.name === 'AbortError' || error.code === 'UND_ERR_HEADERS_TIMEOUT') {
      return NextResponse.json(
        { error: 'Ollama is taking too long to respond (Timeout). Try a smaller model or check your machine load.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: `Failed to connect to Ollama (${error.message || 'Network Error'}). Ensure Ollama is running.` },
      { status: 503 }
    );
  }
}
