/**
 * S.H.I.E.L.D. Security Framework - Pillar 4: Input Sanitization (Anti-XSS & Anti-Bombing)
 * Strips HTML tags, escapes dangerous characters, and enforces strict character limits.
 */

export function sanitizeString(input: unknown, maxLength = 255): string {
  if (typeof input !== 'string') return '';
  const clean = input
    .replace(/<[^>]*>/g, '') // Eliminar cualquier tag HTML <script>, <iframe>, etc.
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case "'": return '&#39;';
        case '"': return '&quot;';
        case '&': return '&amp;';
        default: return char;
      }
    })
    .trim();
  return clean.length > maxLength ? clean.slice(0, maxLength) : clean;
}

export function sanitizePhone(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^\d+]/g, '').slice(0, 20);
}

export function sanitizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const clean = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(clean) ? clean.slice(0, 100) : null;
}
