import type { Session } from '../entities';

type CreateResult = { ok: true; data: Session } | { ok: false; error: 'persistence_error' };

export interface SessionsRepository {
  create(session: Session): Promise<CreateResult>;
  getById(id: string): Promise<Session | null>;
  deleteById(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
