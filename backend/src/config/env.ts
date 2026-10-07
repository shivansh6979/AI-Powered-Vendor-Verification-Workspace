import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
  GLEIF_SANDBOX_MODE: z.enum(['true', 'false']).default('true'),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

type Env = z.infer<typeof envSchema>;

let validated: Env | null = null;

export function getEnv(): Env {
  if (validated) return validated;

  try {
    validated = envSchema.parse(process.env);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Environment validation failed:\n${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n')}`
      );
    }
    throw error;
  }
}

export const env = getEnv();
