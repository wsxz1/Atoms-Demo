/**
 * Extracts the first ```html ... ``` code block from a model response.
 * Falls back to detecting a raw <!DOCTYPE html> ... </html> sequence.
 */
export function extractHtml(text: string): string | null {
  if (!text) return null;

  const fenced = text.match(/```html\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    return fenced[1].trim();
  }

  const generic = text.match(/```\s*(<!doctype[\s\S]*?<\/html>)\s*```/i);
  if (generic && generic[1]) {
    return generic[1].trim();
  }

  const raw = text.match(/<!doctype html[\s\S]*?<\/html>\s*$/i);
  if (raw) {
    return raw[0].trim();
  }

  return null;
}

/**
 * Tries to extract a "partial" HTML during streaming, useful for live preview
 * even before the closing ```. We look for an open <!doctype html> tag and,
 * if present, return everything after it (stripped of leading fence text).
 */
export function extractStreamingHtml(text: string): string | null {
  if (!text) return null;

  const closed = extractHtml(text);
  if (closed) return closed;

  const docIdx = text.search(/<!doctype html/i);
  if (docIdx === -1) return null;

  const remainder = text.slice(docIdx);
  return remainder.replace(/```[\s\S]*$/, '').trim();
}
