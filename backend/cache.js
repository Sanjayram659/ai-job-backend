// backend/cache.js

const fs = require("fs");
const path = require("path");

const CACHE_FILE = path.join(__dirname, "../data/cache.json");

// ===============================
// LOAD CACHE
// ===============================
function loadCache() {
  try {
    const data = fs.readFileSync(CACHE_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// ===============================
// SAVE CACHE
// ===============================
function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// ===============================
// GET
// ===============================
function getFromCache(key) {
  const cache = loadCache();
  return cache[key];
}

// ===============================
// SET
// ===============================
function saveToCache(key, value) {
  const cache = loadCache();
  cache[key] = value;
  saveCache(cache);
}

module.exports = { getFromCache, saveToCache };