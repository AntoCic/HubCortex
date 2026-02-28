import { spawn } from "child_process";
import fs from "fs";
import {
  DEFAULT_STATE_NAME,
  getStateDir,
  normalizeStateName,
  relativeToRoot,
} from "./utility.js";

function spawnCmd(cmd, args, name) {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    shell: true,
  });

  child.on("error", (err) => {
    console.error(`Error in process ${name}:`, err);
  });

  return child;
}

export function cmdStart(stateNameInput) {
  return new Promise((resolve, reject) => {
    const stateName = normalizeStateName(stateNameInput);
    const stateDir = getStateDir(stateName);

    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
      console.log(
        `State "${stateName}" did not exist. Created: ${relativeToRoot(stateDir)}`
      );
    }

    const defaultTag =
      stateName === DEFAULT_STATE_NAME ? " (default)" : "";
    console.log(
      `Starting emulators with state "${stateName}"${defaultTag}: ${relativeToRoot(
        stateDir
      )}`
    );

    const emu = spawnCmd(
      "firebase",
      [
        "emulators:start",
        "--only",
        "auth,firestore,functions,storage,hosting",
        "--import",
        stateDir,
        "--export-on-exit",
        stateDir,
      ],
      "EMULATORS"
    );

    const vite = spawnCmd("npm", ["run", "dev"], "VITE");

    emu.on("exit", (code) => {
      try {
        vite.kill("SIGINT");
      } catch {
        // ignore
      }
      resolve(code ?? 0);
    });

    vite.on("exit", (code) => {
      if (code && code !== 0) {
        try {
          emu.kill("SIGINT");
        } catch {
          // ignore
        }
        reject(new Error(`Vite terminated with code=${code}`));
      }
    });
  });
}
