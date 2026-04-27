CREATE TABLE "learning_sessions" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"tutor_id" varchar(64) NOT NULL,
	"tutor_name" varchar(120) NOT NULL,
	"subject" varchar(120) NOT NULL,
	"when_iso" text NOT NULL,
	"duration_mins" integer NOT NULL,
	"mode" varchar(16) NOT NULL,
	"status" varchar(40) NOT NULL,
	"booked_by_email" varchar(255) NOT NULL,
	"booked_for_role" varchar(16) NOT NULL,
	"hidden_from_ui" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_reads" (
	"user_email" varchar(255) NOT NULL,
	"notification_id" varchar(64) NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_reads_user_email_notification_id_pk" PRIMARY KEY("user_email","notification_id")
);
--> statement-breakpoint
CREATE TABLE "reschedule_requests" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"session_id" varchar(40) NOT NULL,
	"tutor_id" varchar(64) NOT NULL,
	"requester_email" varchar(255) NOT NULL,
	"requester_name" varchar(120) NOT NULL,
	"original_when" text NOT NULL,
	"requested_when" text NOT NULL,
	"note" text,
	"status" varchar(32) DEFAULT 'Pending' NOT NULL,
	"counter_when" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"tutor_id" varchar(64) NOT NULL,
	"rating" integer NOT NULL,
	"text" text NOT NULL,
	"author_name" varchar(120) NOT NULL,
	"author_email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"user_id" varchar(40) NOT NULL,
	"token_id" varchar(40) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_id_unique" UNIQUE("token_id")
);
--> statement-breakpoint
CREATE TABLE "shared_messages" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"request_id" varchar(64) NOT NULL,
	"kind" varchar(24) NOT NULL,
	"from_role" varchar(16) NOT NULL,
	"from_display_name" varchar(120) NOT NULL,
	"from_email" varchar(255) NOT NULL,
	"payload" jsonb NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutor_availability" (
	"owner_email" varchar(255) NOT NULL,
	"slot_key" varchar(20) NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tutor_availability_owner_email_slot_key_pk" PRIMARY KEY("owner_email","slot_key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"role" varchar(16) NOT NULL,
	"profile" jsonb DEFAULT 'null'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;