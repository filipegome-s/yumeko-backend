import { randomUUID } from 'node:crypto';
import { Session, User } from '@domain/entities';
import type { SessionsRepository, UsersRepository } from '@domain/repositories';
import { encrypt } from '@infrastructure/crypto';
import type { UseCaseDependencies } from '@infrastructure/di';
import type { APIUser, RESTPostOAuth2AccessTokenResult } from 'discord-api-types/v10';
import { z } from 'zod';

const paramsSchema = z.object({
  code: z.string().min(1),
});

export type HandleDiscordCallbackParams = z.input<typeof paramsSchema>;

export type HandleDiscordCallbackResult =
  | { type: 'success'; sessionId: string }
  | { type: 'error' }
  | { type: 'invalid_code' };

export async function handleDiscordCallback(
  params: HandleDiscordCallbackParams,
  {
    config,
    logger,
    repositories,
  }: UseCaseDependencies & {
    repositories: { usersRepository: UsersRepository; sessionsRepository: SessionsRepository };
  },
): Promise<HandleDiscordCallbackResult> {
  const validated = paramsSchema.parse(params);

  logger.info('Handling Discord OAuth callback');

  const tokenResponse = await exchangeCodeForToken(validated.code, config);

  if (!tokenResponse) {
    logger.error('Failed to exchange code for token');
    return { type: 'invalid_code' };
  }

  const discordUser = await fetchDiscordUser(tokenResponse.access_token);

  if (!discordUser) {
    logger.error('Failed to fetch Discord user');
    return { type: 'error' };
  }

  const user = new User({
    id: randomUUID(),
    discordId: discordUser.id,
    username: discordUser.username,
    avatar: discordUser.avatar ?? null,
    accessToken: encrypt(tokenResponse.access_token),
    refreshToken: encrypt(tokenResponse.refresh_token),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const userResult = await repositories.usersRepository.upsert(user);

  if (!userResult.ok) {
    logger.error('Failed to upsert user');
    return { type: 'error' };
  }

  const session = new Session({
    id: randomUUID(),
    userId: userResult.data.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  });

  const sessionResult = await repositories.sessionsRepository.create(session);

  if (!sessionResult.ok) {
    logger.error('Failed to create session');
    return { type: 'error' };
  }

  logger.info({ userId: userResult.data.id }, 'User authenticated successfully');

  return { type: 'success', sessionId: sessionResult.data.id };
}

async function exchangeCodeForToken(
  code: string,
  config: {
    discord: { clientId: string; clientSecret: string; redirectUri: string };
  },
): Promise<RESTPostOAuth2AccessTokenResult | null> {
  const params = new URLSearchParams({
    client_id: config.discord.clientId,
    client_secret: config.discord.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.discord.redirectUri,
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

    return response.json() as Promise<RESTPostOAuth2AccessTokenResult>;
  } catch {
    return null;
  }
}

async function fetchDiscordUser(accessToken: string): Promise<APIUser | null> {
  try {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.json() as Promise<APIUser>;
  } catch {
    return null;
  }
}
