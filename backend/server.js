require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const { tailorResume } = require("./resumeengine");
const { checkATS, improveResume } = require("./atsengine");
const { generateCoverLetter, generateEmail } = require("./coverletterengine");

const { searchJobs } = require("./jobSearchEngine");
const { sendEmail } = require("./emailEngine");
const { getValue, storeValue } = require("./memoryEngine");

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// 🧠 CACHE (API COST REDUCTION)
// ===============================
const cache = new Map();
const MAX_CACHE = 50;

// ===============================
// 📊 APPLICATION STORAGE
// ===============================
const applications = [];

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ===============================
// 🔍 JOB SEARCH (USER CONTROLLED)
// ===============================
app.post("/search-jobs", async (req, res) => {
  try {
    const { role, location } = req.body;

    if (!role) {
      return res.status(400).json({ error: "Role required" });
    }

    const jobs = await searchJobs({ role, location });
    res.json(jobs);

  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

// ===============================
// 🧠 BATCH FIELD MATCH (SMART)
// ===============================
app.post("/match-fields-batch", async (req, res) => {
  try {
    const { fields, resumeText } = req.body;

    let results = {};
    let missing = [];

    // 1️⃣ MEMORY FIRST
    fields.forEach(label => {
      const saved = getValue(label);
      if (saved) {
        results[label] = saved;
      } else {
        missing.push(label);
      }
    });

    // LIMIT → COST CONTROL
    missing = missing.slice(0, 15);

    // 2️⃣ AI ONLY FOR UNKNOWN
    if (missing.length > 0) {
      const prompt = `
Fill job form fields using resume ONLY.

Resume:
${resumeText}

Fields:
${missing.join("\n")}

Return JSON:
{"field":"answer"}
`;

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      let aiData = {};
      try {
        aiData = JSON.parse(response.data.choices[0].message.content);
      } catch {
        aiData = {};
      }

      // 3️⃣ SAVE MEMORY
      Object.entries(aiData).forEach(([k, v]) => {
        if (v) {
          storeValue(k, v);
          results[k] = v;
        }
      });
    }

    res.json({ values: results });

  } catch (err) {
    console.error("Batch match error:", err.message);
    res.json({ values: {} });
  }
});

// ===============================
// 💾 SAVE MEMORY (LEARNING)
// ===============================
app.post("/save-memory", (req, res) => {
  try {
    const data = req.body;

    Object.entries(data).forEach(([label, value]) => {
      if (label && value) {
        storeValue(label, value);
      }
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Memory save error:", err.message);
    res.status(500).json({ error: "Memory save failed" });
  }
});

// ===============================
// 📄 AUTO SELECT RESUME
// ===============================
app.post("/select-resume", (req, res) => {
  const { resumes, jobDesc } = req.body;

  const keys = Object.keys(resumes || {});
  if (keys.length === 0) {
    return res.json({ bestResume: null });
  }

  let bestKey = keys[0];
  let bestScore = 0;

  keys.forEach(key => {
    const text = resumes[key].raw.toLowerCase();
    let score = 0;

    jobDesc.toLowerCase().split(" ").forEach(word => {
      if (text.includes(word)) score++;
    });

    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  });

  res.json({ bestResume: resumes[bestKey] });
});

// ===============================
// 🧠 MAIN AI PROCESS
// ===============================
app.post("/process-job", async (req, res) => {
  try {
    const { jobDesc, resume } = req.body;

    if (!jobDesc || !resume) {
      return res.status(400).json({ error: "Missing data" });
    }

    const cacheKey = jobDesc.slice(0, 200);

    if (cache.has(cacheKey)) {
      console.log("⚡ Cache hit");
      return res.json(cache.get(cacheKey));
    }

    let tailored = await tailorResume({ resume, jobDesc });

    let ats = await checkATS({
      resumeText: tailored,
      jobDesc
    });

    if (ats.score < 75) {
      tailored = await improveResume({
        resumeText: tailored,
        jobDesc,
        feedback: ats
      });

      ats = await checkATS({
        resumeText: tailored,
        jobDesc
      });
    }

    let cover = "";
    if (jobDesc.toLowerCase().includes("cover")) {
      cover = await generateCoverLetter({
        resumeText: tailored,
        jobDesc
      });
    }

    const result = {
      resume: tailored,
      cover,
      ats
    };

    // LIMIT CACHE SIZE
    if (cache.size > MAX_CACHE) {
      cache.clear();
    }

    cache.set(cacheKey, result);

    res.json(result);

  } catch (err) {
    console.error("Process error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ===============================
// ✉️ GENERATE EMAIL
// ===============================
app.post("/generate-email", async (req, res) => {
  try {
    const { resumeText, jobDesc } = req.body;

    const email = await generateEmail({ resumeText, jobDesc });

    res.json({ email });

  } catch (err) {
    res.status(500).json({ error: "Email failed" });
  }
});

// ===============================
// 📧 SEND EMAIL
// ===============================
app.post("/send-email", async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    if (!to) {
      return res.status(400).json({ error: "Email required" });
    }

    const result = await sendEmail({ to, subject, text });

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: "Send failed" });
  }
});

// ===============================
// 📊 LOG APPLICATION (TRACKING)
// ===============================
app.post("/log-application", (req, res) => {
  const entry = {
    ...req.body,
    date: new Date(),
    id: Date.now()
  };

  applications.push(entry);

  res.json({ success: true });
});

// ===============================
// 📊 GET APPLICATIONS (DASHBOARD)
// ===============================
app.get("/applications", (req, res) => {
  res.json(applications);
});

// ===============================
// 📊 ATS ANALYTICS (NEW)
// ===============================
app.get("/stats", (req, res) => {
  const avgATS =
    applications.reduce((sum, a) => sum + (a.ats || 0), 0) /
    (applications.length || 1);

  res.json({
    total: applications.length,
    avgATS: Math.round(avgATS)
  });
});

// ===============================
// 🚀 PORT
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});