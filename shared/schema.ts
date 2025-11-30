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

export const pricingRules = pgTable("pricing_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  zone: integer("zone").notNull(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  minKm: integer("min_km").notNull(),
  maxKm: integer("max_km").notNull(),
  basePrice: real("base_price").notNull(),
  pricePerKm: real("price_per_km").notNull(),
  tollSurcharge: real("toll_surcharge").notNull().default(0),
  minPrice: real("min_price").notNull(),
  isActive: boolean("is_active").default(true),
});

export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({
  id: true,
});

export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;
export type PricingRule = typeof pricingRules.$inferSelect;

export const vehicleTypes = pgTable("vehicle_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  capacity: text("capacity"),
  priceMultiplier: real("price_multiplier").notNull().default(1),
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
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  originCoords: text("origin_coords"),
  destinationCoords: text("destination_coords"),
  distance: real("distance").notNull(),
  duration: integer("duration"),
  vehicleTypeId: varchar("vehicle_type_id"),
  vehicleTypeName: text("vehicle_type_name"),
  pricingRuleId: varchar("pricing_rule_id"),
  zoneName: text("zone_name"),
  basePrice: real("base_price").notNull(),
  distanceCost: real("distance_cost").notNull(),
  tollCost: real("toll_cost").notNull().default(0),
  vehicleMultiplier: real("vehicle_multiplier").notNull().default(1),
  extras: text("extras"),
  extrasCost: real("extras_cost").notNull().default(0),
  totalPrice: real("total_price").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
});

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

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
  origin: z.string().min(1),
  destination: z.string().min(1),
  vehicleTypeId: z.string().min(1),
  destinationCountry: z.string().default("España"),
  extras: z.object({
    urgente: z.boolean().optional(),
    cargaFragil: z.boolean().optional(),
    seguroExtra: z.boolean().optional(),
  }).optional(),
});

export type GeocodeRequest = z.infer<typeof geocodeRequestSchema>;
export type RouteRequest = z.infer<typeof routeRequestSchema>;
export type CalculateQuoteRequest = z.infer<typeof calculateQuoteRequestSchema>;
