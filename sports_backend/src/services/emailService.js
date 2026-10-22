import nodemailer from 'nodemailer';

/**
 * Configure email transporter
 * Uses SMTP settings from environment variables if present,
 * otherwise falls back to a development simulation logger.
 */
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE
  } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587', 10),
      secure: SMTP_SECURE === 'true' || SMTP_PORT === '465',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    console.log('✅ Email service initialized with SMTP transport:', SMTP_HOST);
  } else {
    // Development fallback
    transporter = null;
    console.log('ℹ️ Email service initialized in development/simulation mode (No SMTP configured)');
  }

  return transporter;
}

/**
 * Send Password Reset OTP Email
 * @param {Object} options
 * @param {string} options.email
 * @param {string} options.otp
 * @param {string} [options.userName]
 */
export async function sendPasswordResetOtp({ email, otp, userName = 'Participant' }) {
  const mailTransporter = getTransporter();
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@shettigarevents.com';
  const appName = 'Sports Event Management';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset OTP</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 24px; color: #2A2A2A; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #eaeaea; }
        .header { background: linear-gradient(135deg, #D35D38 0%, #B84A2E 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
        .body { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #1a1a1a; }
        .description { font-size: 14px; line-height: 1.6; color: #555555; margin-bottom: 24px; }
        .otp-container { text-align: center; margin: 28px 0; }
        .otp-badge { display: inline-block; background: #FFF4F0; border: 2px dashed #D35D38; border-radius: 12px; padding: 16px 36px; }
        .otp-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #D35D38; margin-bottom: 4px; }
        .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #2A2A2A; font-family: 'Courier New', Courier, monospace; }
        .expiry-note { font-size: 13px; color: #888888; text-align: center; margin-top: 8px; }
        .security-box { background: #F8F9FA; border-left: 4px solid #D35D38; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-top: 28px; }
        .security-box p { margin: 0; font-size: 12px; color: #666666; line-height: 1.5; }
        .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee; background: #fafafa; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${appName}</h1>
          <p>Account Security & Verification</p>
        </div>
        <div class="body">
          <div class="greeting">Hello ${userName},</div>
          <div class="description">
            We received a request to reset the password for your account associated with <strong>${email}</strong>. Use the One-Time Password (OTP) below to proceed with setting a new password.
          </div>
          
          <div class="otp-container">
            <div class="otp-badge">
              <div class="otp-label">Verification Code</div>
              <div class="otp-code">${otp}</div>
            </div>
            <div class="expiry-note">⏳ This code expires in <strong>10 minutes</strong>.</div>
          </div>

          <div class="security-box">
            <p><strong>Didn't request this?</strong> If you did not make this request, please ignore this email or contact support immediately. Your password will remain unchanged.</p>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from: `"${appName}" <${fromEmail}>`,
        to: email,
        subject: `Your Password Reset Code: ${otp}`,
        text: `Your password reset verification code is ${otp}. It is valid for 10 minutes. If you did not request this, please ignore this email.`,
        html: htmlContent
      });

      console.log(`📧 [EMAIL SENT] Password reset OTP sent to ${email} (MessageId: ${info.messageId})`);
      return { success: true, mode: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error('❌ [EMAIL FAILED] Error sending email via SMTP:', err);
      // Fallback to logging in console so flow doesn't completely block in dev
      console.log(`\n======================================================`);
      console.log(`🔐 [SIMULATED OTP DELIVERY - SMTP ERROR FALLBACK]`);
      console.log(`To: ${email}`);
      console.log(`OTP Code: >>> ${otp} <<<`);
      console.log(`Expires: 10 minutes`);
      console.log(`======================================================\n`);
      return { success: true, mode: 'simulated_fallback', error: err.message };
    }
  } else {
    // Development simulation mode
    console.log(`\n======================================================`);
    console.log(`🔐 [DEV MODE OTP LOG]`);
    console.log(`To: ${email}`);
    console.log(`OTP Code: >>> ${otp} <<<`);
    console.log(`Valid for: 10 minutes`);
    console.log(`======================================================\n`);
    return { success: true, mode: 'simulated' };
  }
}
