export class User {
  readonly id: string;
  readonly discordId: string;
  readonly username: string;
  readonly avatar: string | null;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: {
    id: string;
    discordId: string;
    username: string;
    avatar: string | null;
    accessToken: string;
    refreshToken: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.discordId = params.discordId;
    this.username = params.username;
    this.avatar = params.avatar;
    this.accessToken = params.accessToken;
    this.refreshToken = params.refreshToken;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}
