CREATE TABLE `memberships` (
	`user_id` text PRIMARY KEY NOT NULL,
	`plan` text DEFAULT 'Explore' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`prompt` text NOT NULL,
	`mode` text NOT NULL,
	`duration` integer NOT NULL,
	`storage_key` text NOT NULL,
	`created_at` integer NOT NULL
);
