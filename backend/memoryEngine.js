const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/memory.json");

// ===============================
// LOAD MEMORY
// ===============================
function loadMemory() {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath));
}

// ===============================
// SAVE MEMORY
// ===============================
function saveMemory(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ===============================
// GET VALUE
// ===============================
function getValue(label) {
  const memory = loadMemory();
  return memory[label.toLowerCase()] || null;
}

// ===============================
// STORE VALUE
// ===============================
function storeValue(label, value) {
  if (!label || !value) return;

  const memory = loadMemory();
  memory[label.toLowerCase()] = value;

  saveMemory(memory);
}

module.exports = {
  getValue,
  storeValue
};