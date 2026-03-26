import type { SessionsRepository } from '@domain/repositories';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';

const paramsSchema = z.object({
  sessionId: z.string().min(1),
});

export type LogoutParams = z.input<typeof paramsSchema>;
export type LogoutResult = { type: 'success' };

export async function logout(
  params: LogoutParams,
  {
    logger,
    repositories,
  }: UseCaseDependencies & {
    repositories: { sessionsRepository: SessionsRepository };
  },
): Promise<LogoutResult> {
  const validated = paramsSchema.parse(params);

  logger.info({ sessionId: validated.sessionId }, 'Logging out session');

  await repositories.sessionsRepository.deleteById(validated.sessionId);

  return { type: 'success' };
}
