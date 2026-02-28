import { printHelp } from "./src/help.js";
import { cmdSave } from "./src/save.js";
import { cmdStart } from "./src/start.js";
import { cmdDelete, cmdList } from "./src/states.js";

const rawCmd = process.argv[2] || "help";
const cmd = rawCmd.toLowerCase();
const stateArg = process.argv[3];

async function main() {
  if (cmd === "help" || cmd === "--help" || cmd === "-h") {
    printHelp();
    process.exit(0);
  }

  if (cmd === "start" || cmd === "-start") {
    const code = await cmdStart(stateArg);
    process.exit(code);
  }

  if (cmd === "save" || cmd === "-save") {
    await cmdSave(stateArg);
    process.exit(0);
  }

  if (cmd === "list" || cmd === "ls") {
    cmdList();
    process.exit(0);
  }

  if (cmd === "delete" || cmd === "del" || cmd === "rm") {
    if (!stateArg) {
      console.error("Missing state name. Usage: emu.js delete <state>");
      process.exit(1);
    }

    await cmdDelete(stateArg);
    process.exit(0);
  }

  console.log(`Unknown command: "${rawCmd}"`);
  printHelp();
  process.exit(1);
}

main().catch((err) => {
  console.error("Emulator command failed:", err.message || err);
  process.exit(1);
});
