import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000"),
  DB_HOST: z.string(),
  DB_PORT: z.string().default("3306"),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.enum(["1h", "12h", "24h", "7d"]).default("24h"),
  ADJUTOR_API_KEY: z.string(),
  ADJUTOR_BASE_URL: z.url(),
  ALLOWED_ORIGIN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten((i) => i.message).fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
