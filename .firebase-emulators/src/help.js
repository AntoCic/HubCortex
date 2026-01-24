// .firebase-emulators/src/help.js
export function printHelp() {
  console.log(`
Uso:
  node ./.firebase-emulators/emu.js [COMANDO]

Comandi:
  help    Mostra questo messaggio
  start   Avvia gli emulatori importando lo state da:
          ./.firebase-emulators/state
  save    Salva lo stato attuale degli emulatori come nuovo state:
          - backup state corrente in .firebase-emulators/old-state/<timestamp>/
          - export dallo Hub emulatori
          - aggiorna .firebase-emulators/state (senza rischiare di perderlo)
`);
}
