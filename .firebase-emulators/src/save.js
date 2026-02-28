import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  ROOT,
  BASE_DIR,
  STATES_DIR,
  OLD_STATE_DIR,
  DEFAULT_STATE_NAME,
  ensureDir,
  askConfirm,
  askInput,
  tsFolder,
  copyDir,
  removeDir,
  listFirebaseExportFolders,
  newestDir,
  sleep,
  swapDirWith,
  getStateDir,
  normalizeStateName,
  relativeToRoot,
} from "./utility.js";

function fsExists(p) {
  return fs.existsSync(p);
}

function toSafeLabel(value) {
  return value.replace(/[^A-Za-z0-9._-]/g, "_");
}

function normalizeExecOutput(value) {
  if (!value) return "";
  if (Buffer.isBuffer(value)) return value.toString();
  return String(value);
}

function runExport(tmpDir) {
  const cmd = `firebase emulators:export "${tmpDir}" --force`;
  console.log(`\n$ ${cmd}`);

  try {
    const stdout = execSync(cmd, {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    });

    if (stdout) process.stdout.write(stdout);
    return { ok: true, noRunningEmulators: false };
  } catch (error) {
    const stdout = normalizeExecOutput(error.stdout);
    const stderr = normalizeExecOutput(error.stderr);
    const message = normalizeExecOutput(error.message);

    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);

    const combined = `${stdout}\n${stderr}\n${message}`;
    return {
      ok: false,
      noRunningEmulators: /Did not find any running emulators/i.test(combined),
    };
  }
}

async function resolveStateName(stateNameInput) {
  if (stateNameInput) {
    return normalizeStateName(stateNameInput);
  }

  const wantsNamedState = await askConfirm(
    "Vuoi salvare in uno stato con nome personalizzato? [y/N] ",
    false
  );

  if (!wantsNamedState) {
    return DEFAULT_STATE_NAME;
  }

  const typedName = await askInput(
    `Nome stato (invio = ${DEFAULT_STATE_NAME}): `,
    DEFAULT_STATE_NAME
  );

  return normalizeStateName(typedName);
}

export async function cmdSave(stateNameInput) {
  const stateName = await resolveStateName(stateNameInput);
  const targetDir = getStateDir(stateName);
  const hadPreviousState = fsExists(targetDir);

  let confirmMessage =
    `Salvo lo snapshot corrente degli emulatori nello stato "${stateName}".\n` +
    `Lo stato precedente verra salvato in old-state/${stateName}/<timestamp>.\n` +
    "Continuo? [Y/n] ";
  let confirmDefault = true;

  if (stateName === DEFAULT_STATE_NAME && hadPreviousState) {
    confirmMessage =
      `Stai per sovrascrivere lo stato "${DEFAULT_STATE_NAME}".\n` +
      `Backup previsto in old-state/${stateName}/<timestamp>.\n` +
      "Sei sicuro? [y/N] ";
    confirmDefault = false;
  }

  const confirmed = await askConfirm(confirmMessage, confirmDefault);

  if (!confirmed) {
    console.log("Operazione annullata.");
    return;
  }

  ensureDir(BASE_DIR);
  ensureDir(STATES_DIR);
  ensureDir(OLD_STATE_DIR);
  ensureDir(path.dirname(targetDir));

  const stamp = tsFolder();
  const backupDir = path.join(OLD_STATE_DIR, stateName, stamp);

  if (hadPreviousState) {
    console.log(`Backup stato corrente -> ${relativeToRoot(backupDir)}`);
    copyDir(targetDir, backupDir);
  } else {
    console.log(`Nessuno stato "${stateName}" esistente. Ne verra creato uno nuovo.`);
  }

  const safeLabel = toSafeLabel(stateName);
  const tmpDir = path.join(BASE_DIR, `.tmp_export_${safeLabel}_${stamp}`);
  removeDir(tmpDir);
  ensureDir(tmpDir);

  const beforeExports = new Set([
    ...listFirebaseExportFolders(ROOT),
    ...listFirebaseExportFolders(BASE_DIR),
  ]);

  let exportedDir = tmpDir;

  console.log(`Export stato emulatori -> ${relativeToRoot(tmpDir)}`);
  const exportResult = runExport(tmpDir);

  if (!exportResult.ok) {
    if (exportResult.noRunningEmulators) {
      throw new Error(
        "Nessun emulatore in esecuzione trovato. Avvia prima gli emulatori (es: npm run emu:start) e poi riesegui emu:save. Se gli emulatori girano in Docker, esegui il comando nello stesso container."
      );
    }

    console.warn(
      "Export diretto fallito. Provo fallback su cartella firebase-export-* ..."
    );

    removeDir(tmpDir);
    await sleep(700);

    const afterExports = [
      ...listFirebaseExportFolders(ROOT),
      ...listFirebaseExportFolders(BASE_DIR),
    ].filter((p) => !beforeExports.has(p));

    const fallback = newestDir(afterExports);

    if (!fallback) {
      throw new Error(
        "Export fallito e nessuna cartella firebase-export-* trovata (fallback)."
      );
    }

    exportedDir = fallback;
    console.log(`Uso cartella fallback: ${relativeToRoot(exportedDir)}`);
  }

  console.log(`Aggiorno stato "${stateName}" -> ${relativeToRoot(targetDir)}`);
  swapDirWith(exportedDir, targetDir, stamp, stateName);

  console.log(`Stato "${stateName}" salvato correttamente.`);
  console.log(`Path attivo: ${relativeToRoot(targetDir)}`);
  if (hadPreviousState) {
    console.log(`Path backup: ${relativeToRoot(backupDir)}`);
  }
}
