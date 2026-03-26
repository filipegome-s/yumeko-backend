CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`discord_id` varchar(255) NOT NULL,
	`username` varchar(255) NOT NULL,
	`avatar` text,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_discord_id_unique` UNIQUE(`discord_id`)
);
--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);