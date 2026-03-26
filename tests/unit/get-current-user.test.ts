import type { Logger } from 'pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentUser } from '../../src/features/auth/get-current-user';

describe('getCurrentUser', () => {
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

  it('should return user when session is valid', async () => {
    const mockSession = {
      id: 'test-session-id',
      userId: 'test-user-id',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      isExpired: () => false,
    };

    const mockUser = {
      id: 'test-user-id',
      discordId: '123456789',
      username: 'testuser',
      avatar: 'avatar123',
      accessToken: 'encrypted-token',
      refreshToken: 'encrypted-refresh',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await getCurrentUser({ sessionId: 'test-session-id' }, {
      logger: mockLogger,
      repositories: {
        sessionsRepository: {
          create: vi.fn(),
          getById: vi.fn().mockResolvedValue(mockSession),
          deleteById: vi.fn(),
          deleteByUserId: vi.fn(),
        },
        usersRepository: {
          upsert: vi.fn(),
          getByDiscordId: vi.fn().mockResolvedValue(mockUser),
        },
      },
    } as never);

    expect(result.type).toBe('success');
    if (result.type === 'success') {
      expect(result.user).toEqual({
        id: 'test-user-id',
        username: 'testuser',
        avatar: 'avatar123',
      });
    }
  });

  it('should return not_found when session does not exist', async () => {
    const result = await getCurrentUser({ sessionId: 'invalid-session' }, {
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
    } as never);

    expect(result.type).toBe('not_found');
  });

  it('should return expired when session is expired', async () => {
    const expiredSession = {
      id: 'expired-session-id',
      userId: 'test-user-id',
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      isExpired: () => true,
    };

    const result = await getCurrentUser({ sessionId: 'expired-session-id' }, {
      logger: mockLogger,
      repositories: {
        sessionsRepository: {
          create: vi.fn(),
          getById: vi.fn().mockResolvedValue(expiredSession),
          deleteById: vi.fn(),
          deleteByUserId: vi.fn(),
        },
        usersRepository: {
          upsert: vi.fn(),
          getByDiscordId: vi.fn(),
        },
      },
    } as never);

    expect(result.type).toBe('expired');
  });
});
