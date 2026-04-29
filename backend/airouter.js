const axios = require("axios");

// ===============================
// 🔑 ADD YOUR API KEYS HERE
// ===============================
const OPENAI_KEY = "YOUR_OPENAI_KEY";
const CLAUDE_KEY = "YOUR_CLAUDE_KEY";
const GEMINI_KEY = "YOUR_GEMINI_KEY";

// ===============================
// 🧠 MAIN FUNCTION
// ===============================
async function answerQuestionsAI({ questions, resume, memory }) {
  const answers = {};

  for (let q of questions) {
    try {
      const ans = await routeQuestion(q, resume, memory);
      answers[q] = ans;
    } catch (err) {
      console.error("AI error:", err.message);
      answers[q] = "";
    }
  }

  return answers;
}

// ===============================
// 🧭 ROUTER LOGIC
// ===============================
async function routeQuestion(question, resume, memory) {
  const lower = question.toLowerCase();

  // ===== 1. MEMORY MATCH =====
  for (let key in memory) {
    if (lower.includes(key.toLowerCase())) {
      return memory[key];
    }
  }

  // ===== 2. SIMPLE RULES (CHEAP) =====
  if (lower.includes("name")) return resume.name;
  if (lower.includes("email")) return resume.email;
  if (lower.includes("phone")) return resume.phone;
  if (lower.includes("skill")) return (resume.skills || []).join(", ");
  if (lower.includes("relocate")) return "Yes";
  if (lower.includes("authorized")) return "Yes";

  // ===== 3. USE GEMINI (CHEAP AI) =====
  const gemini = await callGemini(question, resume, memory);
  if (gemini && gemini !== "NEEDS_USER_INPUT") return gemini;

  // ===== 4. USE OPENAI =====
  const openai = await callOpenAI(question, resume, memory);
  if (openai && openai !== "NEEDS_USER_INPUT") return openai;

  // ===== 5. USE CLAUDE (BEST QUALITY) =====
  const claude = await callClaude(question, resume, memory);
  if (claude) return claude;

  return "";
}

// ===============================
// 🤖 GEMINI
// ===============================
async function callGemini(question, resume, memory) {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: buildPrompt(question, resume, memory)
              }
            ]
          }
        ]
      }
    );

    return res.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (err) {
    return "";
  }
}

// ===============================
// 🤖 OPENAI
// ===============================
async function callOpenAI(question, resume, memory) {
  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: buildPrompt(question, resume, memory)
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`
        }
      }
    );

    return res.data.choices?.[0]?.message?.content || "";
  } catch (err) {
    return "";
  }
}

// ===============================
// 🤖 CLAUDE
// ===============================
async function callClaude(question, resume, memory) {
  try {
    const res = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: buildPrompt(question, resume, memory)
          }
        ]
      },
      {
        headers: {
          "x-api-key": CLAUDE_KEY,
          "anthropic-version": "2023-06-01"
        }
      }
    );

    return res.data.content?.[0]?.text || "";
  } catch (err) {
    return "";
  }
}

// ===============================
// 🧠 PROMPT BUILDER
// ===============================
function buildPrompt(question, resume, memory) {
  return `
You are filling a job application form.

STRICT RULES:
- Use ONLY the provided resume + memory
- Do NOT hallucinate or create fake experience
- If unsure, reply EXACTLY: NEEDS_USER_INPUT
- Keep answers short and form-friendly

Resume:
${JSON.stringify(resume)}

Past Answers:
${JSON.stringify(memory)}

Question:
${question}

Answer:
`;
}

// ===============================
module.exports = { answerQuestionsAI };