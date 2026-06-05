export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resumeText, jd } = req.body;

  if (!resumeText) {
    return res.status(400).json({ error: 'Resume text is required' });
  }

  const prompt = `You are an elite ATS and recruiter evaluation engine. Analyze this resume using strict recruiter-grade logic. Score conservatively — do NOT inflate scores.

RESUME TEXT:
"""
${resumeText.slice(0, 6000)}
"""

JOB DESCRIPTION:
"""
${jd ? jd.slice(0, 3000) : 'No job description provided. Perform a general resume quality analysis across all dimensions based on the resume content alone. Infer the likely target role from the resume and score accordingly.'}
"""

SCORING WEIGHTS:
- Keyword Match: 25%
- Skills Match: 15%
- Experience Relevance: 20%
- Impact Metrics: 10%
- Projects Match: 10%
- Education: 5%
- ATS Formatting: 5%
- Recruiter Readability: 5%
- Leadership Signals: 5%

SCORE SCALE: 100=Exceptional, 90-99=Strong, 80-89=Competitive, 70-79=Interview Possible, 60-69=Significant Gaps, <60=Unlikely to Pass ATS

Return ONLY valid JSON in exactly this structure (no markdown, no extra text):
{
  "overallScore": 0,
  "atsScore": 0,
  "recruiterScore": 0,
  "interviewProbability": "48%",
  "resumeStrength": "B+",
  "keywordAnalysis": {
    "score": 0,
    "totalFound": 0,
    "totalInJD": 0,
    "coveragePct": "0%",
    "matchedKeywords": [],
    "partialKeywords": [],
    "missingKeywords": [],
    "criticalMissing": [],
    "byCategory": [
      {"name": "Technical Skills", "pct": 0},
      {"name": "Soft Skills", "pct": 0},
      {"name": "Domain Terms", "pct": 0},
      {"name": "Role-Specific", "pct": 0}
    ]
  },
  "skillsRadar": {
    "score": 0,
    "resume": [0,0,0,0,0,0],
    "required": [0,0,0,0,0,0],
    "labels": ["Technical","Leadership","Communication","Domain","Architecture","Delivery"]
  },
  "experienceAnalysis": {
    "score": 0,
    "strengths": [],
    "gaps": []
  },
  "impactAnalysis": {
    "score": 0,
    "items": [
      {"label": "Example Impact", "value": 0}
    ]
  },
  "formattingAnalysis": {
    "score": 0,
    "checks": [
      {"name": "Headers", "status": "green", "desc": ""},
      {"name": "Section Order", "status": "green", "desc": ""},
      {"name": "Tables/Columns", "status": "orange", "desc": ""},
      {"name": "Images/Icons", "status": "green", "desc": ""},
      {"name": "Fonts", "status": "green", "desc": ""}
    ]
  },
  "sectionScores": [
    {"label": "Summary", "score": 0},
    {"label": "Experience", "score": 0},
    {"label": "Projects", "score": 0},
    {"label": "Skills", "score": 0},
    {"label": "Education", "score": 0},
    {"label": "Formatting", "score": 0},
    {"label": "Certs", "score": 0}
  ],
  "recruiterFeedback": {
    "likes": "",
    "questions": "",
    "topAchievement": "",
    "biggestRisk": ""
  },
  "recommendations": {
    "high": [],
    "medium": [],
    "low": []
  }
}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4000,
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.error?.message || 'Gemini API error' });
    }

    const data = await response.json();
    const raw = data.candidates[0].content.parts[0].text;
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Analysis error:', err);
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
}
