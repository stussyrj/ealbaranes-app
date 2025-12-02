import { db } from './db';
import { getUncachable[REDACTED-STRIPE] } from './stripeClient';
import { tenants } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export class [REDACTED-STRIPE] {
  async createCustomer(email: string, tenantId: string, companyName?: string) {
    const stripe = await getUncachable[REDACTED-STRIPE]
    return await stripe.customers.create({
      email,
      name: companyName,
      metadata: { tenantId },
    });
  }

  async ensureSubscriptionProducts() {
    const stripe = await getUncachable[REDACTED-STRIPE]
    
    const existingProducts = await this.listProducts(true);
    if (existingProducts.length > 0) {
      console.log('[stripe] Subscription products already exist');
      return;
    }

    console.log('[stripe] Creating subscription products...');

    const product = await stripe.products.create({
      name: 'eAlbarán Pro',
      description: 'Gestión completa de albaranes digitales de transporte',
      metadata: { type: 'subscription' },
    });

    await stripe.prices.create({
      product: product.id,
      unit_amount: 2900,
      currency: 'eur',
      recurring: { interval: 'month' },
      metadata: { plan: 'monthly' },
    });

    await stripe.prices.create({
      product: product.id,
      unit_amount: 29000,
      currency: 'eur',
      recurring: { interval: 'year' },
      metadata: { plan: 'yearly' },
    });

    console.log('[stripe] Subscription products created successfully');
  }

  async createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string) {
    const stripe = await getUncachable[REDACTED-STRIPE]
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachable[REDACTED-STRIPE]
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }

  async listProducts(active = true) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE active = ${active} ORDER BY name`
    );
    return result.rows;
  }

  async listPrices(active = true) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE active = ${active}`
    );
    return result.rows;
  }

  async getProductsWithPrices(active = true) {
    const result = await db.execute(
      sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = ${active}
        ORDER BY pr.unit_amount
      `
    );
    
    const productsMap = new Map();
    for (const row of result.rows as any[]) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          active: row.product_active,
          metadata: row.product_metadata,
          prices: []
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
          active: row.price_active,
        });
      }
    }
    
    return Array.from(productsMap.values());
  }
}

export const stripeService = new [REDACTED-STRIPE]
