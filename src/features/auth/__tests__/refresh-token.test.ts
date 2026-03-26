import type { Logger } from 'pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshToken } from '../refresh-token';

describe('refreshToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLogger = {
    level: 'info',
    fatal: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    silent: vi.fn(),
    child: vi.fn(),
    msgPrefix: '',
  } as unknown as Logger;

  const mockConfig = {
    corsOrigin: undefined,
    DATABASE_URL: 'mysql://localhost:3306/test',
    env: 'development' as const,
    logLevel: 'info' as const,
    loggerEnabled: true,
    port: 3000,
    discord: {
      clientId: 'test-client',
      clientSecret: 'test-secret',
      redirectUri: 'http://localhost/callback',
    },
    sessionSecret: 'test-secret',
  };

  it('should return not_found when session does not exist', async () => {
    const result = await refreshToken({ sessionId: 'invalid-session' }, {
      config: mockConfig,
      logger: mockLogger,
      repositories: {
        sessionsRepository: {
          create: vi.fn(),
          getById: vi.fn().mockResolvedValue(null),
          deleteById: vi.fn(),
          deleteByUserId: vi.fn(),
        },
        usersRepository: {
          upsert: vi.fn(),
          getByDiscordId: vi.fn(),
        },
      },
    } as any);

    expect(result.type).toBe('not_found');
  });

  it('should return not_found when session is expired', async () => {
    const expiredSession = {
      id: 'expired-session',
      userId: 'test-user-id',
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      isExpired: () => true,
    };

    const result = await refreshToken({ sessionId: 'expired-session' }, {
      config: mockConfig,
      logger: mockLogger,
      repositories: {
        sessionsRepository: {
          create: vi.fn(),
          getById: vi.fn().mockResolvedValue(expiredSession),
          deleteById: vi.fn().mockResolvedValue(undefined),
          deleteByUserId: vi.fn(),
        },
        usersRepository: {
          upsert: vi.fn(),
          getByDiscordId: vi.fn(),
        },
      },
    } as any);

    expect(result.type).toBe('not_found');
  });
});
