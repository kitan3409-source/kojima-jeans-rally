const DEV_ADMIN_TOKEN = "kojima2026";

export const isProduction = process.env.NODE_ENV === "production";

function resolveAdminToken(): string {
  const token = process.env.ADMIN_TOKEN?.trim();
  if (!isProduction) return token || DEV_ADMIN_TOKEN;
  if (!token || token === DEV_ADMIN_TOKEN || token.length < 16) {
    throw new Error(
      "ADMIN_TOKEN must be set to a non-default value of at least 16 characters when NODE_ENV=production"
    );
  }
  return token;
}

export const ADMIN_TOKEN = resolveAdminToken();

export const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const trustedClientIpHeader = process.env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase() || null;

export const webDistDir = process.env.WEB_DIST_DIR?.trim() || null;
