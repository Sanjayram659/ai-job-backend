const axios = require("axios");

const OPENAI_KEY = "YOUR_OPENAI_KEY";

// ===============================
// 🧠 MAIN FUNCTION
// ===============================
async function tailorResume({ resume, jobDesc }) {
  const prompt = `
You are an expert resume optimizer.

STRICT RULES:
- Use ONLY the given resume data
- DO NOT invent fake experience
- Improve wording and alignment with job description
- Add relevant keywords from job description
- Keep it ATS-friendly

Resume:
${resume.raw}

Job Description:
${jobDesc}

Output: Improved resume
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
    console.error("Resume AI error:", err.message);
    return resume.raw;
  }
}

module.exports = { tailorResume };