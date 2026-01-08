import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tenantSubscriptionStatusEnum = pgEnum('tenant_subscription_status', [
  'active',
  'past_due', 
  'canceled',
  'in_grace',
  'paused'
]);

export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id"),
  companyName: text("company_name"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: tenantSubscriptionStatusEnum("subscription_status").default('active'),
  currentPeriodEnd: timestamp("current_period_end"),
  canceledAt: timestamp("canceled_at"),
  graceUntil: timestamp("grace_until"),
  retentionUntil: timestamp("retention_until"),
  waitTimeThreshold: integer("wait_time_threshold").default(20),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email"),
  displayName: text("display_name"),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  emailVerified: boolean("email_verified").default(false),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  setupRequired: boolean("setup_required").default(false),
  workerId: varchar("worker_id"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVerificationTokenSchema = createInsertSchema(verificationTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertVerificationToken = z.infer<typeof insertVerificationTokenSchema>;
export type VerificationToken = typeof verificationTokens.$inferSelect;

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  displayName: true,
  password: true,
  isAdmin: true,
  workerId: true,
  tenantId: true,
  setupRequired: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const workers = pgTable("workers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  isActive: boolean("is_active").default(true),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWorkerSchema = createInsertSchema(workers).omit({
  id: true,
  createdAt: true,
});

export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type Worker = typeof workers.$inferSelect;

export const vehicleTypes = pgTable("vehicle_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  capacity: text("capacity"),
  pricePerKm: real("price_per_km").notNull(),
  directionPrice: real("direction_price").notNull().default(0),
  minimumPrice: real("minimum_price").notNull(),
  isActive: boolean("is_active").default(true),
  tenantId: varchar("tenant_id"),
});

export const insertVehicleTypeSchema = createInsertSchema(vehicleTypes).omit({
  id: true,
});

export type InsertVehicleType = z.infer<typeof insertVehicleTypeSchema>;
export type VehicleType = typeof vehicleTypes.$inferSelect;

export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  customerName: text("customer_name"),
  phoneNumber: text("phone_number"),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  originCoords: text("origin_coords"),
  destinationCoords: text("destination_coords"),
  distance: real("distance").notNull(),
  duration: integer("duration"),
  vehicleTypeId: varchar("vehicle_type_id"),
  vehicleTypeName: text("vehicle_type_name"),
  distanceCost: real("distance_cost").notNull(),
  directionCost: real("direction_cost").notNull().default(0),
  totalPrice: real("total_price").notNull(),
  isUrgent: boolean("is_urgent").default(false),
  pickupTime: text("pickup_time"),
  observations: text("observations"),
  status: text("status").default("pending"),
  assignedWorkerId: varchar("assigned_worker_id"),
  confirmedAt: timestamp("confirmed_at"),
  carrozadoUnavailableUntil: timestamp("carrozado_unavailable_until"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
});

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

export const pickupOriginSchema = z.object({
  name: z.string(),
  address: z.string(),
  orderIndex: z.number().optional(),
  status: z.enum(["pending", "completed", "problem"]).optional(),
  quantity: z.string().optional(),
  signerDocument: z.string().optional(),
  incidence: z.string().optional(),
  signature: z.string().optional(),
  signerName: z.string().optional(),
  signedAt: z.string().optional(),
  geoLocation: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

export type PickupOrigin = z.infer<typeof pickupOriginSchema>;

export const deliveryNotes = pgTable("delivery_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  noteNumber: integer("note_number").notNull(),
  quoteId: varchar("quote_id"), // Nullable - optional field
  workerId: varchar("worker_id").notNull(),
  creatorType: text("creator_type").default("worker"),
  clientName: text("client_name"),
  pickupOrigins: jsonb("pickup_origins").$type<PickupOrigin[]>(),
  destination: text("destination"),
  vehicleType: text("vehicle_type"),
  date: text("date"),
  time: text("time"),
  observations: text("observations"),
  waitTime: integer("wait_time"),
  photo: text("photo"),
  distance: real("distance"),
  status: text("status").default("pending"),
  signature: text("signature"),
  signedAt: timestamp("signed_at"),
  originSignature: text("origin_signature"),
  originSignatureDocument: text("origin_signature_document"),
  originSignedAt: timestamp("origin_signed_at"),
  destinationSignature: text("destination_signature"),
  destinationSignatureDocument: text("destination_signature_document"),
  destinationSignedAt: timestamp("destination_signed_at"),
  destinationSignerName: text("destination_signer_name"),
  notes: text("notes"),
  isInvoiced: boolean("is_invoiced").default(false),
  invoicedAt: timestamp("invoiced_at"),
  arrivedAt: timestamp("arrived_at"),
  departedAt: timestamp("departed_at"),
  tenantId: varchar("tenant_id"),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
});

export const insertDeliveryNoteSchema = createInsertSchema(deliveryNotes).omit({
  id: true,
  noteNumber: true,
  createdAt: true,
});

export type InsertDeliveryNote = z.infer<typeof insertDeliveryNoteSchema>;
export type DeliveryNote = typeof deliveryNotes.$inferSelect;

export const geocodeRequestSchema = z.object({
  address: z.string().min(1, "La dirección es requerida"),
});

export const routeRequestSchema = z.object({
  origin: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  destination: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

export const calculateQuoteRequestSchema = z.object({
  name: z.string().min(1),
  phoneNumber: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  vehicleTypeId: z.string().min(1),
  isUrgent: z.boolean().optional(),
  pickupTime: z.string().optional(),
  observations: z.string().optional(),
});

export type GeocodeRequest = z.infer<typeof geocodeRequestSchema>;
export type RouteRequest = z.infer<typeof routeRequestSchema>;
export type CalculateQuoteRequest = z.infer<typeof calculateQuoteRequestSchema>;

// Audit log for tracking important actions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id"),
  userId: varchar("user_id"),
  action: text("action").notNull(), // login, logout, create_delivery_note, update_delivery_note, etc.
  entityType: text("entity_type"), // delivery_note, worker, quote, etc.
  entityId: varchar("entity_id"),
  details: jsonb("details"), // Additional details about the action
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Internal messages (replaces email notifications)
export const messageTypeEnum = pgEnum('message_type', [
  'delivery_note_created',
  'delivery_note_signed',
  'worker_created',
  'system'
]);

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  type: messageTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").default(false),
  entityType: text("entity_type"), // delivery_note, worker, etc.
  entityId: varchar("entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Blog posts for SEO content
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  metaDescription: text("meta_description"),
  coverImage: text("cover_image"),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// Invoice templates for each tenant
export const invoiceTemplates = pgTable("invoice_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull().default("Plantilla Principal"),
  logoUrl: text("logo_url"),
  logoImageBase64: text("logo_image_base64"),
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  companyCity: text("company_city"),
  companyPostalCode: text("company_postal_code"),
  companyCountry: text("company_country").default("España"),
  companyTaxId: text("company_tax_id"),
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  bankName: text("bank_name"),
  bankIban: text("bank_iban"),
  bankSwift: text("bank_swift"),
  defaultTaxRate: real("default_tax_rate").default(21),
  defaultPaymentTerms: text("default_payment_terms").default("Pago a 30 días"),
  footerText: text("footer_text"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceTemplateSchema = createInsertSchema(invoiceTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvoiceTemplate = z.infer<typeof insertInvoiceTemplateSchema>;
export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;

// Invoice status enum
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'sent',
  'paid',
  'cancelled'
]);

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  invoiceNumber: integer("invoice_number").notNull(),
  invoicePrefix: text("invoice_prefix").default("FAC"),
  templateId: varchar("template_id"),
  status: invoiceStatusEnum("status").default('draft'),
  customerName: text("customer_name").notNull(),
  customerAddress: text("customer_address"),
  customerCity: text("customer_city"),
  customerPostalCode: text("customer_postal_code"),
  customerTaxId: text("customer_tax_id"),
  customerEmail: text("customer_email"),
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date"),
  subtotal: real("subtotal").notNull().default(0),
  taxRate: real("tax_rate").default(21),
  taxAmount: real("tax_amount").notNull().default(0),
  total: real("total").notNull().default(0),
  notes: text("notes"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Invoice line items
export const invoiceLineItems = pgTable("invoice_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  deliveryNoteId: varchar("delivery_note_id"),
  description: text("description").notNull(),
  quantity: real("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(),
  subtotal: real("subtotal").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoiceLineItemSchema = createInsertSchema(invoiceLineItems).omit({
  id: true,
  createdAt: true,
});

export type InsertInvoiceLineItem = z.infer<typeof insertInvoiceLineItemSchema>;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;

// Backup logs - registro de respaldos realizados
export const backupLogs = pgTable("backup_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull().default("manual"), // manual, scheduled
  status: text("status").notNull().default("completed"), // completed, failed
  fileName: text("file_name"),
  fileSize: integer("file_size"), // size in bytes
  recordCounts: jsonb("record_counts").$type<{
    deliveryNotes: number;
    invoices: number;
    workers: number;
    vehicleTypes: number;
    users: number;
  }>(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBackupLogSchema = createInsertSchema(backupLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertBackupLog = z.infer<typeof insertBackupLogSchema>;
export type BackupLog = typeof backupLogs.$inferSelect;

// Billing clients for invoice management
export const billingClients = pgTable("billing_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  commercialName: text("commercial_name").notNull(),
  legalName: text("legal_name"),
  taxId: text("tax_id"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").default("España"),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBillingClientSchema = createInsertSchema(billingClients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBillingClient = z.infer<typeof insertBillingClientSchema>;
export type BillingClient = typeof billingClients.$inferSelect;
