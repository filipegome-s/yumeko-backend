export class Session {
  readonly id: string;
  readonly userId: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;

  constructor(params: { id: string; userId: string; expiresAt: Date; createdAt: Date }) {
    this.id = params.id;
    this.userId = params.userId;
    this.expiresAt = params.expiresAt;
    this.createdAt = params.createdAt;
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }
}
