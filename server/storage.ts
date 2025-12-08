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
  type Message,
  type InsertMessage,
  type BlogPost,
  type InsertBlogPost,
  deliveryNotes as deliveryNotesTable,
  users as usersTable,
  tenants as tenantsTable,
  workers as workersTable,
  quotes as quotesTable,
  vehicleTypes as vehicleTypesTable,
  verificationTokens as verificationTokensTable,
  auditLogs as auditLogsTable,
  messages as messagesTable,
  blogPosts as blogPostsTable,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, sql, max, inArray, desc } from "drizzle-orm";
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
  invalidateUserCache(id: string): void;
  deleteTenantCascade(tenantId: string): Promise<void>;
  
  getWorkers(tenantId: string, includeInactive?: boolean): Promise<Worker[]>;
  getWorker(id: string): Promise<Worker | undefined>;
  createWorker(worker: InsertWorker & { tenantId: string }): Promise<Worker>;
  updateWorker(id: string, tenantId: string, worker: Partial<InsertWorker>): Promise<Worker | undefined>;
  deleteWorker(id: string, tenantId: string): Promise<boolean>;
  
  getVehicleTypes(): Promise<VehicleType[]>;
  getAllVehicleTypes(): Promise<VehicleType[]>;
  getVehicleType(id: string): Promise<VehicleType | undefined>;
  createVehicleType(vehicle: InsertVehicleType): Promise<VehicleType>;
  updateVehicleType(id: string, vehicle: Partial<InsertVehicleType>): Promise<VehicleType | undefined>;
  deleteVehicleType(id: string): Promise<boolean>;
  
  getQuotes(tenantId: string, userId?: string, workerId?: string): Promise<Quote[]>;
  getQuote(id: string, tenantId?: string): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote & { tenantId: string }): Promise<Quote>;
  updateQuoteStatus(id: string, tenantId: string, status: string): Promise<Quote | undefined>;
  assignQuoteToWorker(quoteId: string, tenantId: string, workerId: string): Promise<Quote | undefined>;
  
  getDeliveryNotes(tenantId: string, quoteId?: string, workerId?: string): Promise<DeliveryNote[]>;
  getDeliveryNote(id: string): Promise<DeliveryNote | undefined>;
  createDeliveryNote(note: InsertDeliveryNote): Promise<DeliveryNote>;
  updateDeliveryNote(id: string, note: Partial<InsertDeliveryNote>): Promise<DeliveryNote | undefined>;
  getDeliveryNoteSuggestions(tenantId: string): Promise<{ clients: string[], originNames: string[], originAddresses: string[], destinations: string[] }>;
  
  getMessages(tenantId: string): Promise<Message[]>;
  getUnreadMessageCount(tenantId: string): Promise<number>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string, tenantId: string): Promise<Message | undefined>;
  markAllMessagesAsRead(tenantId: string): Promise<void>;
  
  // Blog posts (public content, no tenant filtering)
  getBlogPosts(publishedOnly?: boolean): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, updates: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<boolean>;
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

  invalidateUserCache(id: string): void {
    this.users.delete(id);
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

  async getWorkers(tenantId: string, includeInactive: boolean = false): Promise<Worker[]> {
    // Filter by tenantId for multi-tenant isolation
    const allWorkers = Array.from(this.workers.values())
      .filter(w => w.tenantId === tenantId);
    
    if (includeInactive) {
      return allWorkers;
    }
    return allWorkers.filter(w => w.isActive);
  }

  async getWorker(id: string): Promise<Worker | undefined> {
    return this.workers.get(id);
  }

  async createWorker(worker: InsertWorker & { tenantId: string }): Promise<Worker> {
    const id = randomUUID();
    const newWorker: Worker = {
      id,
      name: worker.name,
      email: worker.email,
      phone: worker.phone ?? null,
      isActive: worker.isActive ?? true,
      tenantId: worker.tenantId, // Required for multi-tenant
      createdAt: new Date(),
    };
    this.workers.set(id, newWorker);
    return newWorker;
  }

  async updateWorker(id: string, tenantId: string, updates: Partial<InsertWorker>): Promise<Worker | undefined> {
    const existing = this.workers.get(id);
    // Verify tenant ownership before updating
    if (!existing || existing.tenantId !== tenantId) return undefined;
    const updated = { ...existing, ...updates };
    this.workers.set(id, updated);
    return updated;
  }

  async deleteWorker(id: string, tenantId: string): Promise<boolean> {
    const existing = this.workers.get(id);
    // Verify tenant ownership before deleting
    if (!existing || existing.tenantId !== tenantId) return false;
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

  async getQuotes(tenantId: string, userId?: string, workerId?: string): Promise<Quote[]> {
    // Filter by tenantId for multi-tenant isolation
    const allQuotes = Array.from(this.quotes.values())
      .filter(q => q.tenantId === tenantId);
    
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

  async getQuote(id: string, tenantId?: string): Promise<Quote | undefined> {
    const quote = this.quotes.get(id);
    if (!quote) return undefined;
    
    // If tenantId provided, enforce tenant isolation
    if (tenantId !== undefined) {
      if (!quote.tenantId || quote.tenantId !== tenantId) {
        return undefined;
      }
    }
    
    return quote;
  }

  async createQuote(quote: InsertQuote & { tenantId: string }): Promise<Quote> {
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
      tenantId: quote.tenantId, // Required for multi-tenant
      createdAt: new Date(),
    };
    this.quotes.set(id, newQuote);
    return newQuote;
  }

  async updateQuoteStatus(id: string, tenantId: string, status: string): Promise<Quote | undefined> {
    const existing = this.quotes.get(id);
    // Verify tenant ownership before updating
    if (!existing || existing.tenantId !== tenantId) return undefined;
    const updated = { ...existing, status };
    this.quotes.set(id, updated);
    return updated;
  }

  async assignQuoteToWorker(quoteId: string, tenantId: string, workerId: string): Promise<Quote | undefined> {
    const existing = this.quotes.get(quoteId);
    // Verify tenant ownership before updating
    if (!existing || existing.tenantId !== tenantId) return undefined;
    const updated = { ...existing, assignedWorkerId: workerId, status: "assigned" };
    this.quotes.set(quoteId, updated);
    return updated;
  }

  async getDeliveryNotes(tenantId: string, quoteId?: string, workerId?: string): Promise<(DeliveryNote & { workerName?: string })[]> {
    try {
      // tenantId is required for multi-tenant isolation
      if (!tenantId) {
        console.error("[storage] getDeliveryNotes called without tenantId - this is a security risk");
        return [];
      }
      
      let notes: DeliveryNote[] = [];
      
      // Build conditions array for filtering - always include tenantId
      const conditions = [eq(deliveryNotesTable.tenantId, tenantId)];
      
      if (quoteId) {
        conditions.push(eq(deliveryNotesTable.quoteId, quoteId));
      }
      
      if (workerId) {
        conditions.push(eq(deliveryNotesTable.workerId, workerId));
      }
      
      // Apply conditions (always has at least tenantId)
      notes = await db.select().from(deliveryNotesTable)
        .where(and(...conditions));
      
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

  async getDeliveryNoteSuggestions(tenantId: string): Promise<{ clients: string[], originNames: string[], originAddresses: string[], destinations: string[] }> {
    try {
      const notes = await db.select({
        clientName: deliveryNotesTable.clientName,
        pickupOrigins: deliveryNotesTable.pickupOrigins,
        destination: deliveryNotesTable.destination,
      })
        .from(deliveryNotesTable)
        .where(eq(deliveryNotesTable.tenantId, tenantId));
      
      const clients = Array.from(new Set(notes.map(n => n.clientName).filter((c): c is string => !!c && c.trim() !== '')));
      
      const allOrigins = notes.flatMap(n => n.pickupOrigins || []);
      const originNames = Array.from(new Set(allOrigins.map(o => o.name).filter((n): n is string => !!n && n.trim() !== '')));
      const originAddresses = Array.from(new Set(allOrigins.map(o => o.address).filter((a): a is string => !!a && a.trim() !== '')));
      
      const destinations = Array.from(new Set(notes.map(n => n.destination).filter((d): d is string => !!d && d.trim() !== '')));
      
      return { clients: clients.sort(), originNames: originNames.sort(), originAddresses: originAddresses.sort(), destinations: destinations.sort() };
    } catch (error) {
      console.error("Error fetching delivery note suggestions:", error);
      return { clients: [], originNames: [], originAddresses: [], destinations: [] };
    }
  }

  async deleteTenantCascade(tenantId: string): Promise<void> {
    console.log(`[storage] Starting cascade deletion for tenant ${tenantId}`);
    
    // Get all user IDs for this tenant BEFORE the transaction
    const tenantUsers = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.tenantId, tenantId));
    const userIds = tenantUsers.map(u => u.id);
    
    // Flag to ensure cache pruning only happens after successful commit
    let transactionCommitted = false;
    
    try {
      // Use a transaction to ensure atomicity - all or nothing
      // Note: Session cleanup is included in transaction for consistency
      await db.transaction(async (tx) => {
        // 1. Delete audit logs for this tenant
        await tx.delete(auditLogsTable).where(eq(auditLogsTable.tenantId, tenantId));
        console.log(`[storage] Deleted audit logs for tenant ${tenantId}`);
        
        // 2. Delete delivery notes for this tenant
        await tx.delete(deliveryNotesTable).where(eq(deliveryNotesTable.tenantId, tenantId));
        console.log(`[storage] Deleted delivery notes for tenant ${tenantId}`);
        
        // 3. Delete quotes for this tenant
        await tx.delete(quotesTable).where(eq(quotesTable.tenantId, tenantId));
        console.log(`[storage] Deleted quotes for tenant ${tenantId}`);
        
        // 4. Delete workers for this tenant
        await tx.delete(workersTable).where(eq(workersTable.tenantId, tenantId));
        console.log(`[storage] Deleted workers for tenant ${tenantId}`);
        
        // 5. Delete vehicle types for this tenant
        await tx.delete(vehicleTypesTable).where(eq(vehicleTypesTable.tenantId, tenantId));
        console.log(`[storage] Deleted vehicle types for tenant ${tenantId}`);
        
        // 6. Delete verification tokens for tenant users
        if (userIds.length > 0) {
          await tx.delete(verificationTokensTable).where(inArray(verificationTokensTable.userId, userIds));
          console.log(`[storage] Deleted verification tokens for ${userIds.length} users`);
        }
        
        // 7. Delete sessions for tenant users (within transaction using parameterized queries)
        if (userIds.length > 0) {
          // Delete sessions one by one using parameterized queries for SQL injection safety
          // Each individual delete uses a parameterized query with proper escaping
          for (const userId of userIds) {
            await tx.execute(sql`DELETE FROM user_sessions WHERE sess::jsonb->'passport'->>'user' = ${userId}`);
          }
          console.log(`[storage] Deleted sessions for ${userIds.length} users`);
        }
        
        // 8. Delete all users for this tenant
        await tx.delete(usersTable).where(eq(usersTable.tenantId, tenantId));
        console.log(`[storage] Deleted users for tenant ${tenantId}`);
        
        // 9. Finally, delete the tenant itself
        await tx.delete(tenantsTable).where(eq(tenantsTable.id, tenantId));
        console.log(`[storage] Deleted tenant ${tenantId}`);
      });
      
      // Transaction completed successfully
      transactionCommitted = true;
    } catch (error) {
      console.error(`[storage] Transaction failed for tenant ${tenantId}:`, error);
      throw error; // Re-throw to propagate to caller
    }
    
    // ONLY clean up in-memory caches if transaction was committed successfully
    if (transactionCommitted) {
      // Only delete tenant-specific data, preserve global defaults (tenantId = null)
      const workersToDelete = Array.from(this.workers.values()).filter(w => w.tenantId === tenantId);
      workersToDelete.forEach(w => this.workers.delete(w.id));
      
      const vehiclesToDelete = Array.from(this.vehicleTypes.values()).filter(v => v.tenantId === tenantId);
      vehiclesToDelete.forEach(v => this.vehicleTypes.delete(v.id));
      
      const quotesToDelete = Array.from(this.quotes.values()).filter(q => q.tenantId === tenantId);
      quotesToDelete.forEach(q => this.quotes.delete(q.id));
      
      userIds.forEach(id => this.users.delete(id));
      
      // Re-seed global defaults (tenantId = null) to ensure they're always present
      // This provides a safeguard against any accidental erosion of baseline data
      this.ensureDefaultsExist();
      
      console.log(`[storage] Successfully completed cascade deletion for tenant ${tenantId}`);
    }
  }
  
  private ensureDefaultsExist(): void {
    // Re-seed default vehicle types if missing (complete records)
    for (const vt of defaultVehicleTypes) {
      if (!this.vehicleTypes.has(vt.id)) {
        this.vehicleTypes.set(vt.id, { ...vt });
      }
    }
    // Re-seed default workers if missing (complete records with fresh timestamps)
    for (const w of defaultWorkers) {
      if (!this.workers.has(w.id)) {
        this.workers.set(w.id, { ...w, createdAt: new Date() });
      }
    }
  }
  
  async getMessages(tenantId: string): Promise<Message[]> {
    const results = await db.select().from(messagesTable)
      .where(eq(messagesTable.tenantId, tenantId))
      .orderBy(sql`${messagesTable.createdAt} DESC`);
    return results;
  }
  
  async getUnreadMessageCount(tenantId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(messagesTable)
      .where(and(
        eq(messagesTable.tenantId, tenantId),
        eq(messagesTable.read, false)
      ));
    return Number(result[0]?.count || 0);
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messagesTable).values(message).returning();
    return created;
  }
  
  async markMessageAsRead(id: string, tenantId: string): Promise<Message | undefined> {
    const [updated] = await db.update(messagesTable)
      .set({ read: true })
      .where(and(
        eq(messagesTable.id, id),
        eq(messagesTable.tenantId, tenantId)
      ))
      .returning();
    return updated;
  }
  
  async markAllMessagesAsRead(tenantId: string): Promise<void> {
    await db.update(messagesTable)
      .set({ read: true })
      .where(eq(messagesTable.tenantId, tenantId));
  }
  
  // Blog posts methods (public content, no tenant filtering)
  async getBlogPosts(publishedOnly: boolean = false): Promise<BlogPost[]> {
    try {
      if (publishedOnly) {
        return await db.select().from(blogPostsTable)
          .where(eq(blogPostsTable.isPublished, true))
          .orderBy(sql`${blogPostsTable.publishedAt} DESC NULLS LAST`);
      }
      return await db.select().from(blogPostsTable)
        .orderBy(sql`${blogPostsTable.createdAt} DESC`);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      return [];
    }
  }
  
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    try {
      const [post] = await db.select().from(blogPostsTable)
        .where(eq(blogPostsTable.slug, slug));
      return post;
    } catch (error) {
      console.error("Error fetching blog post by slug:", error);
      return undefined;
    }
  }
  
  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    try {
      const [post] = await db.select().from(blogPostsTable)
        .where(eq(blogPostsTable.id, id));
      return post;
    } catch (error) {
      console.error("Error fetching blog post by id:", error);
      return undefined;
    }
  }
  
  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    try {
      const [created] = await db.insert(blogPostsTable).values(post).returning();
      return created;
    } catch (error) {
      console.error("Error creating blog post:", error);
      throw error;
    }
  }
  
  async updateBlogPost(id: string, updates: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    try {
      const [updated] = await db.update(blogPostsTable)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(blogPostsTable.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating blog post:", error);
      return undefined;
    }
  }
  
  async deleteBlogPost(id: string): Promise<boolean> {
    try {
      await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting blog post:", error);
      return false;
    }
  }
}

export const storage = new MemStorage();
