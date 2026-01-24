// .firebase-emulators/src/utility.js
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import readline from "readline";

export const ROOT = process.cwd();

export const BASE_DIR = path.join(ROOT, ".firebase-emulators");
export const STATE_DIR = path.join(BASE_DIR, "state");
export const OLD_STATE_DIR = path.join(BASE_DIR, "old-state");

// ---------------- utils ----------------
export function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

/**
 * Sposta una directory. Su Windows può fallire con EPERM se ci sono handle aperti.
 * Quindi: prova rename, altrimenti copia + delete.
 */
export function moveDirSafe(src, dest) {
  try {
    fs.renameSync(src, dest);
    return;
  } catch (e) {
    // fallback robusto
    ensureDir(dest);
    fs.cpSync(src, dest, { recursive: true });
    fs.rmSync(src, { recursive: true, force: true });
  }
}

export function askConfirm(question = "Sei sicuro di voler continuare? [S/n] ") {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      const a = (answer || "").trim().toLowerCase();

      // default = sì
      if (a === "") return resolve(true);

      // sì
      if (["s", "si", "sì", "y", "yes"].includes(a)) return resolve(true);

      // no
      if (["n", "no"].includes(a)) return resolve(false);

      // qualsiasi altra cosa -> default sì
      resolve(true);
    });
  });
}

export function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
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
    } catch {}
  }
  return best;
}

// Swap sicuro: non distrugge state finché non ha next pronto
export function swapStateWith(nextStatePath, stamp) {
  const nextStateDir = path.join(BASE_DIR, `.next_state_${stamp}`);
  const oldStateSwap = path.join(BASE_DIR, `.state_prev_${stamp}`);

  // porta next dentro BASE_DIR (evita rename cross-path + riduce EPERM)
  removeDir(nextStateDir);
  moveDirSafe(nextStatePath, nextStateDir);

  // sposta state attuale in state_prev
  removeDir(oldStateSwap);
  if (fs.existsSync(STATE_DIR)) moveDirSafe(STATE_DIR, oldStateSwap);

  // promuovi next -> state
  moveDirSafe(nextStateDir, STATE_DIR);

  // cleanup
  removeDir(oldStateSwap);
}
