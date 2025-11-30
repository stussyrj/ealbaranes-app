import {
  type User,
  type InsertUser,
  type PricingRule,
  type InsertPricingRule,
  type VehicleType,
  type InsertVehicleType,
  type Quote,
  type InsertQuote,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getPricingRules(): Promise<PricingRule[]>;
  getPricingRule(id: string): Promise<PricingRule | undefined>;
  createPricingRule(rule: InsertPricingRule): Promise<PricingRule>;
  updatePricingRule(id: string, rule: Partial<InsertPricingRule>): Promise<PricingRule | undefined>;
  deletePricingRule(id: string): Promise<boolean>;
  
  getVehicleTypes(): Promise<VehicleType[]>;
  getVehicleType(id: string): Promise<VehicleType | undefined>;
  createVehicleType(vehicle: InsertVehicleType): Promise<VehicleType>;
  updateVehicleType(id: string, vehicle: Partial<InsertVehicleType>): Promise<VehicleType | undefined>;
  deleteVehicleType(id: string): Promise<boolean>;
  
  getQuotes(userId?: string): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuoteStatus(id: string, status: string): Promise<Quote | undefined>;
}

const defaultPricingRules: PricingRule[] = [
  { id: "zone-1", zone: 1, name: "Local", country: "España", minKm: 0, maxKm: 10, basePrice: 15, pricePerKm: 0.80, tollSurcharge: 0, minPrice: 15, isActive: true },
  { id: "zone-2", zone: 2, name: "Local Extendido", country: "España", minKm: 10, maxKm: 50, basePrice: 25, pricePerKm: 0.75, tollSurcharge: 0, minPrice: 25, isActive: true },
  { id: "zone-3", zone: 3, name: "Regional", country: "España", minKm: 50, maxKm: 200, basePrice: 60, pricePerKm: 0.65, tollSurcharge: 0, minPrice: 60, isActive: true },
  { id: "zone-4", zone: 4, name: "Inter-regional", country: "España", minKm: 200, maxKm: 800, basePrice: 200, pricePerKm: 0.50, tollSurcharge: 10, minPrice: 120, isActive: true },
  { id: "zone-5", zone: 5, name: "Internacional Portugal", country: "Portugal", minKm: 0, maxKm: 800, basePrice: 220, pricePerKm: 0.60, tollSurcharge: 15, minPrice: 140, isActive: true },
  { id: "zone-6", zone: 6, name: "Internacional Francia", country: "Francia", minKm: 0, maxKm: 800, basePrice: 240, pricePerKm: 0.65, tollSurcharge: 20, minPrice: 160, isActive: true },
];

const defaultVehicleTypes: VehicleType[] = [
  { id: "van", name: "Furgoneta", description: "Ideal para envíos pequeños y mudanzas urbanas", capacity: "Hasta 800kg / 8m³", priceMultiplier: 1.0, isActive: true },
  { id: "truck-small", name: "Camión Pequeño (3.5t)", description: "Para cargas medianas y distancias cortas", capacity: "Hasta 3.5t / 20m³", priceMultiplier: 1.15, isActive: true },
  { id: "truck-medium", name: "Camión Mediano (7.5t)", description: "Transporte regional de mercancías", capacity: "Hasta 7.5t / 40m³", priceMultiplier: 1.35, isActive: true },
  { id: "truck-large", name: "Camión Grande (12t)", description: "Cargas pesadas y largas distancias", capacity: "Hasta 12t / 60m³", priceMultiplier: 1.55, isActive: true },
  { id: "trailer", name: "Tráiler (24t)", description: "Transporte de gran volumen nacional e internacional", capacity: "Hasta 24t / 90m³", priceMultiplier: 1.85, isActive: true },
];

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private pricingRules: Map<string, PricingRule>;
  private vehicleTypes: Map<string, VehicleType>;
  private quotes: Map<string, Quote>;

  constructor() {
    this.users = new Map();
    this.pricingRules = new Map();
    this.vehicleTypes = new Map();
    this.quotes = new Map();
    
    defaultPricingRules.forEach((rule) => this.pricingRules.set(rule.id, rule));
    defaultVehicleTypes.forEach((vehicle) => this.vehicleTypes.set(vehicle.id, vehicle));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  async getPricingRules(): Promise<PricingRule[]> {
    return Array.from(this.pricingRules.values()).sort((a, b) => a.zone - b.zone);
  }

  async getPricingRule(id: string): Promise<PricingRule | undefined> {
    return this.pricingRules.get(id);
  }

  async createPricingRule(rule: InsertPricingRule): Promise<PricingRule> {
    const id = randomUUID();
    const newRule: PricingRule = {
      id,
      zone: rule.zone,
      name: rule.name,
      country: rule.country,
      minKm: rule.minKm,
      maxKm: rule.maxKm,
      basePrice: rule.basePrice,
      pricePerKm: rule.pricePerKm,
      tollSurcharge: rule.tollSurcharge ?? 0,
      minPrice: rule.minPrice,
      isActive: rule.isActive ?? true,
    };
    this.pricingRules.set(id, newRule);
    return newRule;
  }

  async updatePricingRule(id: string, updates: Partial<InsertPricingRule>): Promise<PricingRule | undefined> {
    const existing = this.pricingRules.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.pricingRules.set(id, updated);
    return updated;
  }

  async deletePricingRule(id: string): Promise<boolean> {
    return this.pricingRules.delete(id);
  }

  async getVehicleTypes(): Promise<VehicleType[]> {
    return Array.from(this.vehicleTypes.values()).filter((v) => v.isActive);
  }

  async getVehicleType(id: string): Promise<VehicleType | undefined> {
    return this.vehicleTypes.get(id);
  }

  async createVehicleType(vehicle: InsertVehicleType): Promise<VehicleType> {
    const id = randomUUID();
    const newVehicle: VehicleType = {
      id,
      name: vehicle.name,
      description: vehicle.description ?? null,
      capacity: vehicle.capacity ?? null,
      priceMultiplier: vehicle.priceMultiplier ?? 1,
      isActive: vehicle.isActive ?? true,
    };
    this.vehicleTypes.set(id, newVehicle);
    return newVehicle;
  }

  async updateVehicleType(id: string, updates: Partial<InsertVehicleType>): Promise<VehicleType | undefined> {
    const existing = this.vehicleTypes.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.vehicleTypes.set(id, updated);
    return updated;
  }

  async deleteVehicleType(id: string): Promise<boolean> {
    return this.vehicleTypes.delete(id);
  }

  async getQuotes(userId?: string): Promise<Quote[]> {
    const allQuotes = Array.from(this.quotes.values());
    if (userId) {
      return allQuotes.filter((q) => q.userId === userId);
    }
    return allQuotes.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    return this.quotes.get(id);
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const id = randomUUID();
    const newQuote: Quote = {
      id,
      userId: quote.userId ?? null,
      origin: quote.origin,
      destination: quote.destination,
      originCoords: quote.originCoords ?? null,
      destinationCoords: quote.destinationCoords ?? null,
      distance: quote.distance,
      duration: quote.duration ?? null,
      vehicleTypeId: quote.vehicleTypeId ?? null,
      vehicleTypeName: quote.vehicleTypeName ?? null,
      pricingRuleId: quote.pricingRuleId ?? null,
      zoneName: quote.zoneName ?? null,
      basePrice: quote.basePrice,
      distanceCost: quote.distanceCost,
      tollCost: quote.tollCost ?? 0,
      vehicleMultiplier: quote.vehicleMultiplier ?? 1,
      extras: quote.extras ?? null,
      extrasCost: quote.extrasCost ?? 0,
      totalPrice: quote.totalPrice,
      status: quote.status ?? "pending",
      createdAt: new Date(),
    };
    this.quotes.set(id, newQuote);
    return newQuote;
  }

  async updateQuoteStatus(id: string, status: string): Promise<Quote | undefined> {
    const existing = this.quotes.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, status };
    this.quotes.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
