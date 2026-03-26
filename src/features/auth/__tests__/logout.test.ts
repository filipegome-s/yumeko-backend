import type { Logger } from 'pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logout } from '../logout';

describe('logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully logout a session', async () => {
    const deleteById = vi.fn().mockResolvedValue(undefined);

    const result = await logout({ sessionId: 'test-session-id' }, {
      logger: {
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
      } as unknown as Logger,
      repositories: {
        usersRepository: {
          upsert: vi.fn(),
          getByDiscordId: vi.fn(),
        },
        sessionsRepository: {
          create: vi.fn(),
          getById: vi.fn(),
          deleteById,
          deleteByUserId: vi.fn(),
        },
      },
    } as any);

    expect(result.type).toBe('success');
    expect(deleteById).toHaveBeenCalledWith('test-session-id');
  });
});
