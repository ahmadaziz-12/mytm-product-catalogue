ALTER TABLE `products` ADD `thumbnail_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `services` ADD `thumbnail_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `services` ADD `video_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `services` ADD `pdf_url` text DEFAULT '' NOT NULL;