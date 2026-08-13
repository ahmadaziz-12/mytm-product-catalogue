CREATE TABLE `case_studies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_name` text NOT NULL,
	`challenge` text NOT NULL,
	`solution` text NOT NULL,
	`impact` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`company` text NOT NULL,
	`notes` text NOT NULL,
	`product_interest` text DEFAULT 'None' NOT NULL,
	`service_interest` text DEFAULT 'None' NOT NULL,
	`source` text NOT NULL,
	`content_accessed` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'New' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`url` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_key_unique` ON `media` (`key`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`category` text NOT NULL,
	`short_description` text NOT NULL,
	`full_description` text NOT NULL,
	`features` text NOT NULL,
	`benefits` text NOT NULL,
	`video_url` text DEFAULT '' NOT NULL,
	`pdf_url` text DEFAULT '' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`require_lead` integer DEFAULT true NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`short_description` text NOT NULL,
	`features` text NOT NULL,
	`cta` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `services_slug_unique` ON `services` (`slug`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
