ALTER TABLE `leads` ADD `designation` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `leads` ADD `preferred_date` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `leads` ADD `request_type` text DEFAULT 'General' NOT NULL;
