import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';

const paramsSchema = z.object({});

export type GetDiscordAuthUrlParams = z.input<typeof paramsSchema>;
export type GetDiscordAuthUrlResult = { type: 'success'; url: string };

export async function getDiscordAuthUrl(
  _params: GetDiscordAuthUrlParams,
  { config }: UseCaseDependencies,
): Promise<GetDiscordAuthUrlResult> {
  const params = new URLSearchParams({
    client_id: config.discord.clientId,
    redirect_uri: config.discord.redirectUri,
    response_type: 'code',
    scope: 'identify',
  });

  const url = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

  return { type: 'success', url };
}
