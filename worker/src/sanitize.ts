export function cleanString(input: unknown, maxLength = 5000): string {
  if (typeof input !== 'string') return '';
  // Strip null bytes and control chars except tabs/newlines
  const cleaned = input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

export function cleanOptionalString(input: unknown, maxLength = 2000): string | null {
  const val = cleanString(input, maxLength);
  return val === '' ? null : val;
}

export function sanitizeSlug(input: unknown, fallback = ''): string {
  const raw = cleanString(input, 140).toLowerCase();
  const slug = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
  return slug || fallback;
}

export function sanitizeEmail(input: unknown): string {
  const email = cleanString(input, 254).toLowerCase();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) ? email : '';
}

export function sanitizeUrl(input: unknown, options?: { allowRelative?: boolean }): string | null {
  const raw = cleanString(input, 1000);
  if (!raw) return null;
  if (options?.allowRelative && raw.startsWith('/') && !raw.startsWith('//')) {
    return raw;
  }
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function sanitizeStringArray(input: unknown, maxItems = 30, maxLen = 200): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const item of input) {
    if (out.length >= maxItems) break;
    const cleaned = cleanString(item, maxLen);
    if (cleaned) out.push(cleaned);
  }
  return out;
}

/**
 * Strips potentially executable HTML tags, event handlers, and javascript: URIs
 * from Markdown or rich-text content before storage/output.
 */
export function sanitizeMarkdownContent(input: unknown, maxLength = 100_000): string {
  let text = cleanString(input, maxLength);
  if (!text) return '';
  // Remove dangerous HTML tags and their contents for script/style/iframe/object/embed
  text = text.replace(/<\s*(script|style|iframe|object|embed|svg|math|form)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, '');
  text = text.replace(/<\s*(script|style|iframe|object|embed|meta|link|base)[^>]*\/?>/gi, '');
  // Strip inline event handlers (onclick=, onerror=, etc.)
  text = text.replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // Neutralize javascript: / vbscript: / data:text/html URIs in markdown links or HTML attributes
  text = text.replace(/(javascript|vbscript)\s*:/gi, 'blocked:');
  text = text.replace(/data\s*:\s*text\/html/gi, 'blocked:text/html');
  return text;
}

/**
 * Sanitizes uploaded SVG XML against embedded scripts or event handlers.
 */
export function sanitizeSvgPayload(svgText: string): string | null {
  if (!svgText || svgText.length > 512_000) return null;
  if (!/<svg[\s>]/i.test(svgText)) return null;
  const cleaned = svgText
    .replace(/<\s*(script|foreignObject|iframe|object|embed)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(javascript|vbscript)\s*:/gi, 'blocked:');
  return cleaned;
}

export function parseJsonSafe<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function validateStrongPassword(password: string): string | null {
  if (typeof password !== 'string' || password.length < 10) {
    return 'Password must be at least 10 characters long.';
  }
  if (password.length > 128) {
    return 'Password must not exceed 128 characters.';
  }
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  if (!hasLower || !hasUpper || !hasDigit) {
    return 'Password must include uppercase letters, lowercase letters, and at least one number.';
  }
  return null;
}

export function estimateReadingTimeMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
