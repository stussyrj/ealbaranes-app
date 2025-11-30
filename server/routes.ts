import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  geocodeAddress,
  getRouteDistance,
  calculateRouteFromAddresses,
} from "./services/openrouteservice";
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
  
  app.get("/api/vehicle-types", async (req, res) => {
    try {
      const types = await storage.getVehicleTypes();
      res.json(types);
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

  app.post("/api/calculate-quote", async (req, res) => {
    try {
      const data = calculateQuoteRequestSchema.parse(req.body);
      
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
      
      // Apply urgency surcharge (25%)
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
      const quote = await storage.updateQuoteStatus(id, status);
      if (!quote) {
        return res.status(404).json({ error: "Presupuesto no encontrado" });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error updating quote status:", error);
      res.status(400).json({ error: "Error al actualizar el estado del presupuesto" });
    }
  });

  return httpServer;
}
