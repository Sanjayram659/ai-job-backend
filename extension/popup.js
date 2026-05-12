// ===============================
// 🧠 HELPERS
// ===============================
function extractEmail(text) {
  const match = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i);
  return match ? match[0] : "";
}

function extractPhone(text) {
  const match = text.match(/\d{10}/);
  return match ? match[0] : "";
}

function extractName(text) {
  const lines = text.split("\n").map(l => l.trim());
  return lines[0] || "";
}

// ===============================
// 📁 SAVE RESUME
// ===============================
document.getElementById("saveResume").onclick = async () => {
  const file = document.getElementById("resumeUpload").files[0];
  const name = document.getElementById("resumeName").value;

  if (!file || !name) return alert("Upload + name required");

  const text = await file.text();

  const parsed = {
    raw: text,
    name: extractName(text),
    email: extractEmail(text),
    phone: extractPhone(text)
  };

  const data = await chrome.storage.local.get("resumes");
  const resumes = data.resumes || {};

  resumes[name] = parsed;

  await chrome.storage.local.set({
    resumes,
    resumeFile: {
      name: file.name,
      content: text
    }
  });

  alert("✅ Resume saved");
  loadResumes();
};

// ===============================
// 📂 LOAD RESUMES
// ===============================
async function loadResumes() {
  const data = await chrome.storage.local.get("resumes");
  const resumes = data.resumes || {};

  const select = document.getElementById("resumeList");
  select.innerHTML = "";

  Object.keys(resumes).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

loadResumes();

// ===============================
// 🎯 SELECT RESUME
// ===============================
document.getElementById("selectResume").onclick = async () => {
  const selected = document.getElementById("resumeList").value;

  if (!selected) return alert("Select a resume");

  await chrome.storage.local.set({
    selectedResume: selected
  });

  alert("✅ Resume selected");
};

// ===============================
// 🤖 AUTO SELECT BEST RESUME
// ===============================
async function autoSelectResume(jobDesc) {
  const data = await chrome.storage.local.get("resumes");
  const resumes = data.resumes || {};

  const res = await fetch("http://localhost:3000/select-resume", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ resumes, jobDesc })
  });

  const result = await res.json();

  if (result.bestResume) {
    await chrome.storage.local.set({
      selectedResume: result.bestResume
    });

    return result.bestResume;
  }

  return null;
}

// ===============================
// 🧠 PROCESS JOB
// ===============================
async function processJob(jobDesc) {
  const data = await chrome.storage.local.get([
    "resumes",
    "selectedResume"
  ]);

  const resumes = data.resumes || {};
  let selected = data.selectedResume;

  if (!selected) {
    const best = await autoSelectResume(jobDesc);
    if (best) selected = best;
  }

  if (!selected || !resumes[selected]) {
    alert("❌ No resume selected");
    return;
  }

  const res = await fetch("http://localhost:3000/process-job", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      jobDesc,
      resume: resumes[selected].raw
    })
  });

  const result = await res.json();

  await chrome.storage.local.set({
    finalResume: result.resume,
    coverLetter: result.cover,
    ats: result.ats,
    approved: false
  });

  loadPreview();
}

// ===============================
// 👀 PREVIEW + STATS
// ===============================
async function loadPreview() {
  const data = await chrome.storage.local.get([
    "finalResume",
    "coverLetter",
    "ats"
  ]);

  if (!data.finalResume) return;

  document.getElementById("previewBox").innerText =
    "⭐ ATS Score: " + (data.ats?.score || "N/A") +
    "\n\n📄 RESUME:\n" + data.finalResume +
    "\n\n✉️ COVER LETTER:\n" + (data.coverLetter || "N/A");

  // update ATS badge
  document.getElementById("atsScore").innerText =
    data.ats?.score || "N/A";
}

// ===============================
// 📊 LOAD APPLICATION STATS
// ===============================
async function loadStats() {
  try {
    const res = await fetch("http://localhost:3000/applications");
    const data = await res.json();

    document.getElementById("appCount").innerText =
      data.length || 0;

  } catch {
    document.getElementById("appCount").innerText = "0";
  }
}

loadPreview();
loadStats();

// ===============================
// ✅ APPROVE
// ===============================
document.getElementById("approve").onclick = async () => {
  await chrome.storage.local.set({ approved: true });

  alert("✅ Approved → Now click Apply OR Autopilot will handle");
};

// ===============================
// 🔄 REGENERATE
// ===============================
document.getElementById("regenerate").onclick = async () => {
  const jobDesc = prompt("Paste job description");

  if (!jobDesc) return;

  await processJob(jobDesc);
};

// ===============================
// 🔁 RESET
// ===============================
document.getElementById("reset").onclick = async () => {
  await chrome.storage.local.set({
    approved: false,
    finalResume: "",
    coverLetter: "",
    ats: null
  });

  document.getElementById("previewBox").innerText = "Reset done";
  document.getElementById("atsScore").innerText = "N/A";

  alert("🔄 Reset complete");
};

// ===============================
// ⚙️ SETTINGS
// ===============================
document.getElementById("autoApply").onchange = async (e) => {
  await chrome.storage.local.set({
    autoApply: e.target.checked
  });
};

document.getElementById("autoEmail").onchange = async (e) => {
  await chrome.storage.local.set({
    autoEmail: e.target.checked
  });
};

document.getElementById("confirmEmail").onchange = async (e) => {
  await chrome.storage.local.set({
    confirmEmail: e.target.checked
  });
};

// ===============================
// 🔄 LOAD SETTINGS
// ===============================
(async () => {
  const settings = await chrome.storage.local.get([
    "autoApply",
    "autoEmail",
    "confirmEmail"
  ]);

  document.getElementById("autoApply").checked =
    settings.autoApply || false;

  document.getElementById("autoEmail").checked =
    settings.autoEmail || false;

  document.getElementById("confirmEmail").checked =
    settings.confirmEmail !== false;
})();