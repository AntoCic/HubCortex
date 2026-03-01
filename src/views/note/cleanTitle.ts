export function htmlToText(html?: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

export function cleanTitle(html?: string, sliceOn = 20): string | null {
  if (!html || html.trim() === '') return null;
  const textClean = htmlToText(html).slice(0, sliceOn).trim();
  if (textClean === '') return null;
  return textClean;
}
