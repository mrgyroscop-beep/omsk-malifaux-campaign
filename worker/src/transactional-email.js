const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export class EmailConfigurationError extends Error {
  constructor() {
    super("password_reset_email_not_configured");
    this.code = "password_reset_email_not_configured";
  }
}

function configuredValue(value, maximum) {
  const normalized = String(value ?? "").trim();
  return normalized && normalized.length <= maximum ? normalized : "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function passwordResetEmailConfigured(env) {
  return Boolean(
    configuredValue(env.BREVO_API_KEY, 512) &&
    configuredValue(env.BREVO_FROM_EMAIL, 254) &&
    configuredValue(env.PASSWORD_RESET_BASE_URL, 2_000),
  );
}

export function passwordResetUrl(env, token) {
  const base = configuredValue(env.PASSWORD_RESET_BASE_URL, 2_000);
  if (!base) throw new EmailConfigurationError();
  const url = new URL(base);
  url.hash = `reset/${token}`;
  return url.toString();
}

export async function sendPasswordResetEmail(env, message, fetcher = fetch) {
  if (!passwordResetEmailConfigured(env)) throw new EmailConfigurationError();

  const fromEmail = configuredValue(env.BREVO_FROM_EMAIL, 254);
  const fromName = configuredValue(env.BREVO_FROM_NAME, 100) || "Malifaux Campaign Notebook";
  const recipientName = configuredValue(message.displayName, 60);
  const resetUrl = String(message.resetUrl);
  const safeName = escapeHtml(recipientName || "игрок");
  const safeUrl = escapeHtml(resetUrl);
  const response = await fetcher(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": configuredValue(env.BREVO_API_KEY, 512),
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: message.email, ...(recipientName ? { name: recipientName } : {}) }],
      subject: "Восстановление пароля — Malifaux Campaign Notebook",
      htmlContent: `<!doctype html><html lang="ru"><body style="margin:0;background:#f2ead8;color:#2a2924;font-family:Georgia,serif"><div style="max-width:620px;margin:0 auto;padding:36px 24px"><p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8b302a">Admiralty archive</p><h1 style="font-size:28px;line-height:1.15">Восстановление пароля</h1><p>Здравствуйте, ${safeName}.</p><p>Для вашего кампейнового блокнота Malifaux был запрошен новый пароль. Ссылка действует 15 минут и может быть использована только один раз.</p><p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;padding:13px 20px;background:#8b302a;color:#fff;text-decoration:none">Задать новый пароль</a></p><p style="font-size:13px;color:#625b4f">Если вы не запрашивали восстановление, просто проигнорируйте это письмо. Ваш пароль не изменится.</p><p style="font-size:12px;color:#756d60;word-break:break-all">${safeUrl}</p></div></body></html>`,
      tags: ["password-reset"],
    }),
    signal: AbortSignal.timeout(10_000),
  });

  await response.body?.cancel();
  if (!response.ok) {
    const error = new Error("password_reset_email_failed");
    error.code = "password_reset_email_failed";
    error.status = response.status;
    throw error;
  }
}
