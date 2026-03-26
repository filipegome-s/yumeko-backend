import { index, mysqlTable, text, timestamp, varchar } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  discordId: varchar('discord_id', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 255 }).notNull(),
  avatar: text('avatar'),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const sessions = mysqlTable(
  'sessions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
  }),
);
