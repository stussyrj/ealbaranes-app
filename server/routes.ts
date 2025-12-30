import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, initializeAdminUser, verifyToken } from "./auth";
import { setupGoogleAuth } from "./googleAuth";
import {
  geocodeAddress,
  getRouteDistance,
  calculateRouteFromAddresses,
  getAddressSuggestions,
} from "./services/openrouteservice";
import { getAddressSuggestionsGoogle } from "./services/googleplaces";
import {
  geocodeRequestSchema,
  routeRequestSchema,
  calculateQuoteRequestSchema,
  insertVehicleTypeSchema,
  insertBlogPostSchema,
  insertInvoiceSchema,
  insertInvoiceTemplateSchema,
  insertInvoiceLineItemSchema,
  tenants,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
// Email imports removed - now using internal messaging system
// import { sendDeliveryNoteCreatedEmail, sendDeliveryNoteSignedEmail, getAdminEmailForTenant } from "./email";
import { logAudit, getClientInfo } from "./auditService";
import { generateInvoicePdf } from "./invoicePdfService";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  setupAuth(app);
  setupGoogleAuth(app);
  await initializeAdminUser();
  
  // JWT Authentication Middleware - adds user to request if valid JWT token is present
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    // Skip if already authenticated via session
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }
    
    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (decoded) {
        // Get user from database and attach to request
        const user = await storage.getUser(decoded.userId);
        if (user) {
          (req as any).user = user;
          // Make isAuthenticated return true for JWT authenticated users
          (req as any).isAuthenticated = () => true;
          if (req.path.includes('/api/')) {
            console.log(`[auth] JWT user ${user.id} authenticated for ${req.method} ${req.path}`);
          }
        } else {
          console.log(`[auth] JWT token valid but user ${decoded.userId} not found in DB`);
        }
      } else {
        console.log(`[auth] JWT token invalid or expired for ${req.method} ${req.path}`);
      }
    } else {
      // No token in header - this is ok for public routes
      if (req.path.includes('/api/delivery-notes') || req.path.includes('/api/quotes')) {
        console.log(`[auth] No JWT token for ${req.method} ${req.path}`);
      }
    }
    
    next();
  });
  
  app.get("/api/address-suggestions", async (req, res) => {
    try {
      const text = req.query.q as string;
      if (!text) {
        return res.json([]);
      }
      // Use OpenRouteService with postal codes - limited to 3 results
      let suggestions = await getAddressSuggestions(text);
      // Ensure max 3 suggestions
      suggestions = suggestions.slice(0, 3);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      res.json([]);
    }
  });

  app.get("/api/vehicle-types", async (req, res) => {
    try {
      const types = await storage.getVehicleTypes();
      const availability = storage.getCarrozadoAvailability();
      res.json({ types, carrozadoUnavailableUntil: availability.unavailableUntil });
    } catch (error) {
      console.error("Error fetching vehicle types:", error);
      res.status(500).json({ error: "Error al obtener los tipos de vehículo" });
    }
  });

  app.get("/api/vehicle-types/all", async (req, res) => {
    try {
      const types = await storage.getAllVehicleTypes();
      res.json(types);
    } catch (error) {
      console.error("Error fetching all vehicle types:", error);
      res.status(500).json({ error: "Error al obtener los tipos de vehículo" });
    }
  });

  app.post("/api/vehicle-types", async (req, res) => {
    try {
      const data = insertVehicleTypeSchema.parse(req.body);
      const vehicle = await storage.createVehicleType(data);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle type:", error);
      res.status(400).json({ error: "Error al crear el tipo de vehículo" });
    }
  });

  app.put("/api/vehicle-types/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const vehicle = await storage.updateVehicleType(id, updates);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehículo no encontrado" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle type:", error);
      res.status(400).json({ error: "Error al actualizar el tipo de vehículo" });
    }
  });

  app.delete("/api/vehicle-types/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const vehicle = await storage.updateVehicleType(id, { isActive: false });
      if (!vehicle) {
        return res.status(404).json({ error: "Vehículo no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deactivating vehicle type:", error);
      res.status(500).json({ error: "Error al desactivar el tipo de vehículo" });
    }
  });

  app.post("/api/geocode", async (req, res) => {
    try {
      const { address } = geocodeRequestSchema.parse(req.body);
      const result = await geocodeAddress(address);
      res.json(result);
    } catch (error) {
      console.error("Error geocoding address:", error);
      const message = error instanceof Error ? error.message : "Error de geocodificación";
      res.status(400).json({ error: message });
    }
  });

  app.post("/api/route", async (req, res) => {
    try {
      const { origin, destination } = routeRequestSchema.parse(req.body);
      const result = await getRouteDistance(origin, destination);
      res.json(result);
    } catch (error) {
      console.error("Error calculating route:", error);
      const message = error instanceof Error ? error.message : "Error al calcular la ruta";
      res.status(400).json({ error: message });
    }
  });

  app.post("/api/check-carrozado-availability", async (req, res) => {
    try {
      const { vehicleTypeId, pickupTime } = req.body;
      if (vehicleTypeId !== "carrozado" || !pickupTime) {
        return res.json({ available: true });
      }
      const available = storage.isCarrozadoAvailableAtDateTime(pickupTime);
      res.json({ available });
    } catch (error) {
      console.error("Error checking carrozado availability:", error);
      res.status(400).json({ error: "Error al verificar disponibilidad" });
    }
  });

  app.post("/api/calculate-quote", async (req, res) => {
    try {
      // Require authentication for tenant isolation
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const tenantId = (req.user as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Usuario sin empresa asignada" });
      }
      
      const data = calculateQuoteRequestSchema.parse(req.body);
      
      // Check if carrozado is available at requested time
      if (data.vehicleTypeId === "carrozado" && data.pickupTime) {
        if (!storage.isCarrozadoAvailableAtDateTime(data.pickupTime)) {
          return res.status(400).json({ error: "El carrozado no está disponible en el horario solicitado" });
        }
      }
      
      const routeInfo = await calculateRouteFromAddresses(data.origin, data.destination);
      
      const distance = routeInfo.route.km;
      const duration = routeInfo.route.durationMin;
      
      const vehicleType = await storage.getVehicleType(data.vehicleTypeId);
      if (!vehicleType) {
        return res.status(400).json({ error: "Tipo de vehículo no encontrado" });
      }
      
      const distanceCost = distance * vehicleType.pricePerKm;
      const directionCost = vehicleType.directionPrice || 0;
      const subtotal = distanceCost + directionCost;
      let totalPrice = Math.max(vehicleType.minimumPrice, subtotal);
      
      if (data.isUrgent) {
        totalPrice = totalPrice * 1.25;
      }
      
      const quote = await storage.createQuote({
        tenantId, // Required for multi-tenant isolation
        origin: data.origin,
        destination: data.destination,
        originCoords: JSON.stringify({ lat: routeInfo.origin.lat, lng: routeInfo.origin.lng }),
        destinationCoords: JSON.stringify({ lat: routeInfo.destination.lat, lng: routeInfo.destination.lng }),
        distance,
        duration,
        vehicleTypeId: vehicleType.id,
        vehicleTypeName: vehicleType.name,
        distanceCost,
        directionCost,
        totalPrice: Math.round(totalPrice * 100) / 100,
        isUrgent: data.isUrgent ?? false,
        pickupTime: data.pickupTime || null,
        observations: data.observations || null,
        customerName: data.name,
        phoneNumber: data.phoneNumber,
        status: "pending",
      });
      
      res.json({
        quote,
        breakdown: {
          origin: {
            address: data.origin,
            coords: routeInfo.origin,
            label: routeInfo.origin.label,
          },
          destination: {
            address: data.destination,
            coords: routeInfo.destination,
            label: routeInfo.destination.label,
          },
          distance,
          duration,
          vehicle: {
            id: vehicleType.id,
            name: vehicleType.name,
            capacity: vehicleType.capacity,
          },
          pricing: {
            pricePerKm: vehicleType.pricePerKm,
            distanceCost,
            directionCost,
            minimumPrice: vehicleType.minimumPrice,
            isUrgent: data.isUrgent ?? false,
            totalPrice: Math.round(totalPrice * 100) / 100,
          },
          pickupTime: data.pickupTime,
          observations: data.observations,
        },
      });
    } catch (error) {
      console.error("Error calculating quote:", error);
      const message = error instanceof Error ? error.message : "Error al calcular el presupuesto";
      res.status(400).json({ error: message });
    }
  });

  app.get("/api/quotes", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const tenantId = (req.user as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      const userId = req.query.userId as string | undefined;
      const quotes = await storage.getQuotes(tenantId, userId);
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ error: "Error al obtener los presupuestos" });
    }
  });

  app.get("/api/quotes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const tenantId = (req.user as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      const { id } = req.params;
      // Use tenant-aware getQuote for defense-in-depth
      const quote = await storage.getQuote(id, tenantId);
      if (!quote) {
        return res.status(404).json({ error: "Presupuesto no encontrado" });
      }
      
      res.json(quote);
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ error: "Error al obtener el presupuesto" });
    }
  });

  app.patch("/api/quotes/:id/status", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const tenantId = (req.user as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      const { id } = req.params;
      const { status } = req.body;
      // Use tenant-aware getQuote for defense-in-depth
      const quote = await storage.getQuote(id, tenantId);
      if (!quote) {
        return res.status(404).json({ error: "Presupuesto no encontrado" });
      }

      // Check carrozado availability before approving
      if (status === "approved" && quote.vehicleTypeId === "carrozado" && quote.pickupTime && quote.duration) {
        if (!storage.isCarrozadoAvailableAtDateTime(quote.pickupTime, quote.duration)) {
          return res.status(400).json({ error: "El carrozado no está disponible en este horario. Otros pedidos ya están reservados. Cancela o completa el servicio anterior para continuar." });
        }
      }

      const updatedQuote = await storage.updateQuoteStatus(id, tenantId, status);
      if (!updatedQuote) {
        return res.status(404).json({ error: "Presupuesto no encontrado" });
      }
      res.json(updatedQuote);
    } catch (error) {
      console.error("Error updating quote status:", error);
      res.status(400).json({ error: "Error al actualizar el estado del presupuesto" });
    }
  });

  app.post("/api/quotes/:id/confirm", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const tenantId = (req.user as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      const { id } = req.params;
      const quote = await storage.updateQuoteStatus(id, tenantId, "confirmed");
      if (!quote) {
        return res.status(404).json({ error: "Presupuesto no encontrado" });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error confirming quote:", error);
      res.status(400).json({ error: "Error al confirmar el presupuesto" });
    }
  });

  // Workers endpoints - require authentication and filter by tenant
  app.get("/api/workers", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const tenantId = (req.user as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      const includeInactive = req.query.includeInactive === "true";
      const workers = await storage.getWorkers(tenantId, includeInactive);
      res.json(workers);
    } catch (error) {
      console.error("Error fetching workers:", error);
      res.status(500).json({ error: "Error al obtener trabajadores" });
    }
  });

  app.post("/api/workers", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const tenantId = (req.user as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      const { name, email, phone } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Nombre y email son requeridos" });
      }
      const worker = await storage.createWorker({ name, email, phone: phone || "", tenantId });
      res.status(201).json(worker);
    } catch (error) {
      console.error("Error creating worker:", error);
      res.status(400).json({ error: "Error al crear trabajador" });
    }
  });

  app.patch("/api/workers/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const tenantId = (req.user as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      const { id } = req.params;
      const updates = req.body;
      const worker = await storage.updateWorker(id, tenantId, updates);
      if (!worker) {
        return res.status(404).json({ error: "Trabajador no encontrado" });
      }
      res.json(worker);
    } catch (error) {
      console.error("Error updating worker:", error);
      res.status(400).json({ error: "Error al actualizar trabajador" });
    }
  });

  app.delete("/api/workers/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const tenantId = (req.user as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      const { id } = req.params;
      const deleted = await storage.deleteWorker(id, tenantId);
      if (!deleted) {
        return res.status(404).json({ error: "Trabajador no encontrado" });
      }
      res.json({ success: true, message: "Trabajador eliminado permanentemente" });
    } catch (error) {
      console.error("Error deleting worker:", error);
      res.status(400).json({ error: "Error al eliminar trabajador" });
    }
  });

  // Assign quote to worker - requires authentication
  app.patch("/api/quotes/:id/assign-worker", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const tenantId = (req.user as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      const { id } = req.params;
      const { workerId } = req.body;
      
      if (!workerId) {
        return res.status(400).json({ error: "ID del trabajador es requerido" });
      }
      
      // Use tenant-aware getQuote for defense-in-depth
      const existingQuote = await storage.getQuote(id, tenantId);
      if (!existingQuote) {
        return res.status(404).json({ error: "Presupuesto no encontrado" });
      }
      
      // Verify worker belongs to tenant
      const worker = await storage.getWorker(workerId);
      if (!worker) {
        return res.status(404).json({ error: "Trabajador no encontrado" });
      }
      if (worker.tenantId !== tenantId) {
        return res.status(403).json({ error: "El trabajador no pertenece a tu empresa" });
      }

      const quote = await storage.assignQuoteToWorker(id, tenantId, workerId);
      if (!quote) {
        return res.status(404).json({ error: "Presupuesto no encontrado" });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error assigning quote to worker:", error);
      res.status(400).json({ error: "Error al asignar trabajador" });
    }
  });

  // Worker orders - requires authentication
  app.get("/api/workers/:workerId/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const tenantId = (req.user as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      const { workerId } = req.params;
      
      // Verify worker belongs to tenant
      const worker = await storage.getWorker(workerId);
      if (!worker) {
        return res.status(404).json({ error: "Trabajador no encontrado" });
      }
      if (worker.tenantId !== tenantId) {
        return res.status(403).json({ error: "El trabajador no pertenece a tu empresa" });
      }
      
      const orders = await storage.getQuotes(tenantId, undefined, workerId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching worker orders:", error);
      res.status(500).json({ error: "Error al obtener pedidos" });
    }
  });

  // Delivery notes
  app.post("/api/delivery-notes", async (req, res) => {
    try {
      // Require authentication for tenant isolation
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const data = req.body;
      const user = req.user as any;
      
      // Require tenantId to prevent orphan notes
      if (!user.tenantId) {
        return res.status(400).json({ error: "Usuario sin empresa asignada" });
      }
      
      console.log("[routes] Creating delivery note. User:", user?.id, "isAdmin:", user?.isAdmin);
      
      // Validate required fields
      if (!data.workerId) {
        return res.status(400).json({ error: "workerId es requerido" });
      }
      
      // Determine creatorType based on authenticated user
      const creatorType = user?.isAdmin ? "admin" : "worker";
      console.log("[routes] creatorType determined:", creatorType);
      
      // Map camelCase to snake_case for DB columns
      const noteData = {
        quoteId: data.quoteId || null,
        workerId: data.workerId,
        creatorType: creatorType,
        tenantId: user.tenantId,
        clientName: data.clientName || null,
        pickupOrigins: data.pickupOrigins || (data.pickupOrigin ? [data.pickupOrigin] : null),
        destination: data.destination || null,
        vehicleType: data.vehicleType || null,
        date: data.date || null,
        time: data.time || null,
        observations: data.observations || null,
        photo: data.photo || null,
        status: data.status || "pending",
        signature: data.signature || null,
        signedAt: data.signedAt ? new Date(data.signedAt) : null,
        notes: data.notes || null,
        originSignature: data.originSignature || null,
        originSignatureDocument: data.originSignatureDocument || null,
        originSignedAt: data.originSignedAt ? new Date(data.originSignedAt) : null,
        destinationSignature: data.destinationSignature || null,
        destinationSignatureDocument: data.destinationSignatureDocument || null,
        destinationSignedAt: data.destinationSignedAt ? new Date(data.destinationSignedAt) : null,
      };
      const note = await storage.createDeliveryNote(noteData);
      
      // Log audit entry for delivery note creation
      const clientInfo = getClientInfo(req);
      logAudit({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'create_delivery_note',
        entityType: 'delivery_note',
        entityId: note.id,
        details: { noteNumber: note.noteNumber, clientName: note.clientName, creatorType },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });
      
      // Create internal message notification (replaces email)
      if (user?.tenantId) {
        const createdBy = user.isAdmin ? 'Empresa' : (user.displayName || user.username || 'Trabajador');
        const routeLines = (note.pickupOrigins || []).map((o: any) => 
          `Recogida: ${o.name || 'N/A'} → Entrega: ${o.address || 'N/A'}`
        ).join('\n');
        
        storage.createMessage({
          tenantId: user.tenantId,
          type: 'delivery_note_created',
          title: `Nuevo Albarán #${note.noteNumber}`,
          body: `Cliente: ${note.clientName || 'No especificado'}\n${routeLines}\nCreado por: ${createdBy}`,
          read: false,
          entityType: 'delivery_note',
          entityId: note.id,
        }).catch(err => {
          console.error("[routes] Failed to create delivery note message:", err);
        });
      }
      
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating delivery note:", error);
      res.status(400).json({ error: "Error al crear albarán" });
    }
  });

  // Must be defined BEFORE /:id route to avoid being captured as an ID
  app.get("/api/delivery-notes/suggestions", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      const tenantId = (req.user as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Tenant no encontrado" });
      }
      const suggestions = await storage.getDeliveryNoteSuggestions(tenantId);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching delivery note suggestions:", error);
      res.status(500).json({ error: "Error al obtener sugerencias" });
    }
  });

  // List all delivery notes - MUST be before /:id route
  app.get("/api/delivery-notes", async (req, res) => {
    try {
      // Require authentication for tenant isolation
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const tenantId = (req.user as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      // Filter by tenant for data isolation
      const notes = await storage.getDeliveryNotes(tenantId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching all delivery notes:", error);
      res.status(500).json({ error: "Error al obtener albaranes" });
    }
  });

  // Get deleted delivery notes (admin only) - MUST be before /:id route
  app.get("/api/delivery-notes/deleted", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const user = req.user as any;
      if (!user.isAdmin) {
        return res.status(403).json({ error: "Solo las empresas pueden ver albaranes borrados" });
      }
      
      const tenantId = user.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      const notes = await storage.getDeletedDeliveryNotes(tenantId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching deleted delivery notes:", error);
      res.status(500).json({ error: "Error al obtener albaranes borrados" });
    }
  });

  // Get specific delivery note by ID
  app.get("/api/delivery-notes/:id", async (req, res) => {
    try {
      // Require authentication for tenant isolation
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const { id } = req.params;
      const note = await storage.getDeliveryNote(id);
      if (!note) {
        return res.status(404).json({ error: "Albarán no encontrado" });
      }
      
      // Verify note belongs to user's tenant
      const tenantId = (req.user as any).tenantId;
      if (note.tenantId && note.tenantId !== tenantId) {
        return res.status(403).json({ error: "No tienes acceso a este albarán" });
      }
      
      res.json(note);
    } catch (error) {
      console.error("Error fetching delivery note:", error);
      res.status(500).json({ error: "Error al obtener albarán" });
    }
  });

  app.patch("/api/delivery-notes/:id", async (req, res) => {
    try {
      // Require authentication for tenant isolation
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const { id } = req.params;
      const data = req.body;
      
      // Get existing note to check if it's signed
      const existingNote = await storage.getDeliveryNote(id);
      if (!existingNote) {
        return res.status(404).json({ error: "Albarán no encontrado" });
      }
      
      // Verify note belongs to user's tenant
      const tenantId = (req.user as any).tenantId;
      if (existingNote.tenantId && existingNote.tenantId !== tenantId) {
        return res.status(403).json({ error: "No tienes acceso a este albarán" });
      }
      
      // Check if this is an invoice status update only
      const isInvoiceUpdate = Object.keys(data).every(key => 
        key === 'isInvoiced' || key === 'invoicedAt'
      );
      
      // Invoice updates are only allowed on fully signed notes (those with photo AND signature)
      if (isInvoiceUpdate) {
        if (!existingNote.photo || !existingNote.signature) {
          return res.status(403).json({ error: "Solo se pueden facturar albaranes completamente firmados (con foto y firma digital)" });
        }
        // Validate isInvoiced is boolean
        if (typeof data.isInvoiced !== 'boolean') {
          return res.status(400).json({ error: "isInvoiced debe ser un booleano" });
        }
        // Auto-set invoicedAt when marking as invoiced
        if (data.isInvoiced === true && !existingNote.isInvoiced) {
          data.invoicedAt = new Date();
        } else if (data.isInvoiced === false) {
          data.invoicedAt = null;
        }
      } else {
        // Validate photo size to prevent corrupt/empty photos
        if (data.photo && typeof data.photo === 'string' && data.photo.length < 500) {
          return res.status(400).json({ error: "La foto es demasiado pequeña o está corrupta. Inténtalo de nuevo." });
        }
        
        // Validate signature size to prevent corrupt/empty signatures  
        if (data.signature && typeof data.signature === 'string' && data.signature.length < 500) {
          return res.status(400).json({ error: "La firma es demasiado pequeña o está corrupta. Inténtalo de nuevo." });
        }
        
        // Check if this is a signature-only update (photo, signature, or dual signatures)
        const signatureFields = ['photo', 'signature', 'status', 'originSignature', 'originSignatureDocument', 'originSignedAt', 'destinationSignature', 'destinationSignatureDocument', 'destinationSignedAt'];
        const isSignatureUpdate = Object.keys(data).every(key => signatureFields.includes(key));
        
        // Check if this is a timing/tracking update (arrivedAt, departedAt, observations)
        const timingFields = ['arrivedAt', 'departedAt', 'observations'];
        const isTimingUpdate = Object.keys(data).every(key => timingFields.includes(key));
        
        // Allow adding photo or signature to partially signed notes
        // But block all other edits once note is fully signed (except timing/observations updates)
        if (existingNote.signedAt && !isSignatureUpdate && !isTimingUpdate) {
          return res.status(403).json({ error: "No se pueden editar albaranes completamente firmados" });
        }
        
        // Block all edits (except signature and timing) once note is fully signed (has both photo AND signature)
        if (existingNote.photo && existingNote.signature && !isSignatureUpdate && !isTimingUpdate) {
          return res.status(403).json({ error: "No se pueden editar albaranes completamente firmados" });
        }
      }
      
      // Convert signedAt string to Date if present
      if (data.signedAt && typeof data.signedAt === 'string') {
        data.signedAt = new Date(data.signedAt);
      }
      
      // Convert invoicedAt string to Date if present (for manual override if provided)
      if (data.invoicedAt && typeof data.invoicedAt === 'string') {
        data.invoicedAt = new Date(data.invoicedAt);
      }
      
      // Convert dual signature dates to Date objects if present
      if (data.originSignedAt && typeof data.originSignedAt === 'string') {
        data.originSignedAt = new Date(data.originSignedAt);
      }
      if (data.destinationSignedAt && typeof data.destinationSignedAt === 'string') {
        data.destinationSignedAt = new Date(data.destinationSignedAt);
      }
      
      // Convert arrival/departure dates to Date objects if present
      if (data.arrivedAt && typeof data.arrivedAt === 'string') {
        data.arrivedAt = new Date(data.arrivedAt);
      }
      if (data.departedAt && typeof data.departedAt === 'string') {
        data.departedAt = new Date(data.departedAt);
      }
      
      // Determine final state after update (photo and signature OR dual signatures)
      const willHavePhoto = data.photo !== undefined ? data.photo : existingNote.photo;
      const willHaveSignature = data.signature !== undefined ? data.signature : existingNote.signature;
      const willHaveLegacySigning = willHavePhoto && willHaveSignature;
      
      // Check for new dual signature system
      const willHaveOriginSignature = data.originSignature !== undefined ? data.originSignature : existingNote.originSignature;
      const willHaveOriginDocument = data.originSignatureDocument !== undefined ? data.originSignatureDocument : existingNote.originSignatureDocument;
      const willHaveDestSignature = data.destinationSignature !== undefined ? data.destinationSignature : existingNote.destinationSignature;
      const willHaveDestDocument = data.destinationSignatureDocument !== undefined ? data.destinationSignatureDocument : existingNote.destinationSignatureDocument;
      const willHaveDualSigning = willHaveOriginSignature && willHaveOriginDocument && willHaveDestSignature && willHaveDestDocument;
      
      const willBeFullySigned = willHaveLegacySigning || willHaveDualSigning;
      
      // Auto-set signedAt and status when fully signed (legacy or dual)
      if (willBeFullySigned && !existingNote.signedAt) {
        data.signedAt = new Date();
        data.status = "signed";
      }
      
      const note = await storage.updateDeliveryNote(id, data);
      if (!note) {
        return res.status(404).json({ error: "Albarán no encontrado" });
      }
      
      // Log audit entry for delivery note update
      const user = req.user as any;
      const clientInfo = getClientInfo(req);
      
      // Determine the specific action based on what was updated
      let auditAction: 'update_delivery_note' | 'sign_delivery_note' | 'invoice_delivery_note' = 'update_delivery_note';
      if (data.isInvoiced !== undefined) {
        auditAction = 'invoice_delivery_note';
      } else if (data.photo !== undefined || data.signature !== undefined || 
                 data.originSignature !== undefined || data.destinationSignature !== undefined) {
        auditAction = 'sign_delivery_note';
      }
      
      // Check if fully signed (legacy or dual)
      const hasLegacySigning = !!(note.photo && note.signature);
      const hasDualSigning = !!(note.originSignature && note.originSignatureDocument && 
                                note.destinationSignature && note.destinationSignatureDocument);
      const isFullySigned = hasLegacySigning || hasDualSigning;
      
      logAudit({
        tenantId: user.tenantId,
        userId: user.id,
        action: auditAction,
        entityType: 'delivery_note',
        entityId: note.id,
        details: { 
          noteNumber: note.noteNumber, 
          changedFields: Object.keys(data),
          isInvoiced: note.isInvoiced,
          isSigned: isFullySigned,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });
      
      // Create internal message when note becomes fully signed (replaces email)
      const wasLegacyFullySigned = existingNote.photo && existingNote.signature;
      const wasDualFullySigned = existingNote.originSignature && existingNote.originSignatureDocument && 
                                  existingNote.destinationSignature && existingNote.destinationSignatureDocument;
      const wasFullySigned = wasLegacyFullySigned || wasDualFullySigned;
      const isNowFullySigned = isFullySigned;
      const justBecameFullySigned = !wasFullySigned && isNowFullySigned;
      
      if (justBecameFullySigned && existingNote.tenantId) {
        const routeLines = (note.pickupOrigins || []).map((o: any) => 
          `Recogida: ${o.name || 'N/A'} → Entrega: ${o.address || 'N/A'}`
        ).join('\n');
        const signedDate = (note.signedAt || new Date()).toLocaleDateString('es-ES', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        storage.createMessage({
          tenantId: existingNote.tenantId,
          type: 'delivery_note_signed',
          title: `Albarán #${note.noteNumber} Firmado`,
          body: `Cliente: ${note.clientName || 'No especificado'}\n${routeLines}\nFirmado: ${signedDate}`,
          read: false,
          entityType: 'delivery_note',
          entityId: note.id,
        }).catch(err => {
          console.error("[routes] Failed to create delivery note signed message:", err);
        });
      }
      
      res.json(note);
    } catch (error) {
      console.error("Error updating delivery note:", error);
      res.status(400).json({ error: "Error al actualizar albarán" });
    }
  });

  app.get("/api/delivery-notes", async (req, res) => {
    try {
      // Require authentication for tenant isolation
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const tenantId = (req.user as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      // Filter by tenant for data isolation
      const notes = await storage.getDeliveryNotes(tenantId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching all delivery notes:", error);
      res.status(500).json({ error: "Error al obtener albaranes" });
    }
  });

  app.get("/api/workers/:workerId/delivery-notes", async (req, res) => {
    try {
      // Require authentication for tenant isolation
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const { workerId } = req.params;
      const tenantId = (req.user as any).tenantId;
      
      // Filter by tenant for data isolation
      const notes = await storage.getDeliveryNotes(tenantId, undefined, workerId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching worker delivery notes:", error);
      res.status(500).json({ error: "Error al obtener albaranes" });
    }
  });

  // Soft delete delivery note
  app.delete("/api/delivery-notes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const { id } = req.params;
      const user = req.user as any;
      const tenantId = user.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      // Verify note belongs to tenant
      const existingNote = await storage.getDeliveryNote(id);
      if (!existingNote || existingNote.tenantId !== tenantId) {
        return res.status(404).json({ error: "Albarán no encontrado" });
      }
      
      const deletedNote = await storage.softDeleteDeliveryNote(id, tenantId, user.id);
      if (!deletedNote) {
        return res.status(500).json({ error: "Error al borrar el albarán" });
      }
      
      res.json({ success: true, note: deletedNote });
    } catch (error) {
      console.error("Error soft deleting delivery note:", error);
      res.status(500).json({ error: "Error al borrar el albarán" });
    }
  });

  // Restore deleted delivery note (admin only)
  app.post("/api/delivery-notes/:id/restore", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const { id } = req.params;
      const user = req.user as any;
      
      if (!user.isAdmin) {
        return res.status(403).json({ error: "Solo las empresas pueden restaurar albaranes" });
      }
      
      const tenantId = user.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      const restoredNote = await storage.restoreDeliveryNote(id, tenantId);
      if (!restoredNote) {
        return res.status(404).json({ error: "Albarán no encontrado" });
      }
      
      res.json({ success: true, note: restoredNote });
    } catch (error) {
      console.error("Error restoring delivery note:", error);
      res.status(500).json({ error: "Error al restaurar el albarán" });
    }
  });

  // Permanently delete delivery note (admin only)
  app.delete("/api/delivery-notes/:id/permanent", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const { id } = req.params;
      const user = req.user as any;
      
      if (!user.isAdmin) {
        return res.status(403).json({ error: "Solo las empresas pueden eliminar albaranes" });
      }
      
      const tenantId = user.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }
      
      // Verify note belongs to tenant before deleting
      const existingNote = await storage.getDeliveryNote(id);
      if (!existingNote || existingNote.tenantId !== tenantId) {
        return res.status(404).json({ error: "Albarán no encontrado" });
      }
      
      const success = await storage.permanentDeleteDeliveryNote(id, tenantId);
      if (!success) {
        return res.status(500).json({ error: "Error al eliminar el albarán" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error permanently deleting delivery note:", error);
      res.status(500).json({ error: "Error al eliminar el albarán" });
    }
  });

  // Seed random delivery notes for testing - DISABLED in production for security
  app.post("/api/seed-delivery-notes", async (req, res) => {
    // Disable in production to prevent data poisoning
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: "Endpoint deshabilitado en producción" });
    }
    
    try {
      const workers = ["worker-jose", "worker-luis", "worker-miguel"];
      const cities = ["Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao", "Zaragoza", "Malaga", "Murcia"];
      const vehicles = ["Moto", "Furgoneta", "Furgón", "Carrozado"];
      const clientNames = ["Juan García", "María López", "Carlos Rodríguez", "Ana Martínez", "Pedro Sánchez"];
      const observations = [
        "Entrega con firma",
        "Requiere firma del cliente",
        "Urgente - Mañana antes de las 12",
        "Cuidado: Frágil",
        "Dejar en recepción",
        "Sin observaciones"
      ];

      const generatedNotes = [];

      for (let i = 0; i < 5; i++) {
        const randomWorker = workers[Math.floor(Math.random() * workers.length)];
        const randomOrigin = cities[Math.floor(Math.random() * cities.length)];
        const randomDest = cities[Math.floor(Math.random() * cities.length)];
        const randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
        const randomClient = clientNames[Math.floor(Math.random() * clientNames.length)];
        const randomObs = observations[Math.floor(Math.random() * observations.length)];
        
        // Generate date in last 7 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 7));
        const dateStr = date.toISOString().split('T')[0];
        
        // Random hour 8-18
        const hour = String(8 + Math.floor(Math.random() * 10)).padStart(2, '0');
        const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
        const timeStr = `${hour}:${minute}`;

        // 60% chance to be signed (has photo)
        const isSigned = Math.random() < 0.6;
        const signedDate = isSigned ? new Date() : null;

        const noteData = {
          quoteId: `quote-${i}`,
          workerId: randomWorker,
          clientName: randomClient,
          pickupOrigins: [{ name: '', address: randomOrigin }],
          destination: randomDest,
          vehicleType: randomVehicle,
          date: dateStr,
          time: timeStr,
          observations: randomObs,
          photo: isSigned ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='18' fill='%23666'%3EFoto Albarán%3C/text%3E%3C/svg%3E" : null,
          status: isSigned ? "signed" : "pending",
          signedAt: signedDate,
          notes: null,
        };

        const note = await storage.createDeliveryNote(noteData);
        generatedNotes.push(note);
      }

      res.status(201).json({ message: "5 albaranes generados", notes: generatedNotes });
    } catch (error) {
      console.error("Error seeding delivery notes:", error);
      res.status(400).json({ error: "Error al generar albaranes de prueba" });
    }
  });

  // Admin endpoint to compress existing large photos
  app.post("/api/admin/compress-photos", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(401).json({ error: "No autorizado" });
      }
      
      const tenantId = req.user.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Empresa no encontrada" });
      }

      const { createCanvas, loadImage } = await import('canvas');
      
      // Get all delivery notes with large photos (> 100KB) for this tenant
      const notes = await storage.getDeliveryNotes(tenantId);
      const largePhotoNotes = notes.filter(n => n.photo && n.photo.length > 100000);
      
      let compressed = 0;
      let totalSaved = 0;
      
      for (const note of largePhotoNotes) {
        if (!note.photo) continue;
        
        const originalSize = note.photo.length;
        
        try {
          // Decode base64 image
          const base64Data = note.photo.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Load and resize image
          const img = await loadImage(buffer);
          const maxWidth = 1200;
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          const canvas = createCanvas(width, height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with 70% quality
          const compressedBuffer = canvas.toBuffer('image/jpeg', { quality: 0.7 });
          const compressedBase64 = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
          
          // Update in database
          await storage.updateDeliveryNote(note.id, { photo: compressedBase64 });
          
          const newSize = compressedBase64.length;
          totalSaved += originalSize - newSize;
          compressed++;
          
          console.log(`Compressed photo for note ${note.noteNumber}: ${Math.round(originalSize/1024)}KB -> ${Math.round(newSize/1024)}KB`);
        } catch (err) {
          console.error(`Error compressing photo for note ${note.id}:`, err);
        }
      }
      
      res.json({ 
        success: true, 
        compressed, 
        totalNotes: largePhotoNotes.length,
        savedBytes: totalSaved,
        savedMB: Math.round(totalSaved / 1024 / 1024 * 10) / 10
      });
    } catch (error) {
      console.error("Error compressing photos:", error);
      res.status(500).json({ error: "Error al comprimir fotos" });
    }
  });

  // ==================== MESSAGES ENDPOINTS ====================
  
  // Get all messages for tenant
  app.get("/api/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      const user = req.user as any;
      if (!user.isAdmin) {
        return res.status(403).json({ error: "Solo empresas pueden ver mensajes" });
      }
      if (!user.tenantId) {
        return res.status(400).json({ error: "Tenant no encontrado" });
      }
      const messages = await storage.getMessages(user.tenantId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Error al obtener mensajes" });
    }
  });
  
  // Get unread message count
  app.get("/api/messages/unread-count", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      const user = req.user as any;
      if (!user.isAdmin) {
        return res.status(403).json({ error: "Solo empresas pueden ver mensajes" });
      }
      if (!user.tenantId) {
        return res.status(400).json({ error: "Tenant no encontrado" });
      }
      const count = await storage.getUnreadMessageCount(user.tenantId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Error al obtener conteo" });
    }
  });
  
  // Mark single message as read
  app.patch("/api/messages/:id/read", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      const user = req.user as any;
      if (!user.isAdmin) {
        return res.status(403).json({ error: "Solo empresas pueden gestionar mensajes" });
      }
      if (!user.tenantId) {
        return res.status(400).json({ error: "Tenant no encontrado" });
      }
      const { id } = req.params;
      const message = await storage.markMessageAsRead(id, user.tenantId);
      if (!message) {
        return res.status(404).json({ error: "Mensaje no encontrado" });
      }
      res.json(message);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Error al marcar mensaje" });
    }
  });
  
  // Mark all messages as read
  app.patch("/api/messages/read-all", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }
      const user = req.user as any;
      if (!user.isAdmin) {
        return res.status(403).json({ error: "Solo empresas pueden gestionar mensajes" });
      }
      if (!user.tenantId) {
        return res.status(400).json({ error: "Tenant no encontrado" });
      }
      await storage.markAllMessagesAsRead(user.tenantId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all messages as read:", error);
      res.status(500).json({ error: "Error al marcar mensajes" });
    }
  });

  // =====================================================
  // BLOG ROUTES - Public read, private write with special password
  // =====================================================
  
  const BLOG_ADMIN_PASSWORD = process.env.BLOG_ADMIN_PASSWORD || "ealbaranadmin2024";
  
  // Middleware to check blog admin access
  const checkBlogAdmin = (req: Request, res: Response, next: () => void) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${BLOG_ADMIN_PASSWORD}`) {
      return res.status(401).json({ error: "Acceso no autorizado al blog" });
    }
    next();
  };
  
  // PUBLIC: Get published blog posts
  app.get("/api/blog", async (req, res) => {
    try {
      const posts = await storage.getBlogPosts(true); // Only published
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ error: "Error al obtener artículos" });
    }
  });
  
  // PUBLIC: Get single blog post by slug
  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      if (!post || !post.isPublished) {
        return res.status(404).json({ error: "Artículo no encontrado" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ error: "Error al obtener artículo" });
    }
  });
  
  // ADMIN: Get all blog posts (including unpublished)
  app.get("/api/admin-blog/posts", (req, res, next) => checkBlogAdmin(req, res, next), async (req, res) => {
    try {
      const posts = await storage.getBlogPosts(false); // All posts
      res.json(posts);
    } catch (error) {
      console.error("Error fetching all blog posts:", error);
      res.status(500).json({ error: "Error al obtener artículos" });
    }
  });
  
  // ADMIN: Get single blog post by ID
  app.get("/api/admin-blog/posts/:id", (req, res, next) => checkBlogAdmin(req, res, next), async (req, res) => {
    try {
      const { id } = req.params;
      const post = await storage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ error: "Artículo no encontrado" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ error: "Error al obtener artículo" });
    }
  });
  
  // ADMIN: Create blog post
  app.post("/api/admin-blog/posts", (req, res, next) => checkBlogAdmin(req, res, next), async (req, res) => {
    try {
      const data = insertBlogPostSchema.parse(req.body);
      // Auto-set publishedAt if publishing
      if (data.isPublished && !data.publishedAt) {
        data.publishedAt = new Date();
      }
      const post = await storage.createBlogPost(data);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(400).json({ error: "Error al crear artículo" });
    }
  });
  
  // ADMIN: Update blog post
  app.patch("/api/admin-blog/posts/:id", (req, res, next) => checkBlogAdmin(req, res, next), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      // Auto-set publishedAt if publishing for first time
      if (updates.isPublished && !updates.publishedAt) {
        const existing = await storage.getBlogPost(id);
        if (existing && !existing.publishedAt) {
          updates.publishedAt = new Date();
        }
      }
      const post = await storage.updateBlogPost(id, updates);
      if (!post) {
        return res.status(404).json({ error: "Artículo no encontrado" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(400).json({ error: "Error al actualizar artículo" });
    }
  });
  
  // ADMIN: Delete blog post
  app.delete("/api/admin-blog/posts/:id", (req, res, next) => checkBlogAdmin(req, res, next), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteBlogPost(id);
      if (!deleted) {
        return res.status(404).json({ error: "Artículo no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ error: "Error al eliminar artículo" });
    }
  });
  
  // ADMIN: Verify blog admin password
  app.post("/api/admin-blog/verify", (req, res) => {
    const { password } = req.body;
    if (password === BLOG_ADMIN_PASSWORD) {
      res.json({ valid: true });
    } else {
      res.status(401).json({ valid: false, error: "Contraseña incorrecta" });
    }
  });

  // ===========================================
  // INVOICE ROUTES (Requires authentication)
  // ===========================================
  
  // Get invoice template for tenant
  app.get("/api/invoice-template", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "No autenticado" });
    }
    const user = req.user as any;
    if (!user.tenantId) {
      return res.status(403).json({ error: "Sin tenant asignado" });
    }
    try {
      let template = await storage.getInvoiceTemplate(user.tenantId);
      // If no template exists, return empty template structure
      if (!template) {
        template = {
          id: '',
          tenantId: user.tenantId,
          name: 'Plantilla Principal',
          logoUrl: null,
          logoImageBase64: null,
          companyName: null,
          companyAddress: null,
          companyCity: null,
          companyPostalCode: null,
          companyCountry: 'España',
          companyTaxId: null,
          companyPhone: null,
          companyEmail: null,
          bankName: null,
          bankIban: null,
          bankSwift: null,
          defaultTaxRate: 21,
          defaultPaymentTerms: 'Pago a 30 días',
          footerText: null,
          createdAt: null,
          updatedAt: null,
        };
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching invoice template:", error);
      res.status(500).json({ error: "Error al obtener plantilla" });
    }
  });
  
  // Create or update invoice template
  app.post("/api/invoice-template", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "No autenticado" });
    }
    const user = req.user as any;
    if (!user.tenantId || !user.isAdmin) {
      return res.status(403).json({ error: "Solo empresas pueden configurar plantillas" });
    }
    try {
      const existing = await storage.getInvoiceTemplate(user.tenantId);
      const data = { ...req.body, tenantId: user.tenantId };
      
      if (existing) {
        const updated = await storage.updateInvoiceTemplate(existing.id, user.tenantId, data);
        res.json(updated);
      } else {
        const created = await storage.createInvoiceTemplate(data);
        res.status(201).json(created);
      }
    } catch (error) {
      console.error("Error saving invoice template:", error);
      res.status(400).json({ error: "Error al guardar plantilla" });
    }
  });
  
  // Get all invoices for tenant
  app.get("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "No autenticado" });
    }
    const user = req.user as any;
    if (!user.tenantId) {
      return res.status(403).json({ error: "Sin tenant asignado" });
    }
    try {
      const invoices = await storage.getInvoices(user.tenantId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: "Error al obtener facturas" });
    }
  });
  
  // Get single invoice with line items
  app.get("/api/invoices/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "No autenticado" });
    }
    const user = req.user as any;
    if (!user.tenantId) {
      return res.status(403).json({ error: "Sin tenant asignado" });
    }
    try {
      const { id } = req.params;
      const invoice = await storage.getInvoice(id, user.tenantId);
      if (!invoice) {
        return res.status(404).json({ error: "Factura no encontrada" });
      }
      const lineItems = await storage.getInvoiceLineItems(id);
      res.json({ ...invoice, lineItems });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ error: "Error al obtener factura" });
    }
  });
  
  // Download invoice as PDF
  app.get("/api/invoices/:id/pdf", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "No autenticado" });
    }
    const user = req.user as any;
    if (!user.tenantId) {
      return res.status(403).json({ error: "Sin tenant asignado" });
    }
    try {
      const { id } = req.params;
      const invoice = await storage.getInvoice(id, user.tenantId);
      if (!invoice) {
        return res.status(404).json({ error: "Factura no encontrada" });
      }
      const lineItems = await storage.getInvoiceLineItems(id);
      const template = await storage.getInvoiceTemplate(user.tenantId);
      
      const pdfBuffer = generateInvoicePdf({
        ...invoice,
        lineItems,
        template,
      });
      
      const filename = `Factura_${invoice.invoicePrefix || ""}${invoice.invoiceNumber}.pdf`;
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      res.status(500).json({ error: "Error al generar PDF" });
    }
  });
  
  // Create invoice with line items
  app.post("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "No autenticado" });
    }
    const user = req.user as any;
    if (!user.tenantId || !user.isAdmin) {
      return res.status(403).json({ error: "Solo empresas pueden crear facturas" });
    }
    try {
      const { lineItems, deliveryNoteIds, ...invoiceData } = req.body;
      
      // Validate all delivery notes belong to current tenant before proceeding
      if (deliveryNoteIds && deliveryNoteIds.length > 0) {
        for (const noteId of deliveryNoteIds) {
          const note = await storage.getDeliveryNote(noteId);
          if (!note || note.tenantId !== user.tenantId) {
            return res.status(403).json({ error: "Albarán no autorizado" });
          }
        }
      }
      
      // Convert prices from euros to cents (multiply by 100)
      const lineItemsInCents = lineItems.map((item: any) => ({
        deliveryNoteId: item.deliveryNoteId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: Math.round(parseFloat(item.unitPrice) * 100),
        subtotal: Math.round(item.quantity * parseFloat(item.unitPrice) * 100),
      }));
      
      // Calculate totals in cents
      const subtotal = lineItemsInCents.reduce((sum: number, item: any) => sum + item.subtotal, 0);
      const taxRate = invoiceData.taxRate ?? 21;
      const taxAmount = Math.round(subtotal * (taxRate / 100));
      const total = subtotal + taxAmount;
      
      // Create invoice with all amounts in cents
      const invoice = await storage.createInvoice({
        ...invoiceData,
        tenantId: user.tenantId,
        subtotal,
        taxAmount,
        total,
      });
      
      // Create line items (all amounts in cents)
      for (const item of lineItemsInCents) {
        await storage.createInvoiceLineItem({
          invoiceId: invoice.id,
          deliveryNoteId: item.deliveryNoteId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        });
      }
      
      // Mark delivery notes as invoiced (already validated above)
      if (deliveryNoteIds && deliveryNoteIds.length > 0) {
        for (const noteId of deliveryNoteIds) {
          await storage.updateDeliveryNote(noteId, { 
            isInvoiced: true, 
            invoicedAt: new Date() 
          });
        }
      }
      
      // Log audit
      await logAudit({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'create_invoice',
        entityType: 'invoice',
        entityId: invoice.id,
        details: { invoiceNumber: invoice.invoiceNumber, total },
        ...getClientInfo(req),
      });
      
      const createdLineItems = await storage.getInvoiceLineItems(invoice.id);
      res.status(201).json({ ...invoice, lineItems: createdLineItems });
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(400).json({ error: "Error al crear factura" });
    }
  });
  
  // Update invoice status
  app.patch("/api/invoices/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "No autenticado" });
    }
    const user = req.user as any;
    if (!user.tenantId || !user.isAdmin) {
      return res.status(403).json({ error: "Solo empresas pueden actualizar facturas" });
    }
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // If marking as paid, set paidAt
      if (updates.status === 'paid' && !updates.paidAt) {
        updates.paidAt = new Date();
      }
      
      const invoice = await storage.updateInvoice(id, user.tenantId, updates);
      if (!invoice) {
        return res.status(404).json({ error: "Factura no encontrada" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(400).json({ error: "Error al actualizar factura" });
    }
  });
  
  // Delete invoice
  app.delete("/api/invoices/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "No autenticado" });
    }
    const user = req.user as any;
    if (!user.tenantId || !user.isAdmin) {
      return res.status(403).json({ error: "Solo empresas pueden eliminar facturas" });
    }
    try {
      const { id } = req.params;
      const deleted = await storage.deleteInvoice(id, user.tenantId);
      if (!deleted) {
        return res.status(404).json({ error: "Factura no encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ error: "Error al eliminar factura" });
    }
  });

  // Get tenant wait time threshold
  app.get("/api/tenant/wait-time-threshold", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "No autenticado" });
    }
    const user = req.user as any;
    if (!user.tenantId) {
      return res.status(400).json({ error: "Usuario sin empresa" });
    }
    try {
      const threshold = await storage.getTenantWaitTimeThreshold(user.tenantId);
      res.json({ waitTimeThreshold: threshold });
    } catch (error) {
      console.error("Error getting wait time threshold:", error);
      res.status(500).json({ error: "Error obteniendo configuración" });
    }
  });

  // Update tenant wait time threshold
  app.patch("/api/tenant/wait-time-threshold", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "No autenticado" });
    }
    const user = req.user as any;
    if (!user.tenantId || !user.isAdmin) {
      return res.status(403).json({ error: "Solo empresa puede cambiar configuración" });
    }
    try {
      const { waitTimeThreshold } = req.body;
      if (typeof waitTimeThreshold !== "number" || waitTimeThreshold < 1 || waitTimeThreshold > 240) {
        return res.status(400).json({ error: "Umbral debe estar entre 1 y 240 minutos" });
      }
      await storage.updateTenantWaitTimeThreshold(user.tenantId, waitTimeThreshold);
      res.json({ success: true, waitTimeThreshold });
    } catch (error) {
      console.error("Error updating wait time threshold:", error);
      res.status(500).json({ error: "Error actualizando configuración" });
    }
  });

  // Profile setup for OAuth users
  app.post("/api/profile-setup", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "No autenticado" });
    }
    
    const user = req.user as any;
    if (!user.setupRequired) {
      return res.status(400).json({ error: "Usuario ya completó setup" });
    }
    
    try {
      const { companyName, username, password } = req.body;
      
      if (!companyName || !username || !password) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
      }
      
      if (username.length < 3) {
        return res.status(400).json({ error: "Usuario debe tener al menos 3 caracteres" });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ error: "Contraseña debe tener al menos 8 caracteres" });
      }
      
      // Import hashPassword from auth
      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(password);
      
      // Update user
      const updatedUser = await storage.updateUser(user.id, {
        username,
        password: hashedPassword,
        setupRequired: false,
      });
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Error al actualizar usuario" });
      }
      
      // Update tenant with company name
      if (user.tenantId) {
        await db.update(tenants).set({ companyName }).where(eq(tenants.id, user.tenantId));
      }
      
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error in profile setup:", error);
      res.status(500).json({ error: "Error al completar setup" });
    }
  });

  return httpServer;
}
