// after-build.js
import fs from 'fs';
import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { execSync } from 'child_process';
import { updateFirestoreAppConfig } from './updateFirestoreAppConfig.js';

const packageJsonPath = './package.json';
const changelogPath = './CHANGELOG.md';
// 1. aggiorna Firestore appConfig
try { await updateFirestoreAppConfig();
} catch (err) {
    console.error(
        '❌ Errore update Firestore appConfig:',
        err?.message ?? err
    );
}

// const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// // 4. INPUT da terminale
// const rl = createInterface({ input, output });

// const description = await rl.question(
//     '✏️  Descrizione per il changelog (invio per saltare): '
// );

// // 5. Prepara CHANGELOG
// const today = new Date().toISOString().slice(0, 10);

// const hasDescription =
//     description && description.trim().length > 0;

// const cleanDescription = hasDescription
//     ? description.trim()
//     : 'Nessuna descrizione fornita.';

// const newEntry = `## v${packageJson.version} - ${today}

// ${cleanDescription}

// ---

// `;

// // 6. Carica il vecchio changelog
// let existingChangelog = '';
// if (fs.existsSync(changelogPath)) {
//     existingChangelog = fs.readFileSync(changelogPath, 'utf-8');
// }

// // 7. Scrivi il nuovo changelog (prepend)
// fs.writeFileSync(changelogPath, newEntry + existingChangelog);
// console.log(`📝 Changelog aggiornato in ${changelogPath}`);

// // 8. Gestione Git: solo se è stata fornita una descrizione
// if (!hasDescription) {
//     await rl.close();
//     console.log('⏭  Nessuna descrizione: salto commit e push Git');
// } else {
//     // Chiedi se fare il commit Git (default = SÌ)
//     const doGitRaw = await rl.question(
//         '📦 Vuoi fare il commit su Git? [s/n] (s): '
//     );
//     await rl.close();

//     // default = SÌ
//     const doGit = doGitRaw.trim().toLowerCase().startsWith('n') ? 'n' : 's';

//     if (doGit === 's') {
//         try {
//             console.log('🔧 Git add...');
//             execSync('git add .', { stdio: 'inherit' });

//             const commitMsg = `v${packageJson.version} – ${cleanDescription}`;

//             console.log(`🔧 Git commit: "${commitMsg}"`);
//             execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });

//             console.log(`🔖 Git tag v${packageJson.version}`);
//             execSync(`git tag v${packageJson.version}`, { stdio: 'inherit' });

//             // 🚀 DOMANDA PER IL PUSH (default = SÌ)
//             const doPushRaw = await (async () => {
//                 const rl2 = createInterface({ input, output });
//                 const ans = await rl2.question(
//                     '🚀 Vuoi anche fare git push? [s/n] (s): '
//                 );
//                 await rl2.close();
//                 return ans;
//             })();

//             const doPush = doPushRaw.trim().toLowerCase().startsWith('n') ? 'n' : 's';

//             if (doPush === 's') {
//                 execSync('git push', { stdio: 'inherit' });
//                 execSync('git push --tags', { stdio: 'inherit' });
//                 console.log('🚀 Push completato!');
//             } else {
//                 console.log('⏭  Push saltato');
//             }
//         } catch (err) {
//             console.error('❌ Errore durante il commit Git:', err.message);
//         }
//     } else {
//         console.log('😣 Commit Git saltato');
//     }
// }

console.log('✅ Processo after-build completato.');
