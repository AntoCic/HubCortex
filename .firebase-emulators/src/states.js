import fs from "fs";
import {
  DEFAULT_STATE_NAME,
  getStateDir,
  listStates,
  normalizeStateName,
  askConfirm,
  relativeToRoot,
  stateExists,
} from "./utility.js";

export function cmdList() {
  const states = listStates();

  if (states.length === 0) {
    console.log("No states found.");
    return;
  }

  console.log("Available states:");

  for (const name of states) {
    const isDefault = name === DEFAULT_STATE_NAME;
    const exists = stateExists(name);
    const defaultTag = isDefault ? " (default)" : "";
    const existsTag = exists ? "" : " [empty]";
    const stateDir = getStateDir(name);

    console.log(`- ${name}${defaultTag}: ${relativeToRoot(stateDir)}${existsTag}`);
  }
}

export async function cmdDelete(stateNameInput) {
  const stateName = normalizeStateName(stateNameInput);
  const stateDir = getStateDir(stateName);

  if (!fs.existsSync(stateDir)) {
    console.log(`State "${stateName}" not found.`);
    return;
  }

  const confirmed = await askConfirm(
    `Delete state "${stateName}" at ${relativeToRoot(stateDir)}? [y/N] `,
    false
  );

  if (!confirmed) {
    console.log("Operation cancelled.");
    return;
  }

  fs.rmSync(stateDir, { recursive: true, force: true });
  console.log(`State "${stateName}" deleted.`);
}
