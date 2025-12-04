import { Resend } from 'resend';
import { db } from './db';
import { tenants, users, PickupOrigin } from '@shared/schema';
import { eq } from 'drizzle-orm';

function formatPickupOrigins(origins?: PickupOrigin[]): string {
  if (!origins || origins.length === 0) return 'No especificado';
  return origins.map(o => o.name ? `${o.name} (${o.address})` : o.address).join(' → ');
}

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

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

async function getResendClient() {
  const { apiKey } = await getCredentials();
  
  // Use the verified domain ealbaranes.es for sending emails
  const verifiedFromEmail = 'eAlbarán <no-reply@ealbaranes.es>';
  
  return {
    client: new Resend(apiKey),
    fromEmail: verifiedFromEmail
  };
}

export async function sendWelcomeEmail(to: string, companyName: string) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Bienvenido a eAlbarán, ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Bienvenido a eAlbarán!</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${companyName}</strong>,</p>
              <p>Tu cuenta de empresa ha sido creada correctamente. Ahora puedes:</p>
              <ul>
                <li>Crear y gestionar albaranes digitales</li>
                <li>Añadir trabajadores a tu equipo</li>
                <li>Supervisar todos los albaranes de tu empresa</li>
                <li>Descargar albaranes firmados para tu respaldo</li>
              </ul>
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              <p>¡Gracias por confiar en eAlbarán!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} eAlbarán - Gestión Digital de Albaranes</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('[email] Error sending welcome email:', error);
      return { success: false, error };
    }

    console.log('[email] Welcome email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('[email] Error sending welcome email:', error);
    return { success: false, error };
  }
}

export async function sendDeliveryNoteCreatedEmail(to: string, noteData: {
  noteNumber: number;
  clientName?: string;
  pickupOrigins?: PickupOrigin[];
  destination?: string;
  createdBy: string;
}) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Nuevo Albarán #${noteData.noteNumber} creado`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f97316; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nuevo Albarán Creado</h1>
              <p style="font-size: 24px; margin: 0;">#${noteData.noteNumber}</p>
            </div>
            <div class="content">
              <p>Se ha creado un nuevo albarán con los siguientes datos:</p>
              <div class="info-box">
                <p><strong>Número:</strong> ${noteData.noteNumber}</p>
                <p><strong>Cliente:</strong> ${noteData.clientName || 'No especificado'}</p>
                <p><strong>Recogidas:</strong> ${formatPickupOrigins(noteData.pickupOrigins)}</p>
                <p><strong>Destino:</strong> ${noteData.destination || 'No especificado'}</p>
                <p><strong>Creado por:</strong> ${noteData.createdBy}</p>
              </div>
              <p>El albarán está pendiente de firma.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} eAlbarán - Gestión Digital de Albaranes</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('[email] Error sending delivery note created email:', error);
      return { success: false, error };
    }

    console.log('[email] Delivery note created email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('[email] Error sending delivery note created email:', error);
    return { success: false, error };
  }
}

export async function sendDeliveryNoteSignedEmail(to: string, noteData: {
  noteNumber: number;
  clientName?: string;
  pickupOrigins?: PickupOrigin[];
  destination?: string;
  signedAt: Date;
}) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const signedDate = noteData.signedAt.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Albarán #${noteData.noteNumber} firmado`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e; }
            .success-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Albarán Firmado</h1>
              <p style="font-size: 24px; margin: 0;">#${noteData.noteNumber}</p>
            </div>
            <div class="content">
              <p style="text-align: center;"><span class="success-badge">✓ Completado</span></p>
              <p>El albarán ha sido firmado correctamente:</p>
              <div class="info-box">
                <p><strong>Número:</strong> ${noteData.noteNumber}</p>
                <p><strong>Cliente:</strong> ${noteData.clientName || 'No especificado'}</p>
                <p><strong>Recogidas:</strong> ${formatPickupOrigins(noteData.pickupOrigins)}</p>
                <p><strong>Destino:</strong> ${noteData.destination || 'No especificado'}</p>
                <p><strong>Firmado:</strong> ${signedDate}</p>
              </div>
              <p>Puedes descargar el albarán firmado desde tu panel de empresa.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} eAlbarán - Gestión Digital de Albaranes</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('[email] Error sending delivery note signed email:', error);
      return { success: false, error };
    }

    console.log('[email] Delivery note signed email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('[email] Error sending delivery note signed email:', error);
    return { success: false, error };
  }
}

export async function getAdminEmailForTenant(tenantId: string): Promise<string | null> {
  try {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    if (!tenant || !tenant.adminUserId) {
      return null;
    }
    
    const [adminUser] = await db.select().from(users).where(eq(users.id, tenant.adminUserId));
    return adminUser?.email || null;
  } catch (error) {
    console.error('[email] Error getting admin email for tenant:', error);
    return null;
  }
}

export async function sendVerificationEmail(to: string, companyName: string, verificationToken: string, baseUrl: string) {
  const { client, fromEmail } = await getResendClient();
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  
  const { data, error } = await client.emails.send({
    from: fromEmail,
    to: [to],
    subject: `Confirma tu email para eAlbarán`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; }
          .button:hover { background: #6d28d9; }
          .link-text { word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-size: 12px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin-top: 20px; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Confirma tu email</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${companyName}</strong>,</p>
            <p>¡Gracias por registrarte en eAlbarán! Para activar tu cuenta y poder acceder al sistema, confirma tu email haciendo click en el siguiente botón:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button" style="color: white;">Confirmar mi email</a>
            </div>
            
            <p style="font-size: 13px; color: #6b7280;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <div class="link-text">${verificationUrl}</div>
            
            <div class="warning">
              <strong>⚠️ Este enlace expira en 24 horas.</strong> Si no solicitaste esta cuenta, puedes ignorar este mensaje.
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} eAlbarán - Gestión Digital de Albaranes</p>
          </div>
        </div>
      </body>
      </html>
    `
  });

  if (error) {
    console.error('[email] Error sending verification email:', error);
    throw new Error(error.message || 'Failed to send verification email');
  }

  console.log('[email] Verification email sent to:', to);
  return { success: true, data };
}
