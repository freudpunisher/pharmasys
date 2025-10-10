ALTER TABLE "purchases" ALTER COLUMN "total_amount" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "status" SET DEFAULT 'Pending';--> statement-breakpoint
ALTER TABLE "purchases" DROP COLUMN "created_at";