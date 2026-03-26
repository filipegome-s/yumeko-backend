import type { SessionsRepository } from '@domain/repositories';
import type { UseCaseDependencies } from '@infrastructure/di';

export type LogoutAllParams = { userId: string };
export type LogoutAllResult = { type: 'success'; count: number };

export async function logoutAll(
  params: LogoutAllParams,
  {
    logger,
    repositories,
  }: UseCaseDependencies & {
    repositories: { sessionsRepository: SessionsRepository };
  },
): Promise<LogoutAllResult> {
  const { userId } = params;

  logger.info({ userId }, 'Logging out all sessions');

  await repositories.sessionsRepository.deleteByUserId(userId);

  logger.info({ userId }, 'All sessions deleted');

  return { type: 'success', count: 0 };
}
