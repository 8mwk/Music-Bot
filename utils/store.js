const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readSync(name, fallback) {
  const fp = filePath(name);
  try {
    if (!fs.existsSync(fp)) {
      fs.writeFileSync(fp, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    const raw = fs.readFileSync(fp, 'utf8');
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`[store] Failed to read ${name}.json:`, err);
    return fallback;
  }
}

function writeAsync(name, data) {
  const fp = filePath(name);
  fs.writeFile(fp, JSON.stringify(data, null, 2), (err) => {
    if (err) console.error(`[store] Failed to write ${name}.json:`, err);
  });
}

// In-memory cache, loaded once at startup. Every read below hits this cache —
// zero disk I/O on the hot path (messageCreate fires on *every* message in
// every server, so synchronous file reads there were a real bottleneck).
// Writes update the cache immediately (so the bot reacts instantly) and
// persist to disk in the background asynchronously.
const cache = {
  owners: readSync('owners', []),
  noprefix: readSync('noprefix', []),
  guildsettings: readSync('guildsettings', {}),
};

// ---- Owners ----
function getOwners() {
  return cache.owners;
}
function addOwner(userId) {
  if (!cache.owners.includes(userId)) {
    cache.owners.push(userId);
    writeAsync('owners', cache.owners);
  }
  return cache.owners;
}
function removeOwner(userId) {
  cache.owners = cache.owners.filter((id) => id !== userId);
  writeAsync('owners', cache.owners);
  return cache.owners;
}

// ---- No-prefix users ----
function getNoPrefixUsers() {
  return cache.noprefix;
}
function addNoPrefix(userId) {
  if (!cache.noprefix.includes(userId)) {
    cache.noprefix.push(userId);
    writeAsync('noprefix', cache.noprefix);
  }
  return cache.noprefix;
}
function removeNoPrefix(userId) {
  cache.noprefix = cache.noprefix.filter((id) => id !== userId);
  writeAsync('noprefix', cache.noprefix);
  return cache.noprefix;
}

// ---- Per-guild settings ----
function getGuildSettings(guildId) {
  return cache.guildsettings[guildId] || {};
}
function setGuildSetting(guildId, key, value) {
  if (!cache.guildsettings[guildId]) cache.guildsettings[guildId] = {};
  cache.guildsettings[guildId][key] = value;
  writeAsync('guildsettings', cache.guildsettings);
  return cache.guildsettings[guildId];
}

module.exports = {
  getOwners,
  addOwner,
  removeOwner,
  getNoPrefixUsers,
  addNoPrefix,
  removeNoPrefix,
  getGuildSettings,
  setGuildSetting,
};
