/**
 * Genera un colore esadecimale casuale (ad esempio: #A3B1F2).
 * * @returns {string} Il codice colore esadecimale, incluso il '#'.
 */
export function generaColoreEsadecimale(): string {
    return '#' +
        Math.floor(Math.random() * 0xffffff)
            .toString(16)
            .padStart(6, '0')
            .toUpperCase();
}
export function generaColoreDarkenHex(hex: string, percent = 20): string {

    const num = parseInt(hex.replace('#', ''), 16);

    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;

    r = Math.max(0, Math.floor(r * (100 - percent) / 100));
    g = Math.max(0, Math.floor(g * (100 - percent) / 100));
    b = Math.max(0, Math.floor(b * (100 - percent) / 100));

    return (
        '#' +
        ((1 << 24) + (r << 16) + (g << 8) + b)
            .toString(16)
            .slice(1)
    );
}
