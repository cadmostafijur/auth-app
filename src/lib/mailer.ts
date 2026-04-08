import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }

  return new Resend(apiKey);
}

type MailOptions = {
  appUrl?: string;
};

function resolveAppUrl(appUrl?: string) {
  const candidate =
    appUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    "http://localhost:3000";

  if (process.env.NODE_ENV === "production" && candidate.includes("localhost")) {
    throw new Error("Refusing to send production email with localhost URL");
  }

  return candidate;
}

export async function sendVerificationEmail(to: string, token: string, options?: MailOptions) {
  const from = process.env.RESEND_FROM_EMAIL;
  const appUrl = resolveAppUrl(options?.appUrl);

  if (!from) {
    throw new Error("Missing RESEND_FROM_EMAIL environment variable");
  }

  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

  const result = await getResendClient().emails.send({
    from,
    to,
    subject: "Verify your email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">Welcome!</h2>
        <p style="line-height: 1.5; color: #333;">
          Click the button below to verify your email and activate your account.
        </p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background: #0f172a; color: #fff; padding: 12px 18px; border-radius: 8px; text-decoration: none;">Verify email</a>
        </p>
        <p style="line-height: 1.5; color: #555; font-size: 14px;">
          If the button does not work, copy and paste this link into your browser:<br/>
          ${verifyUrl}
        </p>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(`Verification email failed: ${result.error.message}`);
  }
}

export async function sendPasswordResetEmail(to: string, token: string, options?: MailOptions) {
  const from = process.env.RESEND_FROM_EMAIL;
  const appUrl = resolveAppUrl(options?.appUrl);

  if (!from) {
    throw new Error("Missing RESEND_FROM_EMAIL environment variable");
  }

  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const result = await getResendClient().emails.send({
    from,
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">Password reset</h2>
        <p style="line-height: 1.5; color: #333;">
          We received a request to reset your password.
        </p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #0f172a; color: #fff; padding: 12px 18px; border-radius: 8px; text-decoration: none;">Reset password</a>
        </p>
        <p style="line-height: 1.5; color: #555; font-size: 14px;">
          If you did not request this, you can safely ignore this email.<br/>
          Link expires in 1 hour.
        </p>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(`Password reset email failed: ${result.error.message}`);
  }
}
