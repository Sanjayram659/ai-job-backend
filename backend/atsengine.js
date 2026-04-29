const axios = require("axios");

const OPENAI_KEY = "YOUR_OPENAI_KEY";

// ===============================
// 📊 ATS SCORE
// ===============================
async function checkATS({ resumeText, jobDesc }) {
  const prompt = `
You are an ATS checker.

Analyze resume vs job description.

Return JSON ONLY:
{
  "score": number (0-100),
  "missing_keywords": [],
  "improvements": []
}

Resume:
${resumeText}

Job Description:
${jobDesc}
`;

  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`
        }
      }
    );

    const text = res.data.choices[0].message.content;

    return JSON.parse(text);
  } catch (err) {
    console.error("ATS error:", err.message);
    return {
      score: 50,
      missing_keywords: [],
      improvements: []
    };
  }
}

// ===============================
// 🔁 IMPROVE RESUME
// ===============================
async function improveResume({ resumeText, jobDesc, feedback }) {
  const prompt = `
Improve resume based on ATS feedback.

Rules:
- Do NOT add fake experience
- Only improve wording
- Add missing keywords naturally

Resume:
${resumeText}

Job:
${jobDesc}

Feedback:
${JSON.stringify(feedback)}

Output improved resume
`;

  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`
        }
      }
    );

    return res.data.choices[0].message.content;
  } catch (err) {
    console.error("Improve error:", err.message);
    return resumeText;
  }
}

module.exports = { checkATS, improveResume };