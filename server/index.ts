import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { runMigrations } from 'stripe-replit-sync';
import { get[REDACTED-STRIPE] } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';
import { stripeService } from './stripeService';

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

async function init[REDACTED-STRIPE] {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    log('DATABASE_URL not set, skipping [REDACTED-STRIPE] initialization', 'stripe');
    return;
  }

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      log(`Initializing [REDACTED-STRIPE] schema (attempt ${attempt}/${maxRetries})...`, 'stripe');
      
      await runMigrations({ 
        databaseUrl,
        schema: 'stripe'
      });
      log('[REDACTED-STRIPE] schema ready', 'stripe');

      const stripeSync = await get[REDACTED-STRIPE]

      log('Setting up managed webhook...', 'stripe');
      const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const { webhook, uuid } = await stripeSync.findOrCreateManagedWebhook(
        `${webhookBaseUrl}/api/stripe/webhook`,
        {
          enabled_events: ['*'],
          description: 'DirectTransports subscription webhook',
        }
      );
      log(`Webhook configured: ${webhook.url}`, 'stripe');

      log('Syncing [REDACTED-STRIPE] data in background...', 'stripe');
      stripeSync.syncBackfill()
        .then(async () => {
          log('[REDACTED-STRIPE] data synced', 'stripe');
          await stripeService.ensureSubscriptionProducts();
        })
        .catch((err: Error) => {
          log(`Error syncing [REDACTED-STRIPE] data: ${err.message}`, 'stripe');
        });
      
      return;
    } catch (error: any) {
      log(`[REDACTED-STRIPE] init attempt ${attempt} failed: ${error.message}`, 'stripe');
      if (attempt < maxRetries) {
        log(`Retrying in 2 seconds...`, 'stripe');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        log(`All [REDACTED-STRIPE] init attempts failed. Continuing without [REDACTED-STRIPE] sync.`, 'stripe');
      }
    }
  }
}

(async () => {
  await init[REDACTED-STRIPE]

  app.post(
    '/api/stripe/webhook/:uuid',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature' });
      }

      try {
        const sig = Array.isArray(signature) ? signature[0] : signature;

        if (!Buffer.isBuffer(req.body)) {
          log('STRIPE WEBHOOK ERROR: req.body is not a Buffer', 'stripe');
          return res.status(500).json({ error: 'Webhook processing error' });
        }

        const { uuid } = req.params;
        await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);

        res.status(200).json({ received: true });
      } catch (error: any) {
        log(`Webhook error: ${error.message}`, 'stripe');
        res.status(400).json({ error: 'Webhook processing error' });
      }
    }
  );

  app.use(
    express.json({
      limit: "50mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false, limit: "50mb" }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        log(logLine);
      }
    });

    next();
  });

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
