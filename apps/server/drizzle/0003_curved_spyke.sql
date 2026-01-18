CREATE TABLE `system_configs` (
	`key` text NOT NULL,
	`provider` text NOT NULL,
	`config` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
