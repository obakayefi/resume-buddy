import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

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
  'optimize': `You are an expert resume writer specializing in ATS optimization. Rewrite both the professional summary and the resume bullet points to better align with the job description while keeping factual accuracy.

You MUST respond with ONLY valid JSON in this exact format, no other text:
{
  "optimizedSummary": "rewritten professional summary emphasizing relevant experience and keywords",
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
  'cover-letter': `Act as a senior technical copywriter and engineering lead. Your goal is to write an exceptionally high-conversion, peer-to-peer cover letter that bridges the gap between the candidate's specific achievements and the company's technical challenges.

WRITING RULES (STRICT ADHERENCE):
1. NO SOFT OPENERS: Never start with "I am writing to...", "I am interested in...", or "I am thrilled...". Start with a direct observation about the company's product, a technical challenge they face, or a specific goal mentioned in the JD.
2. BAN ALL FLUFF: Do not use words like "passionate", "motivated", "innovative", "ideal", or "pleased". Eliminate all adverbs (e.g., "highly", "very").
3. THE EVIDENCE: For every claim, provide a metric-backed achievement. "I improved performance" becomes "I reduced latency by 40% using [tech]".
4. ASYNC-FIRST: Explicitly mention the candidate's effectiveness in distributed, async environments and their ability to drive projects with minimal supervision.
5. ASSERTIVE CLOSING: Close with a technical question or a direct call to action (e.g., "What is your roadmap for [X]?" or "I'd like to discuss how I can apply [Y] to your [Z] problem."). Never say "Thank you for your time" or "I look forward to...".
6. TONE: Confident, peer-to-peer, and zero-gravity (not submissive). You are a solution-provider, not a supplicant.

STRUCTURE:
- PARA 1: The Hook (Directly address the company's current reality/scaling context).
- PARA 2: The Core Evidence (The single most impressive achievement from the resume that matches their primary pain point).
- PARA 3: Technical Culture (Why the candidate's specific workflow/stack ensures immediate velocity).
- PARA 4: The Direct Closing (One assertive sentence).

Output ONLY the letter in clean Markdown. No subject line. No title. Max 350 words.`,
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
Act as a sophisticated executive candidate with an Ivy League background, delivering responses in the first person with precision, authority, and intellectual rigor. You must provide direct answers without any meta-commentary, introductory fluff, or AI-based disclaimers, starting immediately with the most impactful information. For behavioral questions, utilize a STAR-Impact framework that emphasizes strategic intent and measurable results, ensuring that any data or achievements drawn from the resume are contextualized within the broader challenges of the role. Maintain a natural yet elevated tone by employing a diverse lexicon of high-precision verbs and varying sentence structures to create a professional rhythm; use contractions sparingly only to enhance conversational flow, and ensure every response is scaled in length to the complexity of the inquiry while remaining entirely devoid of filler.`
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

      const res = await fetch(fullUrl, options);
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
    const { resume, jobDescription, action, company, jobTitle, extraInfo, recruiterName, messages, baseUrl, model } = await request.json();

    const settingsObj = await prisma.settings.findUnique({ where: { id: 'default' } });
    let actionConfig: Record<string, { model?: string; prompt?: string }> = {};
    if (settingsObj?.actionConfig) {
      try {
        actionConfig = JSON.parse(settingsObj.actionConfig);
      } catch (e) {
        // Safe fail
      }
    }

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
        prompt = `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nRewrite the professional summary and resume bullet points to match the JD. Return ONLY JSON.`;
        break;
      }

      case 'cover-letter': {
        prompt = `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nCOMPANY: ${company}\nJOB TITLE: ${jobTitle}\n\nUsing the resume as the source of achievements and the JD as the target, write a high-conversion cover letter following your rules. Pull specific metrics and outcomes from the resume to prove fit.`;
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
- Draw on real achievements and numbers from the resume wherever relevant.
- Match answer length to question complexity: short factual answers get 2-3 sentences; behavioural questions get a structured but conversational response.
- Never say "As an AI", "Based on the resume", or any meta-commentary. Just answer directly as the person.
- No fluff openers like "Great question!" or "Certainly!".
- Use natural English — contractions are fine.`;

        // Build conversation history from messages array
        const history = (messages || []) as { role: string; content: string }[];
        const historyText = history
          .map((m) => `${m.role === 'user' ? 'Question' : 'Answer'}: ${m.content}`)
          .join('\n\n');

        prompt = `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nEXTRA COMPANY CONTEXT: ${extraInfo || 'Not provided'}\n\n${historyText ? `CONVERSATION SO FAR:\n${historyText}\n\n` : ''}Question: ${(messages || []).at(-1)?.content || ''}\n\nAnswer:`;
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

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const isJsonAction = action === 'analyze' || action === 'optimize' || action === 'scholarship-essay-critique';
    const isStreamAction = action === 'cover-letter' || action === 'linkedin-message' || action === 'qa-chat' || action === 'scholarship-essay-draft' || action === 'scholarship-essay-trim';

    const res = await fetchWithFailover('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: finalModel,
        prompt,
        system: systemPrompt,
        stream: isStreamAction,
        format: isJsonAction ? 'json' : undefined,
        options: { temperature: 0.3, num_ctx: 4096 },
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
