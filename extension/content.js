// ===============================
// 🔍 WAIT HELPER
// ===============================
function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// ===============================
// 🔍 FIND LINKEDIN MODAL
// ===============================
function getLinkedInModal() {
  return document.querySelector(".jobs-easy-apply-modal");
}

// ===============================
// 🧠 EXTRACT FIELDS (SMART)
// ===============================
function getFields() {
  const modal = getLinkedInModal();
  if (!modal) return [];

  return modal.querySelectorAll("input, textarea, select");
}

// ===============================
// 🧠 GET LABEL
// ===============================
function getLabel(el) {
  return (
    el.getAttribute("aria-label") ||
    el.placeholder ||
    el.name ||
    el.id ||
    ""
  ).toLowerCase();
}

// ===============================
// ✍️ FILL FIELD
// ===============================
function fillField(el, value) {
  if (!value) return;

  el.focus();
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

// ===============================
// 🧠 AUTOFILL LINKEDIN
// ===============================
async function autofillLinkedIn(data) {
  const fields = getFields();

  fields.forEach(el => {
    const label = getLabel(el);

    if (label.includes("name")) fillField(el, data.name);
    else if (label.includes("email")) fillField(el, data.email);
    else if (label.includes("phone")) fillField(el, data.phone);
    else if (label.includes("cover")) fillField(el, data.cover);
    else if (label.includes("experience"))
      fillField(el, data.resume);
  });

  console.log("✅ LinkedIn autofill step done");
}

// ===============================
// 🔁 NEXT BUTTON
// ===============================
function clickNext() {
  const btns = document.querySelectorAll("button");

  for (let b of btns) {
    const text = b.innerText.toLowerCase();

    if (text.includes("next") || text.includes("review")) {
      b.click();
      return true;
    }
  }

  return false;
}

// ===============================
// 🚀 MAIN LOOP
// ===============================
async function handleLinkedInApply() {
  console.log("🟢 LinkedIn flow started");

  const dataStore = await chrome.storage.local.get([
    "finalResume",
    "coverLetter",
    "approved",
    "resumes"
  ]);

  if (!dataStore.approved) {
    console.log("⛔ Not approved");
    return;
  }

  const resume = dataStore.finalResume;
  const cover = dataStore.coverLetter;

  for (let i = 0; i < 10; i++) {
    await wait(2000);

    await autofillLinkedIn({
      name: dataStore.resumes?.name,
      email: dataStore.resumes?.email,
      phone: dataStore.resumes?.phone,
      resume,
      cover
    });

    await wait(1500);

    if (!clickNext()) break;
  }

  console.log("✅ LinkedIn flow complete (review before submit)");
}

// ===============================
// 🎯 DETECT EASY APPLY
// ===============================
document.addEventListener("click", (e) => {
  if (e.target.innerText?.includes("Easy Apply")) {
    setTimeout(handleLinkedInApply, 2000);
  }
});