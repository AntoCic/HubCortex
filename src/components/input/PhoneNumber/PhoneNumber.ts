export type PhoneNumber = [prefix: string, number: string]

export const phoneNumberFromString = (phoneNumber: string, defaultPrefix: string = ''): PhoneNumber => {
    const v = phoneNumber.trim()

    // +39 3331234567 | +393331234567
    if (v.startsWith('+')) {
        const m = v.match(/^\+(\d{1,3})\s*(.+)$/)
        if (m) {
            return [`+${m[1]}`, (m[2] ?? '').replace(/\s+/g, '')]
        }
    }

    // 3331234567 (fallback IT)
    return [defaultPrefix, v.replace(/\s+/g, '')]
}
