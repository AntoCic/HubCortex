export const MSG_IS_OFFLINE = 'Sei offline: cancello in locale, sincronizzo quando torni online.'

export function isBrowserOnline(): boolean {
    return typeof navigator !== 'undefined' ? !!navigator.onLine : true
}
export function isBrowserOffline(): boolean {
    return !isBrowserOnline();
}
