import { pgTable, text, boolean, timestamp, uuid, decimal, integer, date, json } from "drizzle-orm/pg-core";

// ============================================
// BETTER AUTH CORE TABLES (UNCHANGED)
// ============================================

export const user = pgTable("user", {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('emailVerified').default(false).notNull(),
    image: text('image'),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull()
});

export const session = pgTable("session", {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('createdAt', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    activeOrganizationId: text('activeOrganizationId').references(() => organization.id, { onDelete: 'set null' })
});

export const account = pgTable("account", {
    id: text('id').primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull()
});

export const verification = pgTable("verification", {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow()
});

// ============================================
// BETTER AUTH ORGANIZATION PLUGIN TABLES (UNCHANGED)
// ============================================

export const organization = pgTable("organization", {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    logo: text('logo'),
    metadata: text('metadata'),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

export const member = pgTable("member", {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // KETUA, BENDAHARA, SEKRETARIS, OPERASIONAL, PENGADAAN, NURSE
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

export const invitation = pgTable("invitation", {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    inviterId: text('inviterId').notNull().references(() => member.id, { onDelete: 'cascade' }),
    organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull()
});

export const invitationToken = pgTable("invitationToken", {
    id: text('id').primaryKey(),
    token: text('token').notNull().unique(),
    organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    isActive: boolean('isActive').notNull().default(true),
    maxUsage: integer('maxUsage').notNull().default(1),
    usedCount: integer('usedCount').notNull().default(0),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull()
});

// ============================================
// ABAC - PERMISSIONS & ROLES (IMPROVED)
// ============================================

export const permission = pgTable("permission", {
    id: uuid('id').primaryKey().defaultRandom(),
    resource: text('resource').notNull(), // patients, rooms, contracts, expenses, transactions, approvals
    action: text('action').notNull(), // create, read, update, delete, approve, verify
    description: text('description'),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

export const rolePermission = pgTable("rolePermission", {
    id: uuid('id').primaryKey().defaultRandom(),
    roleName: text('roleName').notNull(), // KETUA, BENDAHARA, SEKRETARIS, OPERASIONAL, PENGADAAN, NURSE
    permissionId: uuid('permissionId').notNull().references(() => permission.id, { onDelete: 'cascade' }),
    // Conditional constraints (ABAC attributes)
    conditions: json('conditions'), // e.g., {"maxAmount": 5000000, "requiresSecondApproval": true}
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

// ============================================
// ROOMS & FACILITIES (UNCHANGED - GOOD AS IS)
// ============================================

export const room = pgTable("room", {
    id: uuid('id').primaryKey().defaultRandom(),
    roomNumber: text('roomNumber').notNull().unique(),
    roomType: text('roomType').notNull(), // VIP, STANDARD, ICU
    capacity: integer('capacity').notNull().default(1),
    baseRate: decimal('baseRate', { precision: 15, scale: 0 }).notNull(),
    status: text('status').notNull().default('AVAILABLE'), // AVAILABLE, OCCUPIED, MAINTENANCE
    description: text('description'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull()
});

export const facility = pgTable("facility", {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    additionalPrice: decimal('additionalPrice', { precision: 15, scale: 0 }).notNull().default('0'),
    description: text('description'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

export const roomFacility = pgTable("roomFacility", {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('roomId').notNull().references(() => room.id, { onDelete: 'cascade' }),
    facilityId: uuid('facilityId').notNull().references(() => facility.id, { onDelete: 'cascade' }),
    addedAt: timestamp('addedAt', { withTimezone: true }).defaultNow().notNull()
});

// ============================================
// PATIENTS & CONTRACTS (SIMPLIFIED & IMPROVED)
// ============================================

export const patient = pgTable("patient", {
    id: uuid('id').primaryKey().defaultRandom(),
    patientCode: text('patientCode').notNull().unique(), // AUTO: PAT-YYYYMMDD-XXX
    name: text('name').notNull(),
    birthDate: date('birthDate').notNull(),
    gender: text('gender').notNull(), // MALE, FEMALE, OTHER
    address: text('address'),
    phone: text('phone'),
    emergencyContact: text('emergencyContact'),
    emergencyPhone: text('emergencyPhone'),
    medicalNotes: text('medicalNotes'),
    organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'restrict' }),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull()
});

// Main contract table - represents the patient's stay agreement
export const patientContract = pgTable("patientContract", {
    id: uuid('id').primaryKey().defaultRandom(),
    contractCode: text('contractCode').notNull().unique(), // AUTO: CTR-YYYYMMDD-XXX
    patientId: uuid('patientId').notNull().references(() => patient.id, { onDelete: 'restrict' }),
    roomId: uuid('roomId').notNull().references(() => room.id, { onDelete: 'restrict' }),
    
    // Contract terms
    monthlyRate: decimal('monthlyRate', { precision: 15, scale: 0 }).notNull(), // e.g., 2,000,000
    paymentDueDay: integer('paymentDueDay').notNull().default(1), // Day of month (1-28)
    
    // Contract period
    startDate: date('startDate').notNull(),
    endDate: date('endDate'), // NULL = ongoing contract
    
    // Status
    status: text('status').notNull().default('ACTIVE'), // ACTIVE, COMPLETED, TERMINATED
    
    // Metadata
    registeredByUserId: text('registeredByUserId').notNull().references(() => user.id),
    terminatedAt: timestamp('terminatedAt', { withTimezone: true }),
    terminatedByUserId: text('terminatedByUserId').references(() => user.id),
    terminationReason: text('terminationReason'),
    notes: text('notes'),
    
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull()
});

// Contracted facilities included in monthly rate
export const contractFacility = pgTable("contractFacility", {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contractId').notNull().references(() => patientContract.id, { onDelete: 'cascade' }),
    facilityId: uuid('facilityId').notNull().references(() => facility.id, { onDelete: 'restrict' }),
    priceAtContract: decimal('priceAtContract', { precision: 15, scale: 0 }).notNull()
});

// ============================================
// BILLING PERIODS - MONTHLY CYCLES
// ============================================

export const billingPeriod = pgTable("billingPeriod", {
    id: uuid('id').primaryKey().defaultRandom(),
    periodCode: text('periodCode').notNull().unique(), // AUTO: PER-YYYYMM-XXX
    contractId: uuid('contractId').notNull().references(() => patientContract.id, { onDelete: 'restrict' }),
    
    // Period definition
    periodYear: integer('periodYear').notNull(), // 2024, 2025
    periodMonth: integer('periodMonth').notNull(), // 1-12
    periodStartDate: date('periodStartDate').notNull(),
    periodEndDate: date('periodEndDate').notNull(),
    
    // Charges breakdown
    baseMonthlyRate: decimal('baseMonthlyRate', { precision: 15, scale: 0 }).notNull(), // From contract
    nursingCharge: decimal('nursingCharge', { precision: 15, scale: 0 }).notNull().default('0'), // Mandatory
    additionalCharges: decimal('additionalCharges', { precision: 15, scale: 0 }).notNull().default('0'), // Optional extras
    totalCharged: decimal('totalCharged', { precision: 15, scale: 0 }).notNull(), // Sum of all charges
    
    // Expenses deducted from patient's balance
    totalExpenses: decimal('totalExpenses', { precision: 15, scale: 0 }).notNull().default('0'),
    
    // Payment tracking
    totalPaid: decimal('totalPaid', { precision: 15, scale: 0 }).notNull().default('0'),
    
    // Running balance = totalPaid - (totalCharged + totalExpenses)
    // Positive = credit (overpayment), Negative = debt/loan
    balance: decimal('balance', { precision: 15, scale: 0 }).notNull().default('0'),
    
    // Due date for payment
    dueDate: date('dueDate').notNull(),
    
    // Status
    status: text('status').notNull().default('ACTIVE'),
    // ACTIVE - Current period, can add charges/expenses
    // OVERDUE - Past due date, payment not complete
    // SETTLED - Period closed, final balance recorded
    // UNREALIZED - Patient still in room, profit not yet realized
    
    settledAt: timestamp('settledAt', { withTimezone: true }),
    settledByUserId: text('settledByUserId').references(() => user.id),
    
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull()
});

// ============================================
// CHARGES - WHAT PATIENT OWES
// ============================================

export const charge = pgTable("charge", {
    id: uuid('id').primaryKey().defaultRandom(),
    chargeCode: text('chargeCode').notNull().unique(), // AUTO: CHG-YYYYMMDD-XXX
    billingPeriodId: uuid('billingPeriodId').notNull().references(() => billingPeriod.id, { onDelete: 'restrict' }),
    contractId: uuid('contractId').notNull().references(() => patientContract.id, { onDelete: 'restrict' }),
    
    // Charge details
    chargeType: text('chargeType').notNull(), // NURSING (mandatory), DOCTOR, MEDICATION, EQUIPMENT, OTHER
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 15, scale: 0 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: decimal('unitPrice', { precision: 15, scale: 0 }).notNull(),
    
    chargeDate: date('chargeDate').notNull(),
    isMandatory: boolean('isMandatory').notNull().default(false), // TRUE for NURSING
    
    recordedByUserId: text('recordedByUserId').notNull().references(() => user.id),
    notes: text('notes'),
    
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

// ============================================
// EXPENSES - WHAT ORGANIZATION SPENDS ON PATIENT
// ============================================

// Expense categories for both patient expenses and operational expenses
export const expenseCategory = pgTable("expenseCategory", {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull().unique(), // CAT-XXX
    name: text('name').notNull().unique(),
    categoryType: text('categoryType').notNull(), // PATIENT_CARE, OPERATIONAL, CAPITAL
    description: text('description'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

// Patient-specific expenses (deducted from their balance)
export const patientExpense = pgTable("patientExpense", {
    id: uuid('id').primaryKey().defaultRandom(),
    expenseCode: text('expenseCode').notNull().unique(), // AUTO: PEX-YYYYMMDD-XXX
    billingPeriodId: uuid('billingPeriodId').notNull().references(() => billingPeriod.id, { onDelete: 'restrict' }),
    contractId: uuid('contractId').notNull().references(() => patientContract.id, { onDelete: 'restrict' }),
    categoryId: uuid('categoryId').notNull().references(() => expenseCategory.id, { onDelete: 'restrict' }),
    
    // Expense details
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 15, scale: 0 }).notNull(),
    
    // Payment details
    paymentMethod: text('paymentMethod').notNull(), // CASH, BANK_TRANSFER
    bankAccountId: uuid('bankAccountId').references(() => bankAccount.id), // If paid via bank
    
    expenseDate: date('expenseDate').notNull(),
    receiptUrl: text('receiptUrl'), // Photo of receipt
    
    recordedByUserId: text('recordedByUserId').notNull().references(() => user.id),
    notes: text('notes'),
    
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

// ============================================
// PAYMENTS - WHAT PATIENT PAYS
// ============================================

export const payment = pgTable("payment", {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentCode: text('paymentCode').notNull().unique(), // AUTO: PAY-YYYYMMDD-XXX
    contractId: uuid('contractId').notNull().references(() => patientContract.id, { onDelete: 'restrict' }),
    billingPeriodId: uuid('billingPeriodId').references(() => billingPeriod.id, { onDelete: 'set null' }),
    
    // Payment details
    amount: decimal('amount', { precision: 15, scale: 0 }).notNull(),
    paymentMethod: text('paymentMethod').notNull(), // CASH, BANK_TRANSFER
    
    // For bank transfers
    bankAccountId: uuid('bankAccountId').references(() => bankAccount.id),
    transferReferenceNumber: text('transferReferenceNumber'),
    transferProofUrl: text('transferProofUrl'),
    
    // Who paid (family member, etc.)
    paidBy: text('paidBy').notNull(),
    paymentDate: timestamp('paymentDate', { withTimezone: true }).notNull(),
    
    // Verification
    status: text('status').notNull().default('PENDING'), // PENDING, VERIFIED, REJECTED
    verifiedByUserId: text('verifiedByUserId').references(() => user.id),
    verifiedAt: timestamp('verifiedAt', { withTimezone: true }),
    
    receivedByUserId: text('receivedByUserId').notNull().references(() => user.id),
    notes: text('notes'),
    
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

// ============================================
// FINANCIAL TRANSACTIONS (IMPROVED)
// ============================================

// Bank accounts for the organization
export const bankAccount = pgTable("bankAccount", {
    id: uuid('id').primaryKey().defaultRandom(),
    accountName: text('accountName').notNull().unique(), // "BCA 1234567890"
    bankName: text('bankName').notNull(), // "BCA", "Mandiri"
    accountNumber: text('accountNumber').notNull(),
    accountHolder: text('accountHolder').notNull(),
    isActive: boolean('isActive').notNull().default(true),
    currentBalance: decimal('currentBalance', { precision: 15, scale: 0 }).notNull().default('0'),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

// General ledger categories
export const accountCategory = pgTable("accountCategory", {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull().unique(), // ACC-XXX
    name: text('name').notNull().unique(),
    categoryType: text('categoryType').notNull(), // REVENUE, EXPENSE, ASSET, LIABILITY, EQUITY
    parentId: uuid('parentId').references(() => accountCategory.id), // For sub-categories
    description: text('description'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

// All financial transactions
export const transaction = pgTable("transaction", {
    id: uuid('id').primaryKey().defaultRandom(),
    transactionCode: text('transactionCode').notNull().unique(), // AUTO: TRX-YYYYMMDD-XXX
    
    // Transaction classification
    transactionType: text('transactionType').notNull(), // REVENUE, EXPENSE, CAPITAL_INJECTION, TRANSFER
    categoryId: uuid('categoryId').references(() => accountCategory.id, { onDelete: 'restrict' }),
    
    // Amount
    amount: decimal('amount', { precision: 15, scale: 0 }).notNull(),
    
    // Account tracking
    accountType: text('accountType').notNull(), // CASH, BANK
    bankAccountId: uuid('bankAccountId').references(() => bankAccount.id),
    
    // Reference to source
    referenceType: text('referenceType'), // PATIENT_PAYMENT, PATIENT_EXPENSE, OPERATIONAL_EXPENSE, CAPITAL
    referenceId: uuid('referenceId'), // ID of the source record
    
    transactionDate: date('transactionDate').notNull(),
    description: text('description').notNull(),
    proofDocumentUrl: text('proofDocumentUrl'),
    
    // For unrealized revenue tracking
    isRealized: boolean('isRealized').notNull().default(true), // FALSE for patient still in room
    realizedAt: timestamp('realizedAt', { withTimezone: true }),
    
    createdByUserId: text('createdByUserId').notNull().references(() => user.id),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

// Operational expenses (not patient-specific)
export const operationalExpense = pgTable("operationalExpense", {
    id: uuid('id').primaryKey().defaultRandom(),
    expenseCode: text('expenseCode').notNull().unique(), // AUTO: OEX-YYYYMMDD-XXX
    categoryId: uuid('categoryId').notNull().references(() => expenseCategory.id, { onDelete: 'restrict' }),
    
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 15, scale: 0 }).notNull(),
    
    paymentMethod: text('paymentMethod').notNull(), // CASH, BANK_TRANSFER
    bankAccountId: uuid('bankAccountId').references(() => bankAccount.id),
    
    expenseDate: date('expenseDate').notNull(),
    receiptUrl: text('receiptUrl'),
    
    // Approval tracking
    requiresApproval: boolean('requiresApproval').notNull().default(true),
    approvalStatus: text('approvalStatus').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED
    
    transactionId: uuid('transactionId').references(() => transaction.id, { onDelete: 'set null' }),
    recordedByUserId: text('recordedByUserId').notNull().references(() => user.id),
    notes: text('notes'),
    
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

// ============================================
// APPROVALS SYSTEM (IMPROVED)
// ============================================

export const approvalWorkflow = pgTable("approvalWorkflow", {
    id: uuid('id').primaryKey().defaultRandom(),
    workflowName: text('workflowName').notNull().unique(),
    resourceType: text('resourceType').notNull(), // OPERATIONAL_EXPENSE, PATIENT_EXPENSE, PAYMENT_VERIFICATION
    description: text('description'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

export const approvalStep = pgTable("approvalStep", {
    id: uuid('id').primaryKey().defaultRandom(),
    workflowId: uuid('workflowId').notNull().references(() => approvalWorkflow.id, { onDelete: 'cascade' }),
    stepOrder: integer('stepOrder').notNull(), // 1, 2, 3...
    roleName: text('roleName').notNull(), // BENDAHARA, KETUA, etc.
    conditions: json('conditions'), // e.g., {"minAmount": 1000000}
    isRequired: boolean('isRequired').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

export const approval = pgTable("approval", {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // What needs approval
    resourceType: text('resourceType').notNull(), // OPERATIONAL_EXPENSE, PATIENT_EXPENSE, PAYMENT_VERIFICATION
    resourceId: uuid('resourceId').notNull(), // ID of the resource
    
    // Approval chain
    workflowId: uuid('workflowId').notNull().references(() => approvalWorkflow.id),
    currentStepOrder: integer('currentStepOrder').notNull().default(1),
    
    // Status
    status: text('status').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED, CANCELLED
    
    requestedByUserId: text('requestedByUserId').notNull().references(() => user.id),
    requestedAt: timestamp('requestedAt', { withTimezone: true }).defaultNow().notNull(),
    
    completedAt: timestamp('completedAt', { withTimezone: true }),
    
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
});

export const approvalAction = pgTable("approvalAction", {
    id: uuid('id').primaryKey().defaultRandom(),
    approvalId: uuid('approvalId').notNull().references(() => approval.id, { onDelete: 'cascade' }),
    stepOrder: integer('stepOrder').notNull(),
    
    action: text('action').notNull(), // APPROVED, REJECTED, REQUESTED_CHANGES
    approverUserId: text('approverUserId').notNull().references(() => user.id),
    comments: text('comments'),
    
    actionedAt: timestamp('actionedAt', { withTimezone: true }).defaultNow().notNull()
});

// ============================================
// REPORTING & ANALYTICS HELPERS
// ============================================

// Materialized view helper for monthly profit reporting
export const monthlyFinancialSummary = pgTable("monthlyFinancialSummary", {
    id: uuid('id').primaryKey().defaultRandom(),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    
    // Revenue
    totalRevenue: decimal('totalRevenue', { precision: 15, scale: 0 }).notNull().default('0'),
    realizedRevenue: decimal('realizedRevenue', { precision: 15, scale: 0 }).notNull().default('0'),
    unrealizedRevenue: decimal('unrealizedRevenue', { precision: 15, scale: 0 }).notNull().default('0'),
    
    // Expenses
    totalExpenses: decimal('totalExpenses', { precision: 15, scale: 0 }).notNull().default('0'),
    patientCareExpenses: decimal('patientCareExpenses', { precision: 15, scale: 0 }).notNull().default('0'),
    operationalExpenses: decimal('operationalExpenses', { precision: 15, scale: 0 }).notNull().default('0'),
    
    // Net
    grossProfit: decimal('grossProfit', { precision: 15, scale: 0 }).notNull().default('0'),
    netProfit: decimal('netProfit', { precision: 15, scale: 0 }).notNull().default('0'),
    
    // Metadata
    activeContracts: integer('activeContracts').notNull().default(0),
    newContracts: integer('newContracts').notNull().default(0),
    terminatedContracts: integer('terminatedContracts').notNull().default(0),
    
    lastUpdated: timestamp('lastUpdated', { withTimezone: true }).defaultNow().notNull()
});