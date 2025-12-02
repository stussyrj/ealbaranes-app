import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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
      const workers = await storage.getWorkers();
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
      const data = req.body;
      
      // Validate required fields
      if (!data.workerId || !data.quoteId) {
        return res.status(400).json({ error: "workerId y quoteId son requeridos" });
      }
      
      // Map camelCase to snake_case for DB columns
      const noteData = {
        quoteId: data.quoteId,
        workerId: data.workerId,
        clientName: data.clientName || null,
        pickupOrigin: data.pickupOrigin || null,
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
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating delivery note:", error);
      res.status(400).json({ error: "Error al crear albarán" });
    }
  });

  app.get("/api/delivery-notes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const note = await storage.getDeliveryNote(id);
      if (!note) {
        return res.status(404).json({ error: "Albarán no encontrado" });
      }
      res.json(note);
    } catch (error) {
      console.error("Error fetching delivery note:", error);
      res.status(500).json({ error: "Error al obtener albarán" });
    }
  });

  app.patch("/api/delivery-notes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      
      // Get existing note to check if it's signed
      const existingNote = await storage.getDeliveryNote(id);
      if (!existingNote) {
        return res.status(404).json({ error: "Albarán no encontrado" });
      }
      
      // Check if note is already signed (status is not pending)
      if (existingNote.status !== "pending") {
        return res.status(403).json({ error: "No se pueden editar albaranes firmados" });
      }
      
      // Convert signedAt string to Date if present
      if (data.signedAt && typeof data.signedAt === 'string') {
        data.signedAt = new Date(data.signedAt);
      }
      
      // When adding photo, mark as signed
      if (data.photo && !existingNote.photo) {
        data.status = "signed";
      }
      
      const note = await storage.updateDeliveryNote(id, data);
      if (!note) {
        return res.status(404).json({ error: "Albarán no encontrado" });
      }
      res.json(note);
    } catch (error) {
      console.error("Error updating delivery note:", error);
      res.status(400).json({ error: "Error al actualizar albarán" });
    }
  });

  app.get("/api/delivery-notes", async (req, res) => {
    try {
      const notes = await storage.getDeliveryNotes();
      res.json(notes);
    } catch (error) {
      console.error("Error fetching all delivery notes:", error);
      res.status(500).json({ error: "Error al obtener albaranes" });
    }
  });

  app.get("/api/workers/:workerId/delivery-notes", async (req, res) => {
    try {
      const { workerId } = req.params;
      const notes = await storage.getDeliveryNotes(undefined, workerId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching worker delivery notes:", error);
      res.status(500).json({ error: "Error al obtener albaranes" });
    }
  });

  // Seed random delivery notes for testing
  app.post("/api/seed-delivery-notes", async (req, res) => {
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
          pickupOrigin: randomOrigin,
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

  return httpServer;
}
