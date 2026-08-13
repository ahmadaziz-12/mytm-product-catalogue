CREATE INDEX `idx_leads_created_at` ON `leads` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_products_active_order` ON `products` (`active`,`display_order`);--> statement-breakpoint
CREATE INDEX `idx_services_active_order` ON `services` (`active`,`display_order`);