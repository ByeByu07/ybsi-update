CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accountCategory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"categoryType" text NOT NULL,
	"parentId" uuid,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accountCategory_code_unique" UNIQUE("code"),
	CONSTRAINT "accountCategory_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "approval" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resourceType" text NOT NULL,
	"resourceId" uuid NOT NULL,
	"workflowId" uuid NOT NULL,
	"currentStepOrder" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"requestedByUserId" text NOT NULL,
	"requestedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvalAction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"approvalId" uuid NOT NULL,
	"stepOrder" integer NOT NULL,
	"action" text NOT NULL,
	"approverUserId" text NOT NULL,
	"comments" text,
	"actionedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvalStep" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflowId" uuid NOT NULL,
	"stepOrder" integer NOT NULL,
	"roleName" text NOT NULL,
	"conditions" json,
	"isRequired" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvalWorkflow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflowName" text NOT NULL,
	"resourceType" text NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "approvalWorkflow_workflowName_unique" UNIQUE("workflowName")
);
--> statement-breakpoint
CREATE TABLE "bankAccount" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accountName" text NOT NULL,
	"bankName" text NOT NULL,
	"accountNumber" text NOT NULL,
	"accountHolder" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"currentBalance" numeric(15, 0) DEFAULT '0' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bankAccount_accountName_unique" UNIQUE("accountName")
);
--> statement-breakpoint
CREATE TABLE "billingPeriod" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"periodCode" text NOT NULL,
	"contractId" uuid NOT NULL,
	"periodYear" integer NOT NULL,
	"periodMonth" integer NOT NULL,
	"periodStartDate" date NOT NULL,
	"periodEndDate" date NOT NULL,
	"baseMonthlyRate" numeric(15, 0) NOT NULL,
	"nursingCharge" numeric(15, 0) DEFAULT '0' NOT NULL,
	"additionalCharges" numeric(15, 0) DEFAULT '0' NOT NULL,
	"totalCharged" numeric(15, 0) NOT NULL,
	"totalExpenses" numeric(15, 0) DEFAULT '0' NOT NULL,
	"totalPaid" numeric(15, 0) DEFAULT '0' NOT NULL,
	"balance" numeric(15, 0) DEFAULT '0' NOT NULL,
	"dueDate" date NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"settledAt" timestamp with time zone,
	"settledByUserId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billingPeriod_periodCode_unique" UNIQUE("periodCode")
);
--> statement-breakpoint
CREATE TABLE "charge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chargeCode" text NOT NULL,
	"billingPeriodId" uuid NOT NULL,
	"contractId" uuid NOT NULL,
	"chargeType" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(15, 0) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unitPrice" numeric(15, 0) NOT NULL,
	"chargeDate" date NOT NULL,
	"isMandatory" boolean DEFAULT false NOT NULL,
	"recordedByUserId" text NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "charge_chargeCode_unique" UNIQUE("chargeCode")
);
--> statement-breakpoint
CREATE TABLE "contractFacility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractId" uuid NOT NULL,
	"facilityId" uuid NOT NULL,
	"priceAtContract" numeric(15, 0) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenseCategory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"categoryType" text NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenseCategory_code_unique" UNIQUE("code"),
	CONSTRAINT "expenseCategory_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "facility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"additionalPrice" numeric(15, 0) DEFAULT '0' NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "facility_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"inviterId" text NOT NULL,
	"organizationId" text NOT NULL,
	"role" text NOT NULL,
	"status" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitationToken" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"organizationId" text NOT NULL,
	"role" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"maxUsage" integer DEFAULT 1 NOT NULL,
	"usedCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	CONSTRAINT "invitationToken_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"organizationId" text NOT NULL,
	"role" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthlyFinancialSummary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"totalRevenue" numeric(15, 0) DEFAULT '0' NOT NULL,
	"realizedRevenue" numeric(15, 0) DEFAULT '0' NOT NULL,
	"unrealizedRevenue" numeric(15, 0) DEFAULT '0' NOT NULL,
	"totalExpenses" numeric(15, 0) DEFAULT '0' NOT NULL,
	"patientCareExpenses" numeric(15, 0) DEFAULT '0' NOT NULL,
	"operationalExpenses" numeric(15, 0) DEFAULT '0' NOT NULL,
	"grossProfit" numeric(15, 0) DEFAULT '0' NOT NULL,
	"netProfit" numeric(15, 0) DEFAULT '0' NOT NULL,
	"activeContracts" integer DEFAULT 0 NOT NULL,
	"newContracts" integer DEFAULT 0 NOT NULL,
	"terminatedContracts" integer DEFAULT 0 NOT NULL,
	"lastUpdated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operationalExpense" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expenseCode" text NOT NULL,
	"categoryId" uuid NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(15, 0) NOT NULL,
	"paymentMethod" text NOT NULL,
	"bankAccountId" uuid,
	"expenseDate" date NOT NULL,
	"receiptUrl" text,
	"requiresApproval" boolean DEFAULT true NOT NULL,
	"approvalStatus" text DEFAULT 'PENDING' NOT NULL,
	"transactionId" uuid,
	"recordedByUserId" text NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "operationalExpense_expenseCode_unique" UNIQUE("expenseCode")
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "patient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patientCode" text NOT NULL,
	"name" text NOT NULL,
	"birthDate" date NOT NULL,
	"gender" text NOT NULL,
	"address" text,
	"phone" text,
	"emergencyContact" text,
	"emergencyPhone" text,
	"medicalNotes" text,
	"organizationId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patient_patientCode_unique" UNIQUE("patientCode")
);
--> statement-breakpoint
CREATE TABLE "patientContract" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractCode" text NOT NULL,
	"patientId" uuid NOT NULL,
	"roomId" uuid NOT NULL,
	"monthlyRate" numeric(15, 0) NOT NULL,
	"paymentDueDay" integer DEFAULT 1 NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"registeredByUserId" text NOT NULL,
	"terminatedAt" timestamp with time zone,
	"terminatedByUserId" text,
	"terminationReason" text,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patientContract_contractCode_unique" UNIQUE("contractCode")
);
--> statement-breakpoint
CREATE TABLE "patientExpense" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expenseCode" text NOT NULL,
	"billingPeriodId" uuid NOT NULL,
	"contractId" uuid NOT NULL,
	"categoryId" uuid NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(15, 0) NOT NULL,
	"paymentMethod" text NOT NULL,
	"bankAccountId" uuid,
	"expenseDate" date NOT NULL,
	"receiptUrl" text,
	"recordedByUserId" text NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patientExpense_expenseCode_unique" UNIQUE("expenseCode")
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paymentCode" text NOT NULL,
	"contractId" uuid NOT NULL,
	"billingPeriodId" uuid,
	"amount" numeric(15, 0) NOT NULL,
	"paymentMethod" text NOT NULL,
	"bankAccountId" uuid,
	"transferReferenceNumber" text,
	"transferProofUrl" text,
	"paidBy" text NOT NULL,
	"paymentDate" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"verifiedByUserId" text,
	"verifiedAt" timestamp with time zone,
	"receivedByUserId" text NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_paymentCode_unique" UNIQUE("paymentCode")
);
--> statement-breakpoint
CREATE TABLE "permission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rolePermission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roleName" text NOT NULL,
	"permissionId" uuid NOT NULL,
	"conditions" json,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roomNumber" text NOT NULL,
	"roomType" text NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"baseRate" numeric(15, 0) NOT NULL,
	"status" text DEFAULT 'AVAILABLE' NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_roomNumber_unique" UNIQUE("roomNumber")
);
--> statement-breakpoint
CREATE TABLE "roomFacility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roomId" uuid NOT NULL,
	"facilityId" uuid NOT NULL,
	"addedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	"activeOrganizationId" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transactionCode" text NOT NULL,
	"transactionType" text NOT NULL,
	"categoryId" uuid,
	"amount" numeric(15, 0) NOT NULL,
	"accountType" text NOT NULL,
	"bankAccountId" uuid,
	"referenceType" text,
	"referenceId" uuid,
	"transactionDate" date NOT NULL,
	"description" text NOT NULL,
	"proofDocumentUrl" text,
	"isRealized" boolean DEFAULT true NOT NULL,
	"realizedAt" timestamp with time zone,
	"createdByUserId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_transactionCode_unique" UNIQUE("transactionCode")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accountCategory" ADD CONSTRAINT "accountCategory_parentId_accountCategory_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."accountCategory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval" ADD CONSTRAINT "approval_workflowId_approvalWorkflow_id_fk" FOREIGN KEY ("workflowId") REFERENCES "public"."approvalWorkflow"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval" ADD CONSTRAINT "approval_requestedByUserId_user_id_fk" FOREIGN KEY ("requestedByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvalAction" ADD CONSTRAINT "approvalAction_approvalId_approval_id_fk" FOREIGN KEY ("approvalId") REFERENCES "public"."approval"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvalAction" ADD CONSTRAINT "approvalAction_approverUserId_user_id_fk" FOREIGN KEY ("approverUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvalStep" ADD CONSTRAINT "approvalStep_workflowId_approvalWorkflow_id_fk" FOREIGN KEY ("workflowId") REFERENCES "public"."approvalWorkflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billingPeriod" ADD CONSTRAINT "billingPeriod_contractId_patientContract_id_fk" FOREIGN KEY ("contractId") REFERENCES "public"."patientContract"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billingPeriod" ADD CONSTRAINT "billingPeriod_settledByUserId_user_id_fk" FOREIGN KEY ("settledByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_billingPeriodId_billingPeriod_id_fk" FOREIGN KEY ("billingPeriodId") REFERENCES "public"."billingPeriod"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_contractId_patientContract_id_fk" FOREIGN KEY ("contractId") REFERENCES "public"."patientContract"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_recordedByUserId_user_id_fk" FOREIGN KEY ("recordedByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractFacility" ADD CONSTRAINT "contractFacility_contractId_patientContract_id_fk" FOREIGN KEY ("contractId") REFERENCES "public"."patientContract"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractFacility" ADD CONSTRAINT "contractFacility_facilityId_facility_id_fk" FOREIGN KEY ("facilityId") REFERENCES "public"."facility"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_member_id_fk" FOREIGN KEY ("inviterId") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitationToken" ADD CONSTRAINT "invitationToken_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operationalExpense" ADD CONSTRAINT "operationalExpense_categoryId_expenseCategory_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."expenseCategory"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operationalExpense" ADD CONSTRAINT "operationalExpense_bankAccountId_bankAccount_id_fk" FOREIGN KEY ("bankAccountId") REFERENCES "public"."bankAccount"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operationalExpense" ADD CONSTRAINT "operationalExpense_transactionId_transaction_id_fk" FOREIGN KEY ("transactionId") REFERENCES "public"."transaction"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operationalExpense" ADD CONSTRAINT "operationalExpense_recordedByUserId_user_id_fk" FOREIGN KEY ("recordedByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patientContract" ADD CONSTRAINT "patientContract_patientId_patient_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patient"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patientContract" ADD CONSTRAINT "patientContract_roomId_room_id_fk" FOREIGN KEY ("roomId") REFERENCES "public"."room"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patientContract" ADD CONSTRAINT "patientContract_registeredByUserId_user_id_fk" FOREIGN KEY ("registeredByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patientContract" ADD CONSTRAINT "patientContract_terminatedByUserId_user_id_fk" FOREIGN KEY ("terminatedByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patientExpense" ADD CONSTRAINT "patientExpense_billingPeriodId_billingPeriod_id_fk" FOREIGN KEY ("billingPeriodId") REFERENCES "public"."billingPeriod"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patientExpense" ADD CONSTRAINT "patientExpense_contractId_patientContract_id_fk" FOREIGN KEY ("contractId") REFERENCES "public"."patientContract"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patientExpense" ADD CONSTRAINT "patientExpense_categoryId_expenseCategory_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."expenseCategory"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patientExpense" ADD CONSTRAINT "patientExpense_bankAccountId_bankAccount_id_fk" FOREIGN KEY ("bankAccountId") REFERENCES "public"."bankAccount"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patientExpense" ADD CONSTRAINT "patientExpense_recordedByUserId_user_id_fk" FOREIGN KEY ("recordedByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_contractId_patientContract_id_fk" FOREIGN KEY ("contractId") REFERENCES "public"."patientContract"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_billingPeriodId_billingPeriod_id_fk" FOREIGN KEY ("billingPeriodId") REFERENCES "public"."billingPeriod"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_bankAccountId_bankAccount_id_fk" FOREIGN KEY ("bankAccountId") REFERENCES "public"."bankAccount"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_verifiedByUserId_user_id_fk" FOREIGN KEY ("verifiedByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_receivedByUserId_user_id_fk" FOREIGN KEY ("receivedByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolePermission" ADD CONSTRAINT "rolePermission_permissionId_permission_id_fk" FOREIGN KEY ("permissionId") REFERENCES "public"."permission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roomFacility" ADD CONSTRAINT "roomFacility_roomId_room_id_fk" FOREIGN KEY ("roomId") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roomFacility" ADD CONSTRAINT "roomFacility_facilityId_facility_id_fk" FOREIGN KEY ("facilityId") REFERENCES "public"."facility"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_activeOrganizationId_organization_id_fk" FOREIGN KEY ("activeOrganizationId") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_categoryId_accountCategory_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."accountCategory"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_bankAccountId_bankAccount_id_fk" FOREIGN KEY ("bankAccountId") REFERENCES "public"."bankAccount"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;