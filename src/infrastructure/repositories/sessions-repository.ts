import { Session } from '@domain/entities';
import type { SessionsRepository } from '@domain/repositories';
import { eq } from 'drizzle-orm';
import type { Database } from '../db';
import { sessions } from '../db/schema';

export function makeSessionsRepository(db: Database): SessionsRepository {
  return {
    async create(session) {
      await db.insert(sessions).values({
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
      });
      return { ok: true, data: session };
    },

    async getById(id) {
      const record = await db.query.sessions.findFirst({
        where: eq(sessions.id, id),
      });
      if (!record) {
        return null;
      }
      return toEntity(record);
    },

    async deleteById(id) {
      await db.delete(sessions).where(eq(sessions.id, id));
    },

    async deleteByUserId(userId) {
      await db.delete(sessions).where(eq(sessions.userId, userId));
    },
  };
}

function toEntity(record: { id: string; userId: string; expiresAt: Date; createdAt: Date }): Session {
  return new Session({
    id: record.id,
    userId: record.userId,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
  });
}
