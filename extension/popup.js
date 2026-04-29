// ===============================
// PARSERS
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
// SAVE RESUME
// ===============================
document.getElementById("saveResume").onclick = async () => {
  const file = document.getElementById("resumeUpload").files[0];
  const name = document.getElementById("resumeName").value;

  if (!file || !name) return alert("Upload + name");

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

  await chrome.storage.local.set({ resumes });

  alert("✅ Saved");
  loadResumes();
};

// ===============================
// LOAD RESUMES
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
// SELECT RESUME
// ===============================
document.getElementById("selectResume").onclick = async () => {
  const selected = document.getElementById("resumeList").value;

  await chrome.storage.local.set({
    selectedResume: selected
  });

  alert("✅ Resume selected");
};

// ===============================
// PREVIEW DISPLAY
// ===============================
async function loadPreview() {
  const data = await chrome.storage.local.get([
    "finalResume",
    "coverLetter",
    "ats"
  ]);

  if (!data.finalResume) return;

  document.getElementById("previewBox").innerText =
    "ATS Score: " + (data.ats?.score || "N/A") +
    "\n\nRESUME:\n" + data.finalResume +
    "\n\nCOVER:\n" + data.coverLetter;
}

loadPreview();

// ===============================
// APPROVE
// ===============================
document.getElementById("approve").onclick = async () => {
  await chrome.storage.local.set({ approved: true });
  alert("✅ Approved. Now click Apply.");
};

// ===============================
// REGENERATE
// ===============================
document.getElementById("regenerate").onclick = async () => {
  await chrome.storage.local.set({ approved: false });
  alert("🔄 Click Apply again");
};