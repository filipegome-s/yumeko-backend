import { User } from '@domain/entities';
import type { UsersRepository } from '@domain/repositories';
import { eq } from 'drizzle-orm';
import type { Database } from '../db';
import { users } from '../db/schema';

export function makeUsersRepository(db: Database): UsersRepository {
  return {
    async upsert(user) {
      try {
        const existing = await db.query.users.findFirst({
          where: eq(users.discordId, user.discordId),
        });

        if (existing) {
          await db
            .update(users)
            .set({
              username: user.username,
              avatar: user.avatar,
              accessToken: user.accessToken,
              refreshToken: user.refreshToken,
            })
            .where(eq(users.discordId, user.discordId));

          return { ok: true, data: toEntity({ ...existing, ...user }) };
        }

        await db.insert(users).values({
          id: user.id,
          discordId: user.discordId,
          username: user.username,
          avatar: user.avatar,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
        });

        return { ok: true, data: user };
      } catch (error) {
        console.error('Failed to upsert user:', error);
        return { ok: false, error: 'persistence_error' };
      }
    },

    async getByDiscordId(discordId) {
      const record = await db.query.users.findFirst({
        where: eq(users.discordId, discordId),
      });
      if (!record) {
        return null;
      }
      return toEntity(record);
    },
  };
}

function toEntity(record: {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
  accessToken: string;
  refreshToken: string;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return new User({
    id: record.id,
    discordId: record.discordId,
    username: record.username,
    avatar: record.avatar,
    accessToken: record.accessToken,
    refreshToken: record.refreshToken,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
