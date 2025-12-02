import { get[REDACTED-STRIPE] } from './stripeClient';
import { db } from './db';
import { tenants } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await get[REDACTED-STRIPE]
    await sync.processWebhook(payload, signature, uuid);

    const event = JSON.parse(payload.toString());
    await WebhookHandlers.handle[REDACTED-STRIPE]
  }

  static async handle[REDACTED-STRIPE] any): Promise<void> {
    const { type, data } = event;

    switch (type) {
      case 'checkout.session.completed': {
        const session = data.object;
        if (session.mode === 'subscription' && session.subscription) {
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          await db.update(tenants)
            .set({
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: 'active',
              updatedAt: new Date(),
            })
            .where(eq(tenants.stripeCustomerId, customerId));
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = data.object;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

        let subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'in_grace' | 'paused' = 'active';
        if (status === 'active') {
          subscriptionStatus = 'active';
        } else if (status === 'past_due') {
          subscriptionStatus = 'past_due';
        } else if (status === 'canceled' || status === 'unpaid') {
          subscriptionStatus = 'canceled';
        } else if (status === 'paused') {
          subscriptionStatus = 'paused';
        }

        await db.update(tenants)
          .set({
            subscriptionStatus,
            currentPeriodEnd,
            updatedAt: new Date(),
          })
          .where(eq(tenants.stripeCustomerId, customerId));
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = data.object;
        const customerId = subscription.customer as string;
        const now = new Date();
        const graceUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days grace period
        const retentionUntil = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days data retention

        console.log(`[stripe] Subscription canceled for customer ${customerId}. Grace until: ${graceUntil}, Retention until: ${retentionUntil}`);

        await db.update(tenants)
          .set({
            subscriptionStatus: 'in_grace',
            canceledAt: now,
            graceUntil,
            retentionUntil,
            updatedAt: now,
          })
          .where(eq(tenants.stripeCustomerId, customerId));
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = data.object;
        const customerId = invoice.customer as string;

        await db.update(tenants)
          .set({
            subscriptionStatus: 'past_due',
            updatedAt: new Date(),
          })
          .where(eq(tenants.stripeCustomerId, customerId));
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = data.object;
        const customerId = invoice.customer as string;

        const [tenant] = await db.select().from(tenants).where(eq(tenants.stripeCustomerId, customerId));
        if (tenant && (tenant.subscriptionStatus === 'past_due' || tenant.subscriptionStatus === 'in_grace')) {
          await db.update(tenants)
            .set({
              subscriptionStatus: 'active',
              canceledAt: null,
              graceUntil: null,
              updatedAt: new Date(),
            })
            .where(eq(tenants.stripeCustomerId, customerId));
        }
        break;
      }
    }
  }
}
