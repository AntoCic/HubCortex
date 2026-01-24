// .firebase-emulators/src/start.js
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

function spawnCmd(cmd, args, name) {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    shell: true, // su Windows serve per risolvere cmd nel PATH
  });

  child.on("error", (err) => {
    console.error(`❌ Errore processo ${name}:`, err);
  });

  return child;
}

export function cmdStart() {
  return new Promise((resolve, reject) => {
    const stateDir = path.resolve("./.firebase-emulators/state");

    // ✅ FIX: crea la cartella se non esiste
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    const emu = spawnCmd(
      "firebase",
      ["emulators:start", "--import", stateDir],
      "EMULATORS"
    );

    const vite = spawnCmd("npm", ["run", "dev"], "VITE");

    // Se chiudi emu (Ctrl+C), chiudi anche vite
    emu.on("exit", (code) => {
      try {
        vite.kill("SIGINT");
      } catch { }
      resolve(code ?? 0);
    });

    // Se vite muore subito (errore), fermo tutto e segnalo errore
    vite.on("exit", (code) => {
      if (code && code !== 0) {
        try {
          emu.kill("SIGINT");
        } catch { }
        reject(new Error(`Vite è terminato con code=${code}`));
      }
    });
  });
}
