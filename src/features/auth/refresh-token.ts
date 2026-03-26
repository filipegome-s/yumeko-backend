import type { SessionsRepository, UsersRepository } from '@domain/repositories';
import { decrypt, encrypt } from '@infrastructure/crypto';
import type { UseCaseDependencies } from '@infrastructure/di';

export type RefreshTokenParams = { sessionId: string };
export type RefreshTokenResult = { type: 'success' } | { type: 'error' } | { type: 'not_found' };

interface DiscordTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export async function refreshToken(
  params: RefreshTokenParams,
  {
    config,
    logger,
    repositories,
  }: UseCaseDependencies & {
    repositories: { usersRepository: UsersRepository; sessionsRepository: SessionsRepository };
  },
): Promise<RefreshTokenResult> {
  const { sessionId } = params;

  const session = await repositories.sessionsRepository.getById(sessionId);

  if (!session) {
    logger.info({ sessionId }, 'Session not found for refresh');
    return { type: 'not_found' };
  }

  if (session.isExpired()) {
    logger.info({ sessionId }, 'Session expired for refresh');
    await repositories.sessionsRepository.deleteById(sessionId);
    return { type: 'not_found' };
  }

  const user = await repositories.usersRepository.getByDiscordId(session.userId);

  if (!user) {
    logger.error({ sessionId }, 'User not found for refresh');
    return { type: 'error' };
  }

  const refreshTokenDecrypted = decrypt(user.refreshToken);

  const tokenResponse = await refreshDiscordToken(
    refreshTokenDecrypted,
    config.discord.clientId,
    config.discord.clientSecret,
    config.discord.redirectUri,
  );

  if (!tokenResponse) {
    logger.error({ sessionId }, 'Failed to refresh Discord token');
    return { type: 'error' };
  }

  const updatedUser = new (await import('@domain/entities')).User({
    ...user,
    accessToken: encrypt(tokenResponse.access_token),
    refreshToken: encrypt(tokenResponse.refresh_token),
    updatedAt: new Date(),
  });

  const result = await repositories.usersRepository.upsert(updatedUser);

  if (!result.ok) {
    logger.error({ sessionId }, 'Failed to update user tokens');
    return { type: 'error' };
  }

  logger.info({ sessionId }, 'Token refreshed successfully');
  return { type: 'success' };
}

async function refreshDiscordToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<DiscordTokenResponse | null> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    redirect_uri: redirectUri,
  });

  try {
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      return null;
    }

    return response.json() as Promise<DiscordTokenResponse>;
  } catch {
    return null;
  }
}
