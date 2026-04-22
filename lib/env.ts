function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  MONGODB_URI: required("MONGODB_URI", process.env.MONGODB_URI),
  MONGODB_DB: process.env.MONGODB_DB || "blog",

  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
  AUTH_RESEND_KEY: process.env.AUTH_RESEND_KEY,
  AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM || "noreply@example.com",

  NODE_ENV: process.env.NODE_ENV || "development",
} as const;

export const isProd = env.NODE_ENV === "production";
