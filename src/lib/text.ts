export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export function sanitizeText(text: string): string {
  return text
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

export function containsPromptInjection(text: string): boolean {
  const patterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /you\s+are\s+now\s+(a\s+)?/i,
    /system\s*:\s*you/i,
    /\[INST\]/i,
    /<\|im_start\|>/i,
    /###\s*instruction/i,
    /forget\s+your\s+(previous\s+)?training/i,
    /act\s+as\s+if\s+you\s+are/i,
    /pretend\s+you\s+are\s+an?\s+AI/i,
  ];
  return patterns.some((p) => p.test(text));
}
