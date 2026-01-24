// .firebase-emulators/src/save.js
import path from "path";
import {
  ROOT,
  BASE_DIR,
  STATE_DIR,
  OLD_STATE_DIR,
  ensureDir,
  askConfirm,
  tsFolder,
  copyDir,
  removeDir,
  run,
  listFirebaseExportFolders,
  newestDir,
  sleep,
  swapStateWith,
} from "./utility.js";

export async function cmdSave() {
  const confirmed = await askConfirm(
    "⚠️  Questa operazione SALVERÀ lo stato attuale come nuovo state.\n" +
    "Il state corrente verrà spostato in old-state.\n" +
    "Vuoi continuare? [S/n] "
  );

  if (!confirmed) {
    console.log("❌ Operazione annullata.");
    process.exit(0);
  }

  ensureDir(BASE_DIR);
  ensureDir(OLD_STATE_DIR);

  const stamp = tsFolder();
  const backupDir = path.join(OLD_STATE_DIR, stamp);

  // 1) Backup state corrente -> old-state/<timestamp>/
  if (fsExists(STATE_DIR)) {
    console.log(`📦 Backup state corrente -> ${backupDir}`);
    copyDir(STATE_DIR, backupDir);
  } else {
    console.log("ℹ️ Nessun state esistente da backuppare (creo state nuovo).");
  }

  // 2) Export in tmp
  const tmpDir = path.join(BASE_DIR, `.tmp_export_${stamp}`);
  removeDir(tmpDir);
  ensureDir(tmpDir);

  // snapshot export folders esistenti (per fallback)
  const beforeExports = new Set([
    ...listFirebaseExportFolders(ROOT),
    ...listFirebaseExportFolders(BASE_DIR),
  ]);

  // 3) Prova export "normale" nella tmp dir
  try {
    console.log(`🚚 Export stato attuale emulatori -> ${tmpDir}`);
    run(`firebase emulators:export "${tmpDir}" --force`);

    // Se arriviamo qui, l'export è ok: swap state in modo sicuro
    console.log(`♻️ Aggiorno state -> ${STATE_DIR}`);
    swapStateWith(tmpDir, stamp);

    console.log("\n✅ State aggiornato con successo!");
    console.log(`➡️ State attivo: ${STATE_DIR}`);
    console.log(`➡️ Backup state precedente: ${backupDir}`);
    return;
  } catch (e) {
    console.warn(
      "\n⚠️ Export diretto fallito. Provo fallback su cartella firebase-export-*..."
    );
  }

  // cleanup tmp che potrebbe essere incompleta
  removeDir(tmpDir);

  // 4) Fallback: alcune versioni di firebase-tools creano firebase-export-* altrove
  await sleep(700); // evita EPERM/handle ancora aperti su Windows

  const afterExports = [
    ...listFirebaseExportFolders(ROOT),
    ...listFirebaseExportFolders(BASE_DIR),
  ].filter((p) => !beforeExports.has(p));

  const fallback = newestDir(afterExports);

  if (!fallback) {
    console.error(
      "\n❌ Export fallito e nessuna cartella firebase-export-* trovata per fallback."
    );
    console.error(
      "👉 Guarda i log degli emulatori (terminal/UI) per capire perché export fallisce."
    );
    process.exit(1);
  }

  console.log(`✅ Trovata cartella export fallback: ${fallback}`);

  try {
    console.log(`♻️ Aggiorno state -> ${STATE_DIR}`);
    // swap state in modo sicuro usando la cartella fallback
    swapStateWith(fallback, stamp);

    console.log("\n✅ State aggiornato con successo (fallback)!");
    console.log(`➡️ State attivo: ${STATE_DIR}`);
    console.log(`➡️ Backup state precedente: ${backupDir}`);
  } catch (err) {
    console.error("\n❌ Errore nel sostituire state con la cartella fallback.");
    console.error(err);
    console.error(
      "\n👉 Nota: state NON dovrebbe essere perso, perché lo swap è sicuro."
    );
    process.exit(1);
  }
}

// micro helper interno (evita import fs qui)
import fs from "fs";
function fsExists(p) {
  return fs.existsSync(p);
}
