import type { SessionsRepository, UsersRepository } from '@domain/repositories';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';

const paramsSchema = z.object({
  sessionId: z.string().min(1),
});

export type GetCurrentUserParams = z.input<typeof paramsSchema>;

export type GetCurrentUserResult =
  | { type: 'success'; user: { id: string; username: string; avatar: string | null } }
  | { type: 'not_found' }
  | { type: 'expired' };

export async function getCurrentUser(
  params: GetCurrentUserParams,
  {
    logger,
    repositories,
  }: UseCaseDependencies & {
    repositories: { sessionsRepository: SessionsRepository; usersRepository: UsersRepository };
  },
): Promise<GetCurrentUserResult> {
  const validated = paramsSchema.parse(params);

  logger.info({ sessionId: validated.sessionId }, 'Getting current user');

  const session = await repositories.sessionsRepository.getById(validated.sessionId);

  if (!session) {
    logger.info({ sessionId: validated.sessionId }, 'Session not found');
    return { type: 'not_found' };
  }

  if (session.isExpired()) {
    logger.info({ sessionId: validated.sessionId }, 'Session expired');
    return { type: 'expired' };
  }

  const user = await repositories.usersRepository.getByDiscordId(session.userId);

  if (!user) {
    logger.info({ sessionId: validated.sessionId }, 'User not found');
    return { type: 'not_found' };
  }

  return {
    type: 'success',
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
    },
  };
}
