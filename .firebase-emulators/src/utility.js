import fs from "fs";
import path from "path";
import readline from "readline";

export const ROOT = process.cwd();

export const BASE_DIR = path.join(ROOT, ".firebase-emulators");
export const STATE_DIR = path.join(BASE_DIR, "state");
export const STATES_DIR = path.join(BASE_DIR, "states");
export const OLD_STATE_DIR = path.join(BASE_DIR, "old-state");
export const DEFAULT_STATE_NAME = "default";

const STATE_NAME_RE = /^[A-Za-z0-9._-]+$/;

export function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function tsFolder() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
    d.getHours()
  )}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

export function removeDir(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

export function copyDir(src, dest) {
  if (!fs.existsSync(src)) return false;
  ensureDir(dest);
  fs.cpSync(src, dest, { recursive: true });
  return true;
}

// On Windows rename may fail with EPERM if handles are still open.
export function moveDirSafe(src, dest) {
  try {
    fs.renameSync(src, dest);
    return;
  } catch {
    ensureDir(dest);
    fs.cpSync(src, dest, { recursive: true });
    fs.rmSync(src, { recursive: true, force: true });
  }
}

export function askConfirm(
  question = "Are you sure? [Y/n] ",
  defaultYes = true
) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      const a = (answer || "").trim().toLowerCase();

      if (a === "") return resolve(defaultYes);
      if (["s", "si", "y", "yes"].includes(a)) return resolve(true);
      if (["n", "no"].includes(a)) return resolve(false);

      resolve(defaultYes);
    });
  });
}

export function askInput(question, defaultValue = "") {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      const value = (answer || "").trim();
      resolve(value || defaultValue);
    });
  });
}

export function listFirebaseExportFolders(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith("firebase-export-"))
    .map((d) => path.join(dir, d.name));
}

export function newestDir(dirs) {
  let best = null;
  let bestMtime = -1;

  for (const d of dirs) {
    try {
      const st = fs.statSync(d);
      const m = st.mtimeMs ?? 0;
      if (m > bestMtime) {
        bestMtime = m;
        best = d;
      }
    } catch {
      // ignore unreadable folders
    }
  }

  return best;
}

export function normalizeStateName(value) {
  const raw = (value || "").trim();
  if (!raw) return DEFAULT_STATE_NAME;
  if (raw === DEFAULT_STATE_NAME) return DEFAULT_STATE_NAME;

  if (!STATE_NAME_RE.test(raw)) {
    throw new Error(
      `Invalid state name "${raw}". Allowed: letters, numbers, '.', '_' and '-'.`
    );
  }

  return raw;
}

export function getStateDir(stateName) {
  const normalized = normalizeStateName(stateName);
  if (normalized === DEFAULT_STATE_NAME) return STATE_DIR;
  return path.join(STATES_DIR, normalized);
}

export function listStates() {
  const names = [DEFAULT_STATE_NAME];

  if (!fs.existsSync(STATES_DIR)) {
    return names;
  }

  const namedStates = fs
    .readdirSync(STATES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => STATE_NAME_RE.test(name))
    .sort((a, b) => a.localeCompare(b));

  return [...names, ...namedStates];
}

export function stateExists(stateName) {
  return fs.existsSync(getStateDir(stateName));
}

export function relativeToRoot(absolutePath) {
  return path.relative(ROOT, absolutePath) || ".";
}

// Safe swap: keep old target until next state is ready.
export function swapDirWith(nextPath, targetPath, stamp, label = "state") {
  const safeLabel = label.replace(/[^A-Za-z0-9._-]/g, "_");
  const nextSwap = path.join(BASE_DIR, `.next_${safeLabel}_${stamp}`);
  const prevSwap = path.join(BASE_DIR, `.prev_${safeLabel}_${stamp}`);

  removeDir(nextSwap);
  moveDirSafe(nextPath, nextSwap);

  removeDir(prevSwap);
  if (fs.existsSync(targetPath)) moveDirSafe(targetPath, prevSwap);

  ensureDir(path.dirname(targetPath));
  moveDirSafe(nextSwap, targetPath);

  removeDir(prevSwap);
}
