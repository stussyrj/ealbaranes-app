import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, initializeAdminUser } from "./auth";
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
  tenants,
} from "@shared/schema";
import { stripeService } from "./stripeService";
import { get[REDACTED-STRIPE] } from "./stripeClient";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { sendDeliveryNoteCreatedEmail, sendDeliveryNoteSignedEmail, getAdminEmailForTenant } from "./email";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  setupAuth(app);
  await initializeAdminUser();
  
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
      const userId = req.query.userId as string | undefined;
      const quotes = await storage.getQuotes(userId);
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ error: "Error al obtener los presupuestos" });
    }
  });

  app.get("/api/quotes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const quote = await storage.getQuote(id);
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
      const { id } = req.params;
      const { status } = req.body;
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ error: "Presupuesto no encontrado" });
      }

      // Check carrozado availability before approving
      if (status === "approved" && quote.vehicleTypeId === "carrozado" && quote.pickupTime && quote.duration) {
        if (!storage.isCarrozadoAvailableAtDateTime(quote.pickupTime, quote.duration)) {
          return res.status(400).json({ error: "El carrozado no está disponible en este horario. Otros pedidos ya están reservados. Cancela o completa el servicio anterior para continuar." });
        }
      }

      const updatedQuote = await storage.updateQuoteStatus(id, status);
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
      const { id } = req.params;
      const quote = await storage.updateQuoteStatus(id, "confirmed");
      if (!quote) {
        return res.status(404).json({ error: "Presupuesto no encontrado" });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error confirming quote:", error);
      res.status(400).json({ error: "Error al confirmar el presupuesto" });
    }
  });

  // Workers endpoints
  app.get("/api/workers", async (req, res) => {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const workers = await storage.getWorkers(includeInactive);
      res.json(workers);
    } catch (error) {
      console.error("Error fetching workers:", error);
      res.status(500).json({ error: "Error al obtener trabajadores" });
    }
  });

  app.post("/api/workers", async (req, res) => {
    try {
      const { name, email, phone } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Nombre y email son requeridos" });
      }
      const worker = await storage.createWorker({ name, email, phone: phone || "" });
      res.status(201).json(worker);
    } catch (error) {
      console.error("Error creating worker:", error);
      res.status(400).json({ error: "Error al crear trabajador" });
    }
  });

  app.patch("/api/workers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const worker = await storage.updateWorker(id, updates);
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
      const { id } = req.params;
      const deleted = await storage.deleteWorker(id);
      if (!deleted) {
        return res.status(404).json({ error: "Trabajador no encontrado" });
      }
      res.json({ success: true, message: "Trabajador eliminado permanentemente" });
    } catch (error) {
      console.error("Error deleting worker:", error);
      res.status(400).json({ error: "Error al eliminar trabajador" });
    }
  });

  // Assign quote to worker
  app.patch("/api/quotes/:id/assign-worker", async (req, res) => {
    try {
      const { id } = req.params;
      const { workerId } = req.body;
      
      if (!workerId) {
        return res.status(400).json({ error: "ID del trabajador es requerido" });
      }

      const quote = await storage.assignQuoteToWorker(id, workerId);
      if (!quote) {
        return res.status(404).json({ error: "Presupuesto no encontrado" });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error assigning quote to worker:", error);
      res.status(400).json({ error: "Error al asignar trabajador" });
    }
  });

  // Worker orders
  app.get("/api/workers/:workerId/orders", async (req, res) => {
    try {
      const { workerId } = req.params;
      const orders = await storage.getQuotes(undefined, workerId);
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
      if (!data.workerId || !data.quoteId) {
        return res.status(400).json({ error: "workerId y quoteId son requeridos" });
      }
      
      // Determine creatorType based on authenticated user
      const creatorType = user?.isAdmin ? "admin" : "worker";
      console.log("[routes] creatorType determined:", creatorType);
      
      // Map camelCase to snake_case for DB columns
      const noteData = {
        quoteId: data.quoteId,
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
      };
      const note = await storage.createDeliveryNote(noteData);
      
      // Send email notification to admin (non-blocking)
      if (user?.tenantId) {
        getAdminEmailForTenant(user.tenantId).then(adminEmail => {
          if (adminEmail) {
            sendDeliveryNoteCreatedEmail(adminEmail, {
              noteNumber: note.noteNumber,
              clientName: note.clientName || undefined,
              pickupOrigins: note.pickupOrigins || undefined,
              destination: note.destination || undefined,
              createdBy: user.isAdmin ? 'Empresa' : (user.displayName || user.username || 'Trabajador'),
            }).catch(err => {
              console.error("[routes] Failed to send delivery note created email:", err);
            });
          }
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
        
        // Check if this is a signature-only update (photo or signature)
        const isSignatureUpdate = Object.keys(data).every(key => 
          key === 'photo' || key === 'signature'
        );
        
        // Allow adding photo or signature to partially signed notes
        // But block all other edits once note is fully signed
        if (existingNote.signedAt && !isSignatureUpdate) {
          return res.status(403).json({ error: "No se pueden editar albaranes completamente firmados" });
        }
        
        // Block all edits (except signature) once note is fully signed (has both photo AND signature)
        if (existingNote.photo && existingNote.signature && !isSignatureUpdate) {
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
      
      // Determine final state after update (photo and signature)
      const willHavePhoto = data.photo !== undefined ? data.photo : existingNote.photo;
      const willHaveSignature = data.signature !== undefined ? data.signature : existingNote.signature;
      const willBeFullySigned = willHavePhoto && willHaveSignature;
      
      // Auto-set signedAt and status when both photo AND signature are present
      if (willBeFullySigned && !existingNote.signedAt) {
        data.signedAt = new Date();
        data.status = "signed";
      }
      
      const note = await storage.updateDeliveryNote(id, data);
      if (!note) {
        return res.status(404).json({ error: "Albarán no encontrado" });
      }
      
      // Send email notification when note becomes fully signed (non-blocking)
      const wasFullySigned = existingNote.photo && existingNote.signature;
      const isNowFullySigned = note.photo && note.signature;
      const justBecameFullySigned = !wasFullySigned && isNowFullySigned;
      
      if (justBecameFullySigned && existingNote.tenantId) {
        getAdminEmailForTenant(existingNote.tenantId).then(adminEmail => {
          if (adminEmail) {
            sendDeliveryNoteSignedEmail(adminEmail, {
              noteNumber: note.noteNumber,
              clientName: note.clientName || undefined,
              pickupOrigins: note.pickupOrigins || undefined,
              destination: note.destination || undefined,
              signedAt: note.signedAt || new Date(),
            }).catch(err => {
              console.error("[routes] Failed to send delivery note signed email:", err);
            });
          }
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

  // ========== STRIPE SUBSCRIPTION ROUTES ==========

  // Helper to check if [REDACTED-STRIPE] is disabled
  const is[REDACTED-STRIPE] = () => process.env.STRIPE_DISABLED === 'true';

  // Get [REDACTED-STRIPE] publishable key for frontend
  app.get("/api/stripe/config", async (req, res) => {
    if (is[REDACTED-STRIPE] {
      return res.json({ publishableKey: null, disabled: true, message: "Pagos próximamente disponibles" });
    }
    try {
      const publishableKey = await get[REDACTED-STRIPE]
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting [REDACTED-STRIPE] config:", error);
      res.status(500).json({ error: "Error al obtener configuración de [REDACTED-STRIPE] });
    }
  });

  // Get available subscription products
  app.get("/api/stripe/products", async (req, res) => {
    if (is[REDACTED-STRIPE] {
      return res.json({ products: [], disabled: true, message: "Pagos próximamente disponibles" });
    }
    try {
      const products = await stripeService.getProductsWithPrices();
      res.json({ products });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Error al obtener productos" });
    }
  });

  // Get tenant subscription status
  app.get("/api/subscription", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }

      // When [REDACTED-STRIPE] is disabled, grant free trial access
      if (is[REDACTED-STRIPE] {
        return res.json({
          subscription: null,
          status: 'trial',
          disabled: true,
          message: 'Período de prueba gratuito - Pagos próximamente disponibles',
          companyName: req.user.companyName || 'Tu Empresa',
        });
      }

      const user = req.user;
      
      // Find tenant for this user
      let tenant = null;
      if (user.tenantId) {
        const [foundTenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId));
        tenant = foundTenant;
      } else if (user.isAdmin) {
        // Admin without tenant - check if they have one
        const [foundTenant] = await db.select().from(tenants).where(eq(tenants.adminUserId, user.id));
        tenant = foundTenant;
      }

      if (!tenant) {
        return res.json({ 
          subscription: null,
          status: 'no_subscription',
          message: 'No tienes una suscripción activa'
        });
      }

      let stripeSubscription = null;
      if (tenant.stripeSubscriptionId) {
        stripeSubscription = await stripeService.getSubscription(tenant.stripeSubscriptionId);
      }

      res.json({
        subscription: stripeSubscription,
        status: tenant.subscriptionStatus,
        currentPeriodEnd: tenant.currentPeriodEnd,
        graceUntil: tenant.graceUntil,
        companyName: tenant.companyName,
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Error al obtener suscripción" });
    }
  });

  // Create checkout session for subscription
  app.post("/api/stripe/checkout", async (req: any, res) => {
    if (is[REDACTED-STRIPE] {
      return res.status(503).json({ error: "Pagos próximamente disponibles", disabled: true });
    }
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }

      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Solo administradores pueden suscribirse" });
      }

      const { priceId, companyName } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: "priceId es requerido" });
      }

      const user = req.user;
      
      // Find or create tenant
      let [tenant] = await db.select().from(tenants).where(eq(tenants.adminUserId, user.id));
      
      if (!tenant) {
        // Create new tenant
        const [newTenant] = await db.insert(tenants).values({
          adminUserId: user.id,
          companyName: companyName || `Empresa de ${user.displayName || user.username}`,
          subscriptionStatus: 'active', // Will be updated by webhook
        }).returning();
        tenant = newTenant;
        
        // Update user with tenantId
        await storage.updateUser(user.id, { tenantId: tenant.id });
      }

      // Create or get [REDACTED-STRIPE] customer
      let customerId = tenant.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(
          user.email || user.username + '@ealbaran.app',
          tenant.id,
          tenant.companyName || undefined
        );
        customerId = customer.id;
        
        await db.update(tenants).set({ 
          stripeCustomerId: customerId,
          updatedAt: new Date()
        }).where(eq(tenants.id, tenant.id));
      }

      // Create checkout session
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/subscription/success`,
        `${baseUrl}/subscription/cancel`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Error al crear sesión de pago" });
    }
  });

  // Create customer portal session
  app.post("/api/stripe/portal", async (req: any, res) => {
    if (is[REDACTED-STRIPE] {
      return res.status(503).json({ error: "Gestión de suscripciones próximamente disponible", disabled: true });
    }
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }

      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Solo administradores pueden gestionar suscripciones" });
      }

      const user = req.user;
      
      // Find tenant
      const [tenant] = await db.select().from(tenants).where(eq(tenants.adminUserId, user.id));
      
      if (!tenant || !tenant.stripeCustomerId) {
        return res.status(400).json({ error: "No tienes una suscripción activa" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripeService.createCustomerPortalSession(
        tenant.stripeCustomerId,
        `${baseUrl}/admin/subscription`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: "Error al crear portal de gestión" });
    }
  });

  // Admin endpoint to compress existing large photos
  app.post("/api/admin/compress-photos", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(401).json({ error: "No autorizado" });
      }

      const { createCanvas, loadImage } = await import('canvas');
      
      // Get all delivery notes with large photos (> 100KB)
      const notes = await storage.getDeliveryNotes();
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

  return httpServer;
}
