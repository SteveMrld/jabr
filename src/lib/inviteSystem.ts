// ═══════════════════════════════════════════════════════════════════
// JABR — Invite System
// Access control: whitelist + invite codes + email invitations
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════
// WHITELISTED EMAILS (always allowed)
// ═══════════════════════════════════

const WHITELISTED_EMAILS = [
  'steve@jabrilia.com',
  'contact@jabrilia.com',
  'steve.moradel@gmail.com',
  'stevemoradel@gmail.com',
];

// ═══════════════════════════════════
// INVITE CODES (pre-generated)
// ═══════════════════════════════════

const VALID_CODES = [
  'JABR-BETA-2026',
  'JABR-VIP-ACCESS',
  'JABR-DEMO-LIVE',
  'JABR-ESSEC-2026',
  'JABR-INSEEC-2026',
  'JABR-AUDENCIA-2026',
  'JABR-PARTNER-01',
  'JABR-PARTNER-02',
  'JABR-PARTNER-03',
  'JABR-INVESTOR-01',
];

// ═══════════════════════════════════
// INVITED EMAILS (stored in localStorage)
// ═══════════════════════════════════

function getInvitedEmails(): string[] {
  try {
    const data = localStorage.getItem('jabr-invited-emails');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function addInvitedEmail(email: string) {
  try {
    const emails = getInvitedEmails();
    if (!emails.includes(email.toLowerCase())) {
      emails.push(email.toLowerCase());
      localStorage.setItem('jabr-invited-emails', JSON.stringify(emails));
    }
  } catch { /* silent */ }
}

function getUsedCodes(): string[] {
  try {
    const data = localStorage.getItem('jabr-used-codes');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function markCodeUsed(code: string, email: string) {
  try {
    const used = getUsedCodes();
    used.push(`${code}:${email}:${new Date().toISOString()}`);
    localStorage.setItem('jabr-used-codes', JSON.stringify(used));
  } catch { /* silent */ }
}

// ═══════════════════════════════════
// VALIDATION
// ═══════════════════════════════════

export function isWhitelistedEmail(email: string): boolean {
  return WHITELISTED_EMAILS.includes(email.toLowerCase().trim());
}

export function isInvitedEmail(email: string): boolean {
  return getInvitedEmails().includes(email.toLowerCase().trim());
}

export function isValidInviteCode(code: string): boolean {
  return VALID_CODES.includes(code.trim().toUpperCase());
}

export function validateAccess(email: string, inviteCode?: string): {
  allowed: boolean;
  reason: string;
} {
  const cleanEmail = email.toLowerCase().trim();

  // Whitelisted = always allowed
  if (isWhitelistedEmail(cleanEmail)) {
    return { allowed: true, reason: 'Email autorisé (admin)' };
  }

  // Already invited = allowed
  if (isInvitedEmail(cleanEmail)) {
    return { allowed: true, reason: 'Email déjà invité' };
  }

  // Has valid code = allowed + save email
  if (inviteCode && isValidInviteCode(inviteCode)) {
    addInvitedEmail(cleanEmail);
    markCodeUsed(inviteCode, cleanEmail);
    return { allowed: true, reason: 'Code d\'invitation valide' };
  }

  // No access
  return {
    allowed: false,
    reason: inviteCode
      ? 'Code d\'invitation invalide. Vérifiez votre code ou contactez contact@jabrilia.com'
      : 'Accès sur invitation uniquement. Entrez votre code d\'invitation ou contactez contact@jabrilia.com',
  };
}

// ═══════════════════════════════════
// ADMIN: Generate invite link
// ═══════════════════════════════════

export function generateInviteLink(code: string): string {
  return `https://jabr-eta.vercel.app/auth?invite=${encodeURIComponent(code)}`;
}

export function getAvailableCodes(): { code: string; used: boolean; usedBy?: string }[] {
  const used = getUsedCodes();
  return VALID_CODES.map(code => {
    const usage = used.find(u => u.startsWith(code + ':'));
    return {
      code,
      used: !!usage,
      usedBy: usage ? usage.split(':')[1] : undefined,
    };
  });
}

// ═══════════════════════════════════
// SESSION CHECK (for /app protection)
// ═══════════════════════════════════

export function hasValidSession(): boolean {
  try {
    // Check if user has been validated
    return localStorage.getItem('jabr-access-validated') === 'true';
  } catch {
    return false;
  }
}

export function setSessionValidated() {
  try {
    localStorage.setItem('jabr-access-validated', 'true');
  } catch { /* silent */ }
}

export function clearSession() {
  try {
    localStorage.removeItem('jabr-access-validated');
  } catch { /* silent */ }
}
