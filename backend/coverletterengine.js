const axios = require("axios");

const OPENAI_KEY = "YOUR_OPENAI_KEY";

// ===============================
// ✉️ GENERATE COVER LETTER
// ===============================
async function generateCoverLetter({ resumeText, jobDesc }) {
  const prompt = `
Write a professional cover letter.

Rules:
- Use ONLY resume data
- Align with job description
- Keep it concise (200–300 words)
- No fake claims

Resume:
${resumeText}

Job Description:
${jobDesc}

Output: Cover letter
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
    console.error("Cover letter error:", err.message);
    return "Cover letter generation failed.";
  }
}

module.exports = { generateCoverLetter };