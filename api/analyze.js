export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resumeText, jd } = req.body;

  if (!resumeText) {
    return res.status(400).json({ error: 'Resume text is required' });
  }

  const prompt = `You are a professional ATS resume scoring engine used by top recruiters. Your job is to carefully read the resume and job description below, then produce a thorough, accurate evaluation.

RESUME:
"""
${resumeText.slice(0, 6000)}
"""

JOB DESCRIPTION:
"""
${jd ? jd.slice(0, 3000) : 'No job description provided. Analyze the resume on its own merit. Infer the target role from the resume content and score accordingly.'}
"""

INSTRUCTIONS:
1. Read the entire resume carefully before scoring anything
2. Score each dimension based on ACTUAL content you find in the resume
3. Be realistic and fair — a solid professional resume should score between 65-85
4. Only give low scores (below 50) if content is genuinely missing or irrelevant
5. Only give high scores (above 85) if the resume is truly exceptional and closely matches the JD
6. Fill ALL text fields with specific observations from the actual resume — never leave them empty
7. For matchedKeywords, list actual words/phrases found in both resume and JD
8. For criticalMissing, list important JD keywords completely absent from the resume
9. For impactAnalysis items, find real metrics/numbers from the resume (percentages, dollar amounts, team sizes etc)
10. For recruiterFeedback, write specific sentences referencing actual content from the resume

SCORING WEIGHTS:
- Keyword Match: 25% — how many JD keywords appear in the resume
- Skills Match: 15% — technical and soft skills alignment
- Experience Relevance: 20% — years, domain, role similarity
- Impact Metrics: 10% — quantified achievements with numbers
- Projects Match: 10% — project relevance to the role
- Education: 5% — degree and institution relevance
- ATS Formatting: 5% — clean parseable structure
- Recruiter Readability: 5% — clear, well-written content
- Leadership Signals: 5% — ownership, mentoring, decision-making evidence

Return your analysis as a single JSON object. No markdown, no explanation, no code fences. Start with { and end with }.

Use this exact structure and replace ALL placeholder values with your real analysis:

{
  "overallScore": <weighted average 0-100 based on actual resume quality>,
  "atsScore": <ATS keyword and formatting score 0-100>,
  "recruiterScore": <human appeal and readability score 0-100>,
  "interviewProbability": "<realistic percentage like 45% or 72%>",
  "resumeStrength": "<letter grade A/B/C/D/F with + or ->",
  "keywordAnalysis": {
    "score": <0-100>,
    "totalFound": <count of JD keywords found in resume>,
    "totalInJD": <total keywords extracted from JD>,
    "coveragePct": "<percentage like 68%>",
    "matchedKeywords": ["<real keyword 1>", "<real keyword 2>"],
    "partialKeywords": ["<partially matched keyword>"],
    "missingKeywords": ["<missing keyword 1>"],
    "criticalMissing": ["<most important missing keyword>"],
    "byCategory": [
      {"name": "Technical Skills", "pct": <0-100>},
      {"name": "Soft Skills", "pct": <0-100>},
      {"name": "Domain Terms", "pct": <0-100>},
      {"name": "Role-Specific", "pct": <0-100>}
    ]
  },
  "skillsRadar": {
    "score": <0-100>,
    "resume": [<Technical 0-100>, <Leadership 0-100>, <Communication 0-100>, <Domain 0-100>, <Architecture 0-100>, <Delivery 0-100>],
    "required": [<Technical 0-100>, <Leadership 0-100>, <Communication 0-100>, <Domain 0-100>, <Architecture 0-100>, <Delivery 0-100>],
    "labels": ["Technical", "Leadership", "Communication", "Domain", "Architecture", "Delivery"]
  },
  "experienceAnalysis": {
    "score": <0-100>,
    "strengths": ["<specific strength from resume>", "<another strength>"],
    "gaps": ["<specific gap>", "<another gap>"]
  },
  "impactAnalysis": {
    "score": <0-100>,
    "items": [
      {"label": "<metric name from resume>", "value": <numeric value>}
    ]
  },
  "formattingAnalysis": {
    "score": <0-100>,
    "checks": [
      {"name": "Headers", "status": "<green/orange/red>", "desc": "<specific observation>"},
      {"name": "Section Order", "status": "<green/orange/red>", "desc": "<specific observation>"},
      {"name": "Tables/Columns", "status": "<green/orange/red>", "desc": "<specific observation>"},
      {"name": "Images/Icons", "status": "<green/orange/red>", "desc": "<specific observation>"},
      {"name": "Fonts", "status": "<green/orange/red>", "desc": "<specific observation>"}
    ]
  },
  "sectionScores": [
    {"label": "Summary", "score": <0-100>},
    {"label": "Experience", "score": <0-100>},
    {"label": "Projects", "score": <0-100>},
    {"label": "Skills", "score": <0-100>},
    {"label": "Education", "score": <0-100>},
    {"label": "Formatting", "score": <0-100>},
    {"label": "Certs", "score": <0-100 or 0 if no certs>}
  ],
  "recruiterFeedback": {
    "likes": "<2-3 sentences about what stands out positively in this specific resume>",
    "questions": "<2-3 sentences about what a recruiter would question or want clarified>",
    "topAchievement": "<the single most impressive specific thing in this resume>",
    "biggestRisk": "<the single biggest concern a recruiter would have>"
  },
  "recommendations": {
    "high": ["<most urgent specific improvement>", "<second urgent improvement>"],
    "medium": ["<important but not urgent improvement>", "<another medium priority>"],
    "low": ["<nice to have improvement>"]
  }
}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8000
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: errText });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'No valid JSON in response', raw: cleaned.slice(0, 500) });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Analysis error:', err);
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
}
