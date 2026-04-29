require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { tailorResume } = require("./resumeengine");
const { checkATS, improveResume } = require("./atsengine");
const { generateCoverLetter } = require("./coverletterengine");

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// 🧠 CACHE (cost saving)
// ===============================
const cache = new Map();

// ===============================
// 📊 APPLICATION STORAGE (simple)
// ===============================
const applications = [];

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ===============================
// AUTO SELECT RESUME
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
// MAIN AI PROCESS
// ===============================
app.post("/process-job", async (req, res) => {
  try {
    const { jobDesc, resume } = req.body;

    if (!jobDesc || !resume) {
      return res.status(400).json({ error: "Missing data" });
    }

    const cacheKey = jobDesc.slice(0, 200);

    if (cache.has(cacheKey)) {
      console.log("⚡ Using cache");
      return res.json(cache.get(cacheKey));
    }

    // 1. Tailor resume
    let tailored = await tailorResume({ resume, jobDesc });

    // 2. ATS check
    let ats = await checkATS({
      resumeText: tailored,
      jobDesc
    });

    // 3. Improve if needed
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

    // 4. Cover letter (only if needed)
    let cover = "";
    if (jobDesc.toLowerCase().includes("cover letter")) {
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

    cache.set(cacheKey, result);

    res.json(result);

  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ===============================
// LOG APPLICATION
// ===============================
app.post("/log-application", (req, res) => {
  applications.push({
    ...req.body,
    date: new Date()
  });

  res.json({ success: true });
});

// ===============================
// GET APPLICATIONS
// ===============================
app.get("/applications", (req, res) => {
  res.json(applications);
});

// ===============================
// 🚀 PORT (IMPORTANT FOR DEPLOY)
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});