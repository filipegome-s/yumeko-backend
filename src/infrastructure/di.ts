import { makeConfig } from './config';
import { createDb } from './db';
import { makeLogger } from './logger';
import { makeSessionsRepository } from './repositories/sessions-repository';
import { makeUsersRepository } from './repositories/users-repository';

export async function makeDependencies() {
  const config = makeConfig();
  const logger = makeLogger(config);

  const db = await createDb(config);

  const usersRepository = makeUsersRepository(db);
  const sessionsRepository = makeSessionsRepository(db);

  return {
    config,
    db,
    logger,
    repositories: {
      usersRepository,
      sessionsRepository,
    },
    dispose: async () => {
      await db.$client.end();
    },
  };
}

export type Dependencies = Awaited<ReturnType<typeof makeDependencies>>;

export type UseCaseDependencies = Pick<Dependencies, 'logger' | 'config' | 'repositories'>;
