import type { User } from '../entities';

type UpsertResult = { ok: true; data: User } | { ok: false; error: 'persistence_error' };

export interface UsersRepository {
  upsert(user: User): Promise<UpsertResult>;
  getByDiscordId(discordId: string): Promise<User | null>;
}
