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
  insertPricingRuleSchema,
  insertVehicleTypeSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/pricing-rules", async (req, res) => {
    try {
      const rules = await storage.getPricingRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching pricing rules:", error);
      res.status(500).json({ error: "Error al obtener las reglas de precios" });
    }
  });

  app.post("/api/pricing-rules", async (req, res) => {
    try {
      const data = insertPricingRuleSchema.parse(req.body);
      const rule = await storage.createPricingRule(data);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating pricing rule:", error);
      res.status(400).json({ error: "Error al crear la regla de precios" });
    }
  });

  app.put("/api/pricing-rules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const rule = await storage.updatePricingRule(id, updates);
      if (!rule) {
        return res.status(404).json({ error: "Regla no encontrada" });
      }
      res.json(rule);
    } catch (error) {
      console.error("Error updating pricing rule:", error);
      res.status(400).json({ error: "Error al actualizar la regla de precios" });
    }
  });

  app.delete("/api/pricing-rules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePricingRule(id);
      if (!deleted) {
        return res.status(404).json({ error: "Regla no encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pricing rule:", error);
      res.status(500).json({ error: "Error al eliminar la regla de precios" });
    }
  });

  app.get("/api/vehicle-types", async (req, res) => {
    try {
      const types = await storage.getVehicleTypes();
      res.json(types);
    } catch (error) {
      console.error("Error fetching vehicle types:", error);
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
      const deleted = await storage.deleteVehicleType(id);
      if (!deleted) {
        return res.status(404).json({ error: "Vehículo no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vehicle type:", error);
      res.status(500).json({ error: "Error al eliminar el tipo de vehículo" });
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
      const destinationCountry = routeInfo.destination.country || data.destinationCountry;
      
      const pricingRules = await storage.getPricingRules();
      
      let applicableRule = pricingRules.find((rule) => {
        if (!rule.isActive) return false;
        
        if (destinationCountry === "Portugal" || destinationCountry === "PT") {
          return rule.country === "Portugal";
        }
        if (destinationCountry === "Francia" || destinationCountry === "France" || destinationCountry === "FR") {
          return rule.country === "Francia";
        }
        
        return rule.country === "España" && distance >= rule.minKm && distance < rule.maxKm;
      });
      
      if (!applicableRule) {
        applicableRule = pricingRules.find((rule) => rule.zone === 4 && rule.isActive);
      }
      
      if (!applicableRule) {
        return res.status(400).json({ error: "No se encontró una zona de precios aplicable" });
      }
      
      const vehicleType = await storage.getVehicleType(data.vehicleTypeId);
      if (!vehicleType) {
        return res.status(400).json({ error: "Tipo de vehículo no encontrado" });
      }
      
      const basePrice = applicableRule.basePrice;
      const distanceCost = distance * applicableRule.pricePerKm;
      const subtotalBeforeTolls = basePrice + distanceCost;
      const tollCost = applicableRule.tollSurcharge > 0 
        ? subtotalBeforeTolls * (applicableRule.tollSurcharge / 100) 
        : 0;
      
      const vehicleMultiplier = vehicleType.priceMultiplier;
      const vehicleAdjustedCost = (subtotalBeforeTolls + tollCost) * vehicleMultiplier;
      
      const extras = data.extras || {};
      const extrasList: { name: string; cost: number }[] = [];
      
      if (extras.urgente) {
        extrasList.push({ name: "Envío Urgente (+25%)", cost: vehicleAdjustedCost * 0.25 });
      }
      if (extras.cargaFragil) {
        extrasList.push({ name: "Carga Frágil (+10%)", cost: vehicleAdjustedCost * 0.10 });
      }
      if (extras.seguroExtra) {
        extrasList.push({ name: "Seguro Extra", cost: 35 });
      }
      
      const extrasCost = extrasList.reduce((sum, e) => sum + e.cost, 0);
      let totalPrice = vehicleAdjustedCost + extrasCost;
      
      const minimumPrice = applicableRule.minPrice * vehicleMultiplier;
      if (totalPrice < minimumPrice) {
        totalPrice = minimumPrice;
      }
      
      totalPrice = Math.round(totalPrice * 100) / 100;
      
      const quote = await storage.createQuote({
        origin: data.origin,
        destination: data.destination,
        originCoords: JSON.stringify({ lat: routeInfo.origin.lat, lng: routeInfo.origin.lng }),
        destinationCoords: JSON.stringify({ lat: routeInfo.destination.lat, lng: routeInfo.destination.lng }),
        distance,
        duration,
        vehicleTypeId: vehicleType.id,
        vehicleTypeName: vehicleType.name,
        pricingRuleId: applicableRule.id,
        zoneName: applicableRule.name,
        basePrice,
        distanceCost,
        tollCost,
        vehicleMultiplier,
        extras: JSON.stringify(extrasList),
        extrasCost,
        totalPrice,
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
          zone: {
            id: applicableRule.id,
            zone: applicableRule.zone,
            name: applicableRule.name,
            country: applicableRule.country,
          },
          vehicle: {
            id: vehicleType.id,
            name: vehicleType.name,
            capacity: vehicleType.capacity,
            multiplier: vehicleMultiplier,
          },
          pricing: {
            basePrice,
            distanceCost,
            pricePerKm: applicableRule.pricePerKm,
            tollSurcharge: applicableRule.tollSurcharge,
            tollCost,
            vehicleMultiplier,
            subtotal: vehicleAdjustedCost,
            extras: extrasList,
            extrasCost,
            minimumPrice,
            totalPrice,
          },
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
