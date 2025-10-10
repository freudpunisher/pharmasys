ALTER TABLE "medications" DROP CONSTRAINT "medications_code_unique";--> statement-breakpoint
ALTER TABLE "medications" DROP CONSTRAINT "medications_family_id_families_id_fk";
--> statement-breakpoint
ALTER TABLE "medications" DROP CONSTRAINT "medications_unit_id_units_id_fk";
--> statement-breakpoint
ALTER TABLE "medications" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "medications" ALTER COLUMN "dosage_form" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "medications" ALTER COLUMN "dosage_form" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "medications" ALTER COLUMN "alert_level" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "medications" ALTER COLUMN "stock_quantity" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "total_amount" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "tax_amount" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "discount_amount" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "medications" ADD COLUMN "family" varchar(255);--> statement-breakpoint
ALTER TABLE "medications" ADD COLUMN "unit" varchar(50);--> statement-breakpoint
ALTER TABLE "medications" DROP COLUMN "created_at";