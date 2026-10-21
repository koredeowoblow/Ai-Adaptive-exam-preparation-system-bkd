import { seed } from '../src/scripts/seed';
import { seedRbac } from '../src/scripts/seed-rbac';

describe('Seed Scripts Security Guards', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('seed.ts', () => {
    it('refuses to run when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEMO_ADMIN_PASSWORD = 'some-password';
      process.env.DEMO_STUDENT_PASSWORD = 'some-password';

      await expect(seed()).rejects.toThrow('Refusing to run seed script in production environment.');
    });

    it('refuses to run when DEMO passwords are not set', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.DEMO_ADMIN_PASSWORD;
      delete process.env.DEMO_STUDENT_PASSWORD;

      await expect(seed()).rejects.toThrow('DEMO_ADMIN_PASSWORD and DEMO_STUDENT_PASSWORD environment variables must be configured.');
    });
  });

  describe('seed-rbac.ts', () => {
    it('refuses to run when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SUPERADMIN_BOOTSTRAP_ENABLED = 'true';
      process.env.SUPERADMIN_PASSWORD = 'some-password';

      await expect(seedRbac()).rejects.toThrow('Refusing to run seed-rbac script in production environment.');
    });

    it('refuses to run when SUPERADMIN_PASSWORD is missing', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SUPERADMIN_BOOTSTRAP_ENABLED = 'true';
      process.env.SUPERADMIN_EMAIL = 'superadmin@example.com';
      delete process.env.SUPERADMIN_PASSWORD;

      await expect(seedRbac()).rejects.toThrow('SUPERADMIN_PASSWORD environment variable is required');
    });
  });
});
