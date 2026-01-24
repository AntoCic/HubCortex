// .firebase-emulators/emu.js
import { printHelp } from "./src/help.js";
import { cmdSave } from "./src/save.js";
import { cmdStart } from "./src/start.js";

const cmd = (process.argv[2] || "help").toLowerCase();

if (cmd === "help" || cmd === "--help" || cmd === "-h") {
  printHelp();
  process.exit(0);
}

if (cmd === "start" || cmd === "-start") {
  try {
    const code = await cmdStart();
    process.exit(code);
  } catch (err) {
    console.error("❌ Errore avvio emulatori:", err);
    process.exit(1);
  }
}



if (cmd === "save" || cmd === "-save") {
  await cmdSave();
  process.exit(0);
}

console.log(`Comando non riconosciuto: "${process.argv[2]}"`);
printHelp();
process.exit(1);
