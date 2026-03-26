import { describe, expect, it } from 'vitest';
import { getDiscordAuthUrl } from '../../src/features/auth/get-discord-auth-url';

describe('getDiscordAuthUrl', () => {
  it('should return a valid Discord OAuth URL', async () => {
    const result = await getDiscordAuthUrl(
      {},
      {
        config: {
          corsOrigin: undefined,
          DATABASE_URL: 'mysql://localhost:3306/test',
          env: 'development' as const,
          logLevel: 'info' as const,
          loggerEnabled: true,
          port: 3000,
          discord: {
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            redirectUri: 'http://localhost:3000/callback',
          },
          sessionSecret: 'test-secret',
        },
        logger: {} as never,
        repositories: {} as never,
      },
    );

    expect(result.type).toBe('success');
    expect(result.url).toContain('https://discord.com/api/oauth2/authorize');
    expect(result.url).toContain('client_id=test-client-id');
    expect(result.url).toContain('redirect_uri=');
    expect(result.url).toContain('response_type=code');
    expect(result.url).toContain('scope=identify');
  });
});
