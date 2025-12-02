import [REDACTED-STRIPE] from 'stripe';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const connectorName = 'stripe';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();
  
  connectionSettings = data.items?.[0];

  if (!connectionSettings || (!connectionSettings.settings.publishable || !connectionSettings.settings.secret)) {
    throw new Error(`[REDACTED-STRIPE] ${targetEnvironment} connection not found`);
  }

  return {
    publishableKey: connectionSettings.settings.publishable,
    secretKey: connectionSettings.settings.secret,
  };
}

export async function getUncachable[REDACTED-STRIPE] {
  const { secretKey } = await getCredentials();

  return new [REDACTED-STRIPE] {
    apiVersion: '2025-08-27.basil' as any,
  });
}

export async function get[REDACTED-STRIPE] {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function get[REDACTED-STRIPE] {
  const { secretKey } = await getCredentials();
  return secretKey;
}

let stripeSync: any = null;

export async function get[REDACTED-STRIPE] {
  if (!stripeSync) {
    const { [REDACTED-STRIPE] } = await import('stripe-replit-sync');
    const secretKey = await get[REDACTED-STRIPE]

    stripeSync = new [REDACTED-STRIPE]
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
