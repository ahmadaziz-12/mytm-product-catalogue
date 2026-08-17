import type { D1Database, R2Bucket, Fetcher } from "@cloudflare/workers-types";

declare module "cloudflare:workers" {
    export const env: {
        DB: D1Database;
        MEDIA: R2Bucket;
        ASSETS: Fetcher;
    };
}
