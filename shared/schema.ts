import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const workers = pgTable("workers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  isActive: boolean("is_active").default(true),
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
});

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

export const deliveryNotes = pgTable("delivery_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id").notNull(),
  workerId: varchar("worker_id").notNull(),
  clientName: text("client_name"),
  pickupOrigin: text("pickup_origin"),
  destination: text("destination"),
  vehicleType: text("vehicle_type"),
  date: text("date"),
  time: text("time"),
  observations: text("observations"),
  status: text("status").default("pending"),
  signature: text("signature"),
  signedAt: timestamp("signed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDeliveryNoteSchema = createInsertSchema(deliveryNotes).omit({
  id: true,
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
