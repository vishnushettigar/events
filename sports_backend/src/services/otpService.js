import crypto from 'crypto';

/**
 * In-memory storage for OTPs and reset sessions.
 * Key: Aadhaar number (unique identifier per user account)
 */
const otpStore = new Map();

// Run periodic cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    // Delete if both OTP and resetToken have expired
    const isOtpExpired = record.expiresAt < now;
    const isTokenExpired = !record.resetTokenExpiresAt || record.resetTokenExpiresAt < now;
    if (isOtpExpired && isTokenExpired) {
      otpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Normalizes Aadhaar number
 */
function normalizeAadhaar(aadhaar) {
  return (aadhaar || '').toString().trim();
}

/**
 * Normalizes email address
 */
function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

/**
 * Generate a new 6-digit OTP for the given Aadhaar and Email combination
 * @param {string} aadhaar Unique Aadhaar number
 * @param {string} email Target email address to receive OTP
 * @param {boolean} [isAddingEmail=false] Whether this OTP is for verifying and adding a new email
 * @returns {{ canSend: boolean, otp?: string, cooldownSeconds?: number, expiresAt?: number }}
 */
export function generateOtp(aadhaar, email, isAddingEmail = false) {
  const cleanAadhaar = normalizeAadhaar(aadhaar);
  const cleanEmail = normalizeEmail(email);
  const now = Date.now();
  const existing = otpStore.get(cleanAadhaar);

  // Check 60-second cooldown per Aadhaar
  if (existing && existing.lastSentAt) {
    const elapsedSeconds = Math.floor((now - existing.lastSentAt) / 1000);
    if (elapsedSeconds < 60) {
      return {
        canSend: false,
        cooldownSeconds: 60 - elapsedSeconds
      };
    }
  }

  // Generate 6-digit numerical code
  const otp = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  otpStore.set(cleanAadhaar, {
    otp,
    email: cleanEmail,
    aadhaar: cleanAadhaar,
    expiresAt,
    attempts: 0,
    lastSentAt: now,
    verified: false,
    resetToken: null,
    resetTokenExpiresAt: null,
    isAddingEmail: !!isAddingEmail,
    pendingEmail: cleanEmail
  });

  return {
    canSend: true,
    otp,
    expiresAt
  };
}

/**
 * Get remaining cooldown in seconds (if any)
 * @param {string} aadhaar
 * @returns {number} 0 if no cooldown, otherwise remaining seconds
 */
export function getRemainingCooldown(aadhaar) {
  const cleanAadhaar = normalizeAadhaar(aadhaar);
  const existing = otpStore.get(cleanAadhaar);
  if (!existing || !existing.lastSentAt) return 0;
  const elapsed = Math.floor((Date.now() - existing.lastSentAt) / 1000);
  return elapsed < 60 ? 60 - elapsed : 0;
}

/**
 * Verify submitted OTP for an Aadhaar account
 * @param {string} aadhaar
 * @param {string} inputOtp
 * @returns {{ success: boolean, message?: string, resetToken?: string, email?: string }}
 */
export function verifyOtp(aadhaar, inputOtp) {
  const cleanAadhaar = normalizeAadhaar(aadhaar);
  const record = otpStore.get(cleanAadhaar);
  const now = Date.now();

  if (!record) {
    return {
      success: false,
      message: 'No verification code was requested for this Aadhaar number. Please request a new code.'
    };
  }

  if (record.expiresAt < now) {
    otpStore.delete(cleanAadhaar);
    return {
      success: false,
      message: 'Verification code has expired. Please request a new code.'
    };
  }

  if (record.attempts >= 5) {
    otpStore.delete(cleanAadhaar);
    return {
      success: false,
      message: 'Too many incorrect attempts. Please request a new code.'
    };
  }

  const cleanInput = (inputOtp || '').toString().trim();
  if (record.otp !== cleanInput) {
    record.attempts += 1;
    const remainingAttempts = 5 - record.attempts;
    return {
      success: false,
      message: `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`
    };
  }

  // OTP is valid! Create a temporary reset token valid for 15 minutes
  const resetToken = crypto.randomBytes(32).toString('hex');
  record.verified = true;
  record.resetToken = resetToken;
  record.resetTokenExpiresAt = now + 15 * 60 * 1000; // 15 mins to submit new password

  return {
    success: true,
    resetToken,
    email: record.email,
    isAddingEmail: !!record.isAddingEmail,
    pendingEmail: record.pendingEmail
  };
}

/**
 * Validate reset token and consume it upon successful password reset
 * @param {string} aadhaar
 * @param {string} resetToken
 * @returns {boolean} true if valid and consumed
 */
export function consumeResetToken(aadhaar, resetToken) {
  const cleanAadhaar = normalizeAadhaar(aadhaar);
  const record = otpStore.get(cleanAadhaar);
  const now = Date.now();

  if (!record || !record.verified || !record.resetToken) {
    return false;
  }

  if (record.resetToken !== resetToken) {
    return false;
  }

  if (record.resetTokenExpiresAt && record.resetTokenExpiresAt < now) {
    otpStore.delete(cleanAadhaar);
    return false;
  }

  // Token is valid - consume it so it cannot be used again
  otpStore.delete(cleanAadhaar);
  return true;
}
