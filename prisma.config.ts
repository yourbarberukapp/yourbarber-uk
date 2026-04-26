import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { defineConfig, env } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrate: {
    async adapter(env) {
      return new PrismaPg({ connectionString: env.DIRECT_URL ?? env.DATABASE_URL });
    },
  },
});
