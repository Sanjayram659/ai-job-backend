// ===============================
// ⏳ WAIT
// ===============================
function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// ===============================
// 🧠 GET ALL FORM FIELDS
// ===============================
function getAllFields() {
  return document.querySelectorAll(
    "input, textarea, select"
  );
}

// ===============================
// 🧠 SMART LABEL DETECTION
// ===============================
function getLabel(el) {
  return (
    el.getAttribute("aria-label") ||
    el.getAttribute("placeholder") ||
    el.name ||
    el.id ||
    el.closest("label")?.innerText ||
    el.closest("div")?.innerText?.slice(0, 80) ||
    ""
  )
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

// ===============================
// 🚫 IGNORE HIDDEN FIELDS
// ===============================
function isVisible(el) {
  return (
    el.offsetParent !== null &&
    !el.disabled &&
    el.type !== "hidden"
  );
}

// ===============================
// ✍️ FILL FIELD
// ===============================
function fillField(el, value) {
  if (!value || !isVisible(el)) return;

  // prevent overwrite
  if (
    el.value &&
    el.value.length > 2 &&
    el.type !== "checkbox"
  ) {
    return;
  }

  try {
    const tag = el.tagName.toLowerCase();
    const type = el.type?.toLowerCase();

    // SELECT
    if (tag === "select") {
      for (let opt of el.options) {
        const text = opt.text.toLowerCase();

        if (
          text.includes(value.toLowerCase())
        ) {
          el.value = opt.value;
          break;
        }
      }
    }

    // CHECKBOX / RADIO
    else if (
      type === "checkbox" ||
      type === "radio"
    ) {
      const yesValues = [
        "yes",
        "true",
        "1"
      ];

      if (
        yesValues.includes(
          value.toLowerCase()
        )
      ) {
        el.checked = true;
      }
    }

    // DATE
    else if (type === "date") {
      el.value = value || "2024-01-01";
    }

    // NUMBER
    else if (type === "number") {
      el.value = parseInt(value) || 0;
    }

    // NORMAL INPUT
    else {
      el.focus();
      el.value = value;
    }

    el.dispatchEvent(
      new Event("input", {
        bubbles: true
      })
    );

    el.dispatchEvent(
      new Event("change", {
        bubbles: true
      })
    );

  } catch (err) {
    console.log("Fill failed:", err);
  }
}

// ===============================
// 💾 LOAD MEMORY
// ===============================
async function getMemory() {
  const data =
    await chrome.storage.local.get(
      "fieldMemory"
    );

  return data.fieldMemory || {};
}

// ===============================
// 💾 SAVE MEMORY
// ===============================
async function saveMemoryLocal(newData) {
  if (
    !newData ||
    Object.keys(newData).length === 0
  ) {
    return;
  }

  const existing = await getMemory();

  const merged = {
    ...existing,
    ...newData
  };

  await chrome.storage.local.set({
    fieldMemory: merged
  });
}

// ===============================
// 🚀 LOW-COST AI MATCHING
// ===============================
async function batchMatchFields(
  fields,
  resumeText,
  memory
) {
  const unknownLabels = [
    ...new Set(
      fields
        .map(el => getLabel(el))
        .filter(
          l =>
            l &&
            !memory[l] &&
            l.length < 80
        )
    )
  ];

  // COST SAVING
  if (unknownLabels.length === 0) {
    return {};
  }

  try {
    const res = await fetch(
      "http://localhost:3000/match-fields-batch",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          fields: unknownLabels,
          resumeText
        })
      }
    );

    const data = await res.json();

    return data.values || {};

  } catch (err) {
    console.log(
      "Batch match failed"
    );

    return {};
  }
}

// ===============================
// 🧠 AUTOFILL ENGINE
// ===============================
async function autofillForm(data) {
  const fields = Array.from(
    getAllFields()
  ).filter(isVisible);

  if (fields.length === 0) {
    return;
  }

  const memory =
    await getMemory();

  const aiMapping =
    await batchMatchFields(
      fields,
      data.resume,
      memory
    );

  fields.forEach(el => {
    const label = getLabel(el);

    const value =
      memory[label] ||
      aiMapping[label];

    if (value) {
      fillField(el, value);
    }
  });

  await saveMemoryLocal(
    aiMapping
  );

  console.log(
    "✅ Autofill complete"
  );
}

// ===============================
// 📎 RESUME FILE UPLOAD
// ===============================
async function uploadResumeFile() {
  try {
    const inputs =
      document.querySelectorAll(
        'input[type="file"]'
      );

    const data =
      await chrome.storage.local.get(
        "resumeFile"
      );

    if (!data.resumeFile) {
      return;
    }

    inputs.forEach(input => {
      const blob = new Blob(
        [data.resumeFile.content],
        {
          type: "text/plain"
        }
      );

      const file = new File(
        [blob],
        data.resumeFile.name
      );

      const dt =
        new DataTransfer();

      dt.items.add(file);

      input.files = dt.files;

      input.dispatchEvent(
        new Event("change", {
          bubbles: true
        })
      );
    });

    console.log(
      "📎 Resume uploaded"
    );

  } catch (err) {
    console.log(
      "Upload failed"
    );
  }
}

// ===============================
// 🧠 LEARNING ENGINE
// ===============================
function captureUserInputs() {
  const fields =
    document.querySelectorAll(
      "input, textarea, select"
    );

  let data = {};

  fields.forEach(el => {
    const label = getLabel(el);

    let value = "";

    if (
      el.type === "checkbox"
    ) {
      value = el.checked
        ? "yes"
        : "no";
    } else {
      value = el.value;
    }

    if (
      label &&
      value &&
      value.length < 120
    ) {
      data[label] = value;
    }
  });

  return data;
}

// ===============================
// 📧 SMART EMAIL DETECTION
// ===============================
function extractRecruiterEmail() {
  const text =
    document.body.innerText;

  const emails = text.match(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi
  );

  if (!emails) {
    return null;
  }

  const filtered =
    emails.filter(e => {
      const bad = [
        "noreply",
        "no-reply",
        "support",
        "help",
        "privacy",
        "legal"
      ];

      return !bad.some(b =>
        e.toLowerCase().includes(b)
      );
    });

  return (
    filtered[0] ||
    emails[0]
  );
}

// ===============================
// 📧 EMAIL FLOW
// ===============================
async function handleEmailAfterApply(
  resumeText,
  jobDesc
) {
  const settings =
    await chrome.storage.local.get([
      "autoEmail",
      "confirmEmail"
    ]);

  if (!settings.autoEmail) {
    return;
  }

  try {
    const res = await fetch(
      "http://localhost:3000/generate-email",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          resumeText,
          jobDesc
        })
      }
    );

    const data =
      await res.json();

    const emailText =
      data.email;

    if (
      settings.confirmEmail
    ) {
      const ok = confirm(
        "Send recruiter email?"
      );

      if (!ok) {
        return;
      }
    }

    const recruiterEmail =
      extractRecruiterEmail() ||
      "fallback@email.com";

    await fetch(
      "http://localhost:3000/send-email",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          to: recruiterEmail,
          subject:
            "Application Follow-up",
          text: emailText
        })
      }
    );

    console.log(
      "📧 Email sent"
    );

  } catch (err) {
    console.log(
      "Email failed",
      err
    );
  }
}

// ===============================
// 📊 AUTO JOB TRACKING
// ===============================
async function logApplication() {
  try {
    const role =
      document.querySelector("h1")
        ?.innerText ||
      document.title;

    const company =
      location.hostname.replace(
        "www.",
        ""
      );

    await fetch(
      "http://localhost:3000/log-application",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          company,
          role,
          status: "Applied",
          ats: Math.floor(
            Math.random() * 20
          ) + 80
        })
      }
    );

    console.log(
      "📊 Job logged"
    );

  } catch (err) {
    console.log(
      "Log failed"
    );
  }
}

// ===============================
// 🔁 NEXT BUTTON
// ===============================
function clickNextButton() {
  const buttons =
    document.querySelectorAll(
      "button"
    );

  for (let btn of buttons) {
    const text =
      btn.innerText?.toLowerCase();

    if (
      text?.includes("next") ||
      text?.includes(
        "continue"
      ) ||
      text?.includes("review")
    ) {
      btn.click();
      return true;
    }
  }

  return false;
}

// ===============================
// 🚀 AUTO SUBMIT
// ===============================
function autoSubmit() {
  chrome.storage.local.get(
    "autoApply",
    data => {
      if (!data.autoApply) {
        return;
      }

      const buttons =
        document.querySelectorAll(
          "button"
        );

      for (let btn of buttons) {
        const text =
          btn.innerText?.toLowerCase();

        if (
          text?.includes(
            "submit"
          ) ||
          text?.includes(
            "apply now"
          ) ||
          text?.includes(
            "finish"
          )
        ) {
          console.log(
            "🚀 Auto submit"
          );

          btn.click();

          return;
        }
      }
    }
  );
}

// ===============================
// 🚀 MAIN FLOW
// ===============================
let isRunning = false;

async function runAutofill() {

  if (isRunning) {
    return;
  }

  isRunning = true;

  const dataStore =
    await chrome.storage.local.get([
      "finalResume",
      "approved"
    ]);

  if (
    !dataStore.approved
  ) {
    isRunning = false;
    return;
  }

  // multi-step forms
  for (let i = 0; i < 5; i++) {

    await wait(2000);

    await uploadResumeFile();

    await autofillForm({
      resume:
        dataStore.finalResume
    });

    const learned =
      captureUserInputs();

    await saveMemoryLocal(
      learned
    );

    const moved =
      clickNextButton();

    if (!moved) {
      break;
    }
  }

  await logApplication();

  autoSubmit();

  await handleEmailAfterApply(
    dataStore.finalResume,
    document.body.innerText
  );

  isRunning = false;
}

// ===============================
// 🎯 APPLY DETECTION
// ===============================
document.addEventListener(
  "click",
  e => {

    const text =
      e.target.innerText?.toLowerCase();

    if (
      text?.includes("apply") ||
      text?.includes(
        "start application"
      ) ||
      text?.includes(
        "submit application"
      )
    ) {
      console.log(
        "🟢 Apply detected"
      );

      setTimeout(() => {
        runAutofill();
      }, 2000);
    }
  }
);