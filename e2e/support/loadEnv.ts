import { loadEnvConfig } from '@next/env';

let loaded = false;

export function ensureE2EEnvLoaded() {
  if (loaded) return;
  loadEnvConfig(process.cwd());
  loaded = true;
}
