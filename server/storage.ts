import {
  type User,
  type InsertUser,
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
  
  getVehicleTypes(): Promise<VehicleType[]>;
  getAllVehicleTypes(): Promise<VehicleType[]>;
  getVehicleType(id: string): Promise<VehicleType | undefined>;
  createVehicleType(vehicle: InsertVehicleType): Promise<VehicleType>;
  updateVehicleType(id: string, vehicle: Partial<InsertVehicleType>): Promise<VehicleType | undefined>;
  deleteVehicleType(id: string): Promise<boolean>;
  
  getQuotes(userId?: string): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuoteStatus(id: string, status: string): Promise<Quote | undefined>;
}

const defaultVehicleTypes: VehicleType[] = [
  { 
    id: "moto", 
    name: "Servicio Moto", 
    description: "Hasta 5 kg, 40x30x40 cm",
    capacity: "5 kg",
    pricePerKm: 0.54,
    directionPrice: 3.70,
    minimumPrice: 3.70,
    isActive: true 
  },
  { 
    id: "furgoneta", 
    name: "Servicio Furgoneta", 
    description: "Hasta 200 kg, 1 palé",
    capacity: "200 kg, 1 Palet",
    pricePerKm: 0.55,
    directionPrice: 5.15,
    minimumPrice: 7.50,
    isActive: true 
  },
  { 
    id: "furgon", 
    name: "Servicio Furgón", 
    description: "Hasta 1.400 kg, 5 palés",
    capacity: "1.400 kg, 5 Palets",
    pricePerKm: 0.65,
    directionPrice: 6.00,
    minimumPrice: 9.00,
    isActive: true 
  },
  { 
    id: "carrozado", 
    name: "Servicio Carrozado", 
    description: "Hasta 1.000 kg, 8 palés",
    capacity: "1.000 kg, 8 Palets",
    pricePerKm: 0.75,
    directionPrice: 7.00,
    minimumPrice: 10.00,
    isActive: true 
  },
];

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private vehicleTypes: Map<string, VehicleType>;
  private quotes: Map<string, Quote>;

  constructor() {
    this.users = new Map();
    this.vehicleTypes = new Map();
    this.quotes = new Map();
    
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

  async getVehicleTypes(): Promise<VehicleType[]> {
    return Array.from(this.vehicleTypes.values()).filter((v) => v.isActive);
  }

  async getAllVehicleTypes(): Promise<VehicleType[]> {
    return Array.from(this.vehicleTypes.values());
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
      pricePerKm: vehicle.pricePerKm,
      directionPrice: vehicle.directionPrice ?? 0,
      minimumPrice: vehicle.minimumPrice,
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
      customerName: quote.customerName ?? null,
      phoneNumber: quote.phoneNumber ?? null,
      origin: quote.origin,
      destination: quote.destination,
      originCoords: quote.originCoords ?? null,
      destinationCoords: quote.destinationCoords ?? null,
      distance: quote.distance,
      duration: quote.duration ?? null,
      vehicleTypeId: quote.vehicleTypeId ?? null,
      vehicleTypeName: quote.vehicleTypeName ?? null,
      distanceCost: quote.distanceCost,
      directionCost: quote.directionCost ?? 0,
      totalPrice: quote.totalPrice,
      isUrgent: quote.isUrgent ?? false,
      pickupTime: quote.pickupTime ?? null,
      observations: quote.observations ?? null,
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
