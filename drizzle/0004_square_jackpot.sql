CREATE TABLE "stock_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"medication_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"quantity" integer NOT NULL,
	"reference_id" integer,
	"reference_type" varchar(50),
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE no action ON UPDATE no action;