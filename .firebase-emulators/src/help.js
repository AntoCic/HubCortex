export function printHelp() {
  console.log(`
Usage:
  node ./.firebase-emulators/emu.js <COMMAND> [STATE_NAME]

Commands:
  help                 Show this help message
  start [state]        Start emulators with selected state
                       - default state path: ./.firebase-emulators/state
                       - named state path:   ./.firebase-emulators/states/<state>
  save [state]         Save current emulator snapshot into selected state
                       - backup previous data in:
                         ./.firebase-emulators/old-state/<state>/<timestamp>/
                       - if [state] is omitted, you can choose a custom name
                         or keep default
  list                 List available states
  delete <state>       Delete one state (default allowed)

Examples:
  npm run emu:start
  npm run emu:start -- qa
  npm run emu:save -- qa
  npm run emu:list
  npm run emu:delete -- qa
`);
}
