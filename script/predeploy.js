// bump-version.js
import fs from 'fs';

const packageJsonPath = './package.json';

/**
 * Incrementa la versione in package.json.
 * default: patch
 * @returns {string} newVersion
 */
function bumpVersion({ type = 'patch' } = {}) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const parts = packageJson.version.split('.').map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
        throw new Error(`Versione non valida in package.json: "${packageJson.version}" (attesa x.y.z)`);
    }

    const [major, minor, patch] = parts;

    let next;
    if (type === 'major') next = [major + 1, 0, 0];
    else if (type === 'minor') next = [major, minor + 1, 0];
    else next = [major, minor, patch + 1]; // patch

    const newVersion = next.join('.');
    packageJson.version = newVersion;

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    return newVersion;
}

const newVersion = bumpVersion({ type: 'patch' });
console.log(`📦 Version updated to ${newVersion}`);