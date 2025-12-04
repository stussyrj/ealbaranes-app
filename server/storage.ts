import {
  type User,
  type InsertUser,
  type VehicleType,
  type InsertVehicleType,
  type Quote,
  type InsertQuote,
  type Worker,
  type InsertWorker,
  type DeliveryNote,
  type InsertDeliveryNote,
  deliveryNotes as deliveryNotesTable,
  users as usersTable,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, sql, max } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "@neondatabase/serverless";

const PgStore = connectPgSimple(session);

export interface IStorage {
  sessionStore: session.Store;
  
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserPassword(id: string, password: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  getWorkers(includeInactive?: boolean): Promise<Worker[]>;
  getWorker(id: string): Promise<Worker | undefined>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  updateWorker(id: string, worker: Partial<InsertWorker>): Promise<Worker | undefined>;
  deleteWorker(id: string): Promise<boolean>;
  
  getVehicleTypes(): Promise<VehicleType[]>;
  getAllVehicleTypes(): Promise<VehicleType[]>;
  getVehicleType(id: string): Promise<VehicleType | undefined>;
  createVehicleType(vehicle: InsertVehicleType): Promise<VehicleType>;
  updateVehicleType(id: string, vehicle: Partial<InsertVehicleType>): Promise<VehicleType | undefined>;
  deleteVehicleType(id: string): Promise<boolean>;
  
  getQuotes(userId?: string, workerId?: string): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuoteStatus(id: string, status: string): Promise<Quote | undefined>;
  assignQuoteToWorker(quoteId: string, workerId: string): Promise<Quote | undefined>;
  
  getDeliveryNotes(quoteId?: string, workerId?: string): Promise<DeliveryNote[]>;
  getDeliveryNote(id: string): Promise<DeliveryNote | undefined>;
  createDeliveryNote(note: InsertDeliveryNote): Promise<DeliveryNote>;
  updateDeliveryNote(id: string, note: Partial<InsertDeliveryNote>): Promise<DeliveryNote | undefined>;
  getDeliveryNoteSuggestions(tenantId: string): Promise<{ clients: string[], origins: string[], destinations: string[] }>;
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
    isActive: true,
    tenantId: null,
  },
  { 
    id: "furgoneta", 
    name: "Servicio Furgoneta", 
    description: "Hasta 200 kg, 1 palé",
    capacity: "200 kg, 1 Palet",
    pricePerKm: 0.55,
    directionPrice: 5.15,
    minimumPrice: 7.50,
    isActive: true,
    tenantId: null,
  },
  { 
    id: "furgon", 
    name: "Servicio Furgón", 
    description: "Hasta 1.400 kg, 5 palés",
    capacity: "1.400 kg, 5 Palets",
    pricePerKm: 0.65,
    directionPrice: 6.00,
    minimumPrice: 9.00,
    isActive: true,
    tenantId: null,
  },
  { 
    id: "carrozado", 
    name: "Servicio Carrozado", 
    description: "Hasta 1.000 kg, 8 palés",
    capacity: "1.000 kg, 8 Palets",
    pricePerKm: 0.75,
    directionPrice: 7.00,
    minimumPrice: 10.00,
    isActive: true,
    tenantId: null,
  },
];

const defaultWorkers: Worker[] = [
  {
    id: "worker-jose",
    name: "José",
    email: "jose@empresa.com",
    phone: "600000001",
    isActive: true,
    tenantId: null,
    createdAt: new Date(),
  },
  {
    id: "worker-luis",
    name: "Luis",
    email: "luis@empresa.com",
    phone: "600000002",
    isActive: true,
    tenantId: null,
    createdAt: new Date(),
  },
  {
    id: "worker-miguel",
    name: "Miguel",
    email: "miguel@empresa.com",
    phone: "600000003",
    isActive: true,
    tenantId: null,
    createdAt: new Date(),
  },
];

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workers: Map<string, Worker>;
  private vehicleTypes: Map<string, VehicleType>;
  private quotes: Map<string, Quote>;
  private deliveryNotes: Map<string, DeliveryNote>;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.workers = new Map();
    this.vehicleTypes = new Map();
    this.quotes = new Map();
    this.deliveryNotes = new Map();
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    this.sessionStore = new PgStore({
      pool: pool as any,
      tableName: "user_sessions",
      createTableIfMissing: true,
    });
    
    defaultVehicleTypes.forEach((vehicle) => this.vehicleTypes.set(vehicle.id, vehicle));
    defaultWorkers.forEach((worker) => this.workers.set(worker.id, worker));
  }

  isCarrozadoAvailableAtDateTime(pickupTimeStr: string, duration?: number): boolean {
    if (!pickupTimeStr) return true;
    
    const confirmedQuotes = Array.from(this.quotes.values()).filter(
      q => (q.status === "confirmed" || q.status === "approved") && q.vehicleTypeId === "carrozado" && q.pickupTime && q.duration
    );

    const pickupDateTime = pickupTimeStr.split(" ");
    if (pickupDateTime.length !== 2) return true;
    
    const [year, month, day] = pickupDateTime[0].split("-").map(Number);
    const [hours, minutes] = pickupDateTime[1].split(":").map(Number);
    const requestedPickupTime = new Date(year, month - 1, day, hours, minutes, 0);
    
    const estimatedDuration = duration || 30;
    const requestedEndTime = new Date(requestedPickupTime.getTime() + (estimatedDuration * 2 + 30) * 60000);

    for (const quote of confirmedQuotes) {
      if (!quote.pickupTime || !quote.duration) continue;
      
      const confirmedDateTime = quote.pickupTime.split(" ");
      if (confirmedDateTime.length !== 2) continue;
      
      const [qYear, qMonth, qDay] = confirmedDateTime[0].split("-").map(Number);
      const [qHours, qMinutes] = confirmedDateTime[1].split(":").map(Number);
      
      const confirmedPickupTime = new Date(qYear, qMonth - 1, qDay, qHours, qMinutes, 0);
      const confirmedEndTime = new Date(confirmedPickupTime.getTime() + (quote.duration * 2 + 30) * 60000);
      
      if (requestedPickupTime < confirmedEndTime && requestedEndTime > confirmedPickupTime) {
        return false;
      }
    }

    return true;
  }

  getCarrozadoAvailability(): { isBlocked: boolean; unavailableUntil: Date | null } {
    const confirmedQuotes = Array.from(this.quotes.values()).filter(
      q => (q.status === "confirmed" || q.status === "approved") && q.vehicleTypeId === "carrozado" && q.pickupTime && q.duration
    );

    const now = new Date();
    let latestEndTime: Date | null = null;

    for (const quote of confirmedQuotes) {
      if (!quote.pickupTime || !quote.duration) continue;
      
      const pickupDateTime = quote.pickupTime.split(" ");
      if (pickupDateTime.length !== 2) continue;
      
      const [year, month, day] = pickupDateTime[0].split("-").map(Number);
      const [hours, minutes] = pickupDateTime[1].split(":").map(Number);
      
      const pickupDate = new Date(year, month - 1, day, hours, minutes, 0);
      
      if (pickupDate < now) continue;
      
      const endTime = new Date(pickupDate.getTime() + (quote.duration * 2 + 30) * 60000);
      
      if (!latestEndTime || endTime > latestEndTime) {
        latestEndTime = endTime;
      }
    }

    return {
      isBlocked: latestEndTime ? now < latestEndTime : false,
      unavailableUntil: latestEndTime && now < latestEndTime ? latestEndTime : null,
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    // First check in-memory cache
    const memUser = this.users.get(id);
    if (memUser) return memUser;
    
    // If not in memory, try database
    try {
      const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, id));
      if (dbUser) {
        // Cache it for future lookups
        this.users.set(id, dbUser);
      }
      return dbUser;
    } catch (error) {
      console.error("Error fetching user from DB:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // First check in-memory cache
    const memUser = Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
    if (memUser) return memUser;
    
    // If not in memory, try database
    try {
      const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.username, username));
      if (dbUser) {
        this.users.set(dbUser.id, dbUser);
      }
      return dbUser;
    } catch (error) {
      console.error("Error fetching user by username from DB:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // First check in-memory cache
    const memUser = Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
    if (memUser) return memUser;
    
    // If not in memory, try database
    try {
      const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
      if (dbUser) {
        this.users.set(dbUser.id, dbUser);
      }
      return dbUser;
    } catch (error) {
      console.error("Error fetching user by email from DB:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(usersTable).values({
        username: insertUser.username,
        email: insertUser.email ?? null,
        displayName: insertUser.displayName ?? null,
        password: insertUser.password,
        isAdmin: insertUser.isAdmin ?? false, 
        workerId: insertUser.workerId ?? null,
        tenantId: insertUser.tenantId ?? null,
      }).returning();
      
      // Cache the user
      this.users.set(user.id, user);
      return user;
    } catch (error) {
      console.error("Error creating user in DB:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const dbUsers = await db.select().from(usersTable);
      // Update cache
      dbUsers.forEach(user => this.users.set(user.id, user));
      return dbUsers;
    } catch (error) {
      console.error("Error fetching all users from DB:", error);
      return Array.from(this.users.values());
    }
  }

  async updateUserPassword(id: string, password: string): Promise<User | undefined> {
    try {
      const [updated] = await db.update(usersTable)
        .set({ password })
        .where(eq(usersTable.id, id))
        .returning();
      
      if (updated) {
        this.users.set(id, updated);
      }
      return updated;
    } catch (error) {
      console.error("Error updating user password in DB:", error);
      return undefined;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await db.delete(usersTable).where(eq(usersTable.id, id));
      this.users.delete(id);
      return true;
    } catch (error) {
      console.error("Error deleting user from DB:", error);
      return false;
    }
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [updated] = await db.update(usersTable)
        .set(updates)
        .where(eq(usersTable.id, id))
        .returning();
      
      if (updated) {
        this.users.set(id, updated);
      }
      return updated;
    } catch (error) {
      console.error("Error updating user in DB:", error);
      return undefined;
    }
  }

  async getWorkers(includeInactive: boolean = false): Promise<Worker[]> {
    const allWorkers = Array.from(this.workers.values());
    if (includeInactive) {
      return allWorkers;
    }
    return allWorkers.filter(w => w.isActive);
  }

  async getWorker(id: string): Promise<Worker | undefined> {
    return this.workers.get(id);
  }

  async createWorker(worker: InsertWorker): Promise<Worker> {
    const id = randomUUID();
    const newWorker: Worker = {
      id,
      name: worker.name,
      email: worker.email,
      phone: worker.phone ?? null,
      isActive: worker.isActive ?? true,
      tenantId: worker.tenantId ?? null,
      createdAt: new Date(),
    };
    this.workers.set(id, newWorker);
    return newWorker;
  }

  async updateWorker(id: string, updates: Partial<InsertWorker>): Promise<Worker | undefined> {
    const existing = this.workers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.workers.set(id, updated);
    return updated;
  }

  async deleteWorker(id: string): Promise<boolean> {
    return this.workers.delete(id);
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
      tenantId: vehicle.tenantId ?? null,
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

  async getQuotes(userId?: string, workerId?: string): Promise<Quote[]> {
    const allQuotes = Array.from(this.quotes.values());
    let filtered = allQuotes;
    
    if (userId) {
      filtered = filtered.filter((q) => q.userId === userId);
    }
    
    if (workerId) {
      filtered = filtered.filter((q) => q.assignedWorkerId === workerId);
    }
    
    return filtered.sort((a, b) => {
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
      assignedWorkerId: quote.assignedWorkerId ?? null,
      confirmedAt: quote.confirmedAt ?? null,
      carrozadoUnavailableUntil: quote.carrozadoUnavailableUntil ?? null,
      tenantId: quote.tenantId ?? null,
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

  async assignQuoteToWorker(quoteId: string, workerId: string): Promise<Quote | undefined> {
    const existing = this.quotes.get(quoteId);
    if (!existing) return undefined;
    const updated = { ...existing, assignedWorkerId: workerId, status: "assigned" };
    this.quotes.set(quoteId, updated);
    return updated;
  }

  async getDeliveryNotes(quoteId?: string, workerId?: string): Promise<(DeliveryNote & { workerName?: string })[]> {
    try {
      let notes: DeliveryNote[] = [];
      
      if (quoteId && workerId) {
        notes = await db.select().from(deliveryNotesTable)
          .where(and(eq(deliveryNotesTable.quoteId, quoteId), eq(deliveryNotesTable.workerId, workerId)));
      } else if (quoteId) {
        notes = await db.select().from(deliveryNotesTable)
          .where(eq(deliveryNotesTable.quoteId, quoteId));
      } else if (workerId) {
        notes = await db.select().from(deliveryNotesTable)
          .where(eq(deliveryNotesTable.workerId, workerId));
      } else {
        notes = await db.select().from(deliveryNotesTable);
      }
      
      // Enrich notes with worker names
      const notesWithWorkerNames = await Promise.all(notes.map(async (note) => {
        // First try to find in workers table
        const worker = await this.getWorker(note.workerId);
        if (worker?.name) {
          return { ...note, workerName: worker.name };
        }
        
        // If not found in workers, try to find in users table (for user accounts)
        const user = await this.getUser(note.workerId);
        if (user) {
          return { ...note, workerName: user.displayName || user.username || 'Desconocido' };
        }
        
        return { ...note, workerName: 'Desconocido' };
      }));
      
      return notesWithWorkerNames.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } catch (error) {
      console.error("Error fetching delivery notes from DB:", error);
      return [];
    }
  }

  async getDeliveryNote(id: string): Promise<DeliveryNote | undefined> {
    try {
      const result = await db.select().from(deliveryNotesTable).where(eq(deliveryNotesTable.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching delivery note from DB:", error);
      return undefined;
    }
  }

  async createDeliveryNote(note: InsertDeliveryNote): Promise<DeliveryNote> {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const maxResult = await db
          .select({ maxNumber: max(deliveryNotesTable.noteNumber) })
          .from(deliveryNotesTable);
        const nextNumber = (maxResult[0]?.maxNumber ?? 0) + 1;
        
        const result = await db
          .insert(deliveryNotesTable)
          .values({ ...note, noteNumber: nextNumber })
          .returning();
        return result[0];
      } catch (error: any) {
        if (error?.code === '23505' && attempt < maxRetries) {
          console.log(`Conflicto de noteNumber, reintentando (${attempt}/${maxRetries})...`);
          continue;
        }
        console.error("Error creating delivery note in DB:", error);
        throw error;
      }
    }
    throw new Error("No se pudo crear el albarán después de múltiples intentos");
  }

  async updateDeliveryNote(id: string, updates: Partial<InsertDeliveryNote>): Promise<DeliveryNote | undefined> {
    try {
      const result = await db.update(deliveryNotesTable).set(updates).where(eq(deliveryNotesTable.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating delivery note in DB:", error);
      return undefined;
    }
  }

  async getDeliveryNoteSuggestions(tenantId: string): Promise<{ clients: string[], origins: string[], destinations: string[] }> {
    try {
      const notes = await db.select({
        clientName: deliveryNotesTable.clientName,
        pickupOrigin: deliveryNotesTable.pickupOrigin,
        destination: deliveryNotesTable.destination,
      })
        .from(deliveryNotesTable)
        .where(eq(deliveryNotesTable.tenantId, tenantId));
      
      const clients = Array.from(new Set(notes.map(n => n.clientName).filter((c): c is string => !!c && c.trim() !== '')));
      const origins = Array.from(new Set(notes.map(n => n.pickupOrigin).filter((o): o is string => !!o && o.trim() !== '')));
      const destinations = Array.from(new Set(notes.map(n => n.destination).filter((d): d is string => !!d && d.trim() !== '')));
      
      return { clients: clients.sort(), origins: origins.sort(), destinations: destinations.sort() };
    } catch (error) {
      console.error("Error fetching delivery note suggestions:", error);
      return { clients: [], origins: [], destinations: [] };
    }
  }
}

export const storage = new MemStorage();
