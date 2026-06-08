import { test as base, expect } from '@playwright/test';
import { seedBarberE2EState, type SeededBarberE2EState } from '../../src/lib/e2e/seedFixtures';
import { ensureE2EEnvLoaded } from './loadEnv';

type AppFixtures = {
  seededState: SeededBarberE2EState;
};

export const test = base.extend<AppFixtures>({
  seededState: async ({}, use) => {
    ensureE2EEnvLoaded();
    const state = await seedBarberE2EState();
    await use(state);
  },
});

export { expect };
