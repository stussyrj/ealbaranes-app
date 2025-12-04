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
  
  const verifiedFromEmail = 'eAlbarán <no-reply@ealbaranes.es>';
  
  return {
    client: new Resend(apiKey),
    fromEmail: verifiedFromEmail
  };
}

function getSpookyEmailTemplate(content: {
  title: string;
  subtitle?: string;
  body: string;
  buttonText?: string;
  buttonUrl?: string;
  accentColor?: 'orange' | 'green' | 'purple';
  showSpiderWeb?: boolean;
}) {
  const colors = {
    orange: { primary: '#ff6b1a', gradient: 'linear-gradient(135deg, #ff6b1a 0%, #ea580c 100%)' },
    green: { primary: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' },
    purple: { primary: '#9333ea', gradient: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)' }
  };
  
  const accent = colors[content.accentColor || 'orange'];
  const year = new Date().getFullYear();
  
  const spiderWebSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M50 0 L50 100 M0 50 L100 50 M0 0 L100 100 M100 0 L0 100' stroke='%23ff6b1a' stroke-width='0.3' fill='none' opacity='0.15'/%3E%3Ccircle cx='50' cy='50' r='10' stroke='%23ff6b1a' stroke-width='0.3' fill='none' opacity='0.15'/%3E%3Ccircle cx='50' cy='50' r='25' stroke='%23ff6b1a' stroke-width='0.3' fill='none' opacity='0.12'/%3E%3Ccircle cx='50' cy='50' r='40' stroke='%23ff6b1a' stroke-width='0.3' fill='none' opacity='0.1'/%3E%3C/svg%3E`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${content.title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0c0a09; color: #fafaf9;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0c0a09; ${content.showSpiderWeb !== false ? `background-image: url('${spiderWebSvg}'); background-repeat: repeat;` : ''}">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
              
              <!-- Header with Logo -->
              <tr>
                <td align="center" style="padding-bottom: 30px;">
                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="background: ${accent.gradient}; width: 50px; height: 50px; border-radius: 12px; text-align: center; vertical-align: middle;">
                        <span style="font-size: 24px; font-weight: 700; color: white;">e</span>
                      </td>
                      <td style="padding-left: 12px;">
                        <span style="font-size: 24px; font-weight: 700; color: #fafaf9;">eAlbarán</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Main Card -->
              <tr>
                <td>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(180deg, #1c1917 0%, #171412 100%); border-radius: 16px; border: 1px solid #292524; overflow: hidden;">
                    
                    <!-- Title Section -->
                    <tr>
                      <td style="background: ${accent.gradient}; padding: 32px 40px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: white; letter-spacing: -0.5px;">${content.title}</h1>
                        ${content.subtitle ? `<p style="margin: 8px 0 0; font-size: 18px; color: rgba(255,255,255,0.9);">${content.subtitle}</p>` : ''}
                      </td>
                    </tr>
                    
                    <!-- Body Content -->
                    <tr>
                      <td style="padding: 32px 40px;">
                        ${content.body}
                        
                        ${content.buttonText && content.buttonUrl ? `
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 28px;">
                          <tr>
                            <td align="center">
                              <a href="${content.buttonUrl}" style="display: inline-block; background: ${accent.gradient}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(255, 107, 26, 0.3);">${content.buttonText}</a>
                            </td>
                          </tr>
                        </table>
                        ` : ''}
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding-top: 32px; text-align: center;">
                  <p style="margin: 0 0 12px; color: #a8a29e; font-size: 14px;">
                    ¿Tienes dudas? Escríbenos a 
                    <a href="mailto:info@ealbaranes.es" style="color: #ff6b1a; text-decoration: none; font-weight: 500;">info@ealbaranes.es</a>
                  </p>
                  <p style="margin: 0; color: #78716c; font-size: 12px;">
                    © ${year} eAlbarán - Gestión Digital de Albaranes de Transporte
                  </p>
                  <p style="margin: 8px 0 0; color: #57534e; font-size: 11px;">
                    Este mensaje fue enviado automáticamente. Por favor no respondas directamente a este email.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function getInfoBox(items: { label: string; value: string }[], borderColor: string = '#ff6b1a') {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #292524; border-radius: 12px; border-left: 4px solid ${borderColor}; margin: 20px 0;">
      <tr>
        <td style="padding: 20px 24px;">
          ${items.map(item => `
            <p style="margin: 0 0 8px; color: #a8a29e; font-size: 13px;">${item.label}</p>
            <p style="margin: 0 0 16px; color: #fafaf9; font-size: 15px; font-weight: 500;">${item.value}</p>
          `).join('')}
        </td>
      </tr>
    </table>
  `;
}

function getSuccessBadge(text: string) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 20px;">
      <tr>
        <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 8px 20px; border-radius: 20px;">
          <span style="color: white; font-size: 14px; font-weight: 600;">✓ ${text}</span>
        </td>
      </tr>
    </table>
  `;
}

export async function sendWelcomeEmail(to: string, companyName: string) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const body = `
      <p style="margin: 0 0 16px; color: #e7e5e4; font-size: 16px; line-height: 1.6;">
        Hola <strong style="color: #fafaf9;">${companyName}</strong>,
      </p>
      <p style="margin: 0 0 20px; color: #d6d3d1; font-size: 15px; line-height: 1.7;">
        ¡Bienvenido a eAlbarán! Tu cuenta de empresa ha sido creada correctamente. 
        Ahora puedes empezar a digitalizar tus albaranes de transporte.
      </p>
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
        <tr>
          <td style="padding: 16px 20px; background: #292524; border-radius: 10px; border-left: 3px solid #ff6b1a;">
            <p style="margin: 0 0 4px; color: #ff6b1a; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Lo que puedes hacer</p>
          </td>
        </tr>
      </table>
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #292524;">
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="width: 24px; text-align: center; vertical-align: top; padding-top: 2px;">
                  <span style="display: inline-block; width: 8px; height: 8px; background: #ff6b1a; border-radius: 50%;"></span>
                </td>
                <td style="padding-left: 12px; color: #d6d3d1; font-size: 14px;">
                  Crear y gestionar albaranes digitales
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #292524;">
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="width: 24px; text-align: center; vertical-align: top; padding-top: 2px;">
                  <span style="display: inline-block; width: 8px; height: 8px; background: #ff6b1a; border-radius: 50%;"></span>
                </td>
                <td style="padding-left: 12px; color: #d6d3d1; font-size: 14px;">
                  Añadir trabajadores a tu equipo
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #292524;">
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="width: 24px; text-align: center; vertical-align: top; padding-top: 2px;">
                  <span style="display: inline-block; width: 8px; height: 8px; background: #ff6b1a; border-radius: 50%;"></span>
                </td>
                <td style="padding-left: 12px; color: #d6d3d1; font-size: 14px;">
                  Capturar fotos y firmas electrónicas
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="width: 24px; text-align: center; vertical-align: top; padding-top: 2px;">
                  <span style="display: inline-block; width: 8px; height: 8px; background: #ff6b1a; border-radius: 50%;"></span>
                </td>
                <td style="padding-left: 12px; color: #d6d3d1; font-size: 14px;">
                  Descargar albaranes firmados en ZIP
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <p style="margin: 28px 0 0; color: #a8a29e; font-size: 14px; line-height: 1.6;">
        ¡Gracias por confiar en eAlbarán! Estamos aquí para ayudarte.
      </p>
    `;
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Bienvenido a eAlbarán, ${companyName}`,
      html: getSpookyEmailTemplate({
        title: '¡Bienvenido a eAlbarán!',
        subtitle: 'Tu cuenta está lista',
        body,
        accentColor: 'orange'
      })
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
    
    const body = `
      <p style="margin: 0 0 20px; color: #d6d3d1; font-size: 15px; line-height: 1.7;">
        Se ha creado un nuevo albarán en tu sistema. Aquí están los detalles:
      </p>
      
      ${getInfoBox([
        { label: 'Número de Albarán', value: `#${noteData.noteNumber}` },
        { label: 'Cliente', value: noteData.clientName || 'No especificado' },
        { label: 'Recogidas', value: formatPickupOrigins(noteData.pickupOrigins) },
        { label: 'Destino', value: noteData.destination || 'No especificado' },
        { label: 'Creado por', value: noteData.createdBy }
      ])}
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
        <tr>
          <td style="background: rgba(255, 107, 26, 0.1); border: 1px solid rgba(255, 107, 26, 0.3); border-radius: 10px; padding: 16px 20px;">
            <p style="margin: 0; color: #ff6b1a; font-size: 14px;">
              <strong>⏳ Pendiente de firma</strong><br>
              <span style="color: #d6d3d1;">El albarán está esperando ser completado con foto y firma.</span>
            </p>
          </td>
        </tr>
      </table>
    `;
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Nuevo Albarán #${noteData.noteNumber} creado`,
      html: getSpookyEmailTemplate({
        title: 'Nuevo Albarán Creado',
        subtitle: `#${noteData.noteNumber}`,
        body,
        accentColor: 'orange'
      })
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
    
    const body = `
      ${getSuccessBadge('Completado')}
      
      <p style="margin: 0 0 20px; color: #d6d3d1; font-size: 15px; line-height: 1.7; text-align: center;">
        El albarán ha sido firmado correctamente con foto y firma digital.
      </p>
      
      ${getInfoBox([
        { label: 'Número de Albarán', value: `#${noteData.noteNumber}` },
        { label: 'Cliente', value: noteData.clientName || 'No especificado' },
        { label: 'Recogidas', value: formatPickupOrigins(noteData.pickupOrigins) },
        { label: 'Destino', value: noteData.destination || 'No especificado' },
        { label: 'Fecha de firma', value: signedDate }
      ], '#22c55e')}
      
      <p style="margin: 20px 0 0; color: #a8a29e; font-size: 14px; text-align: center;">
        Puedes descargar el albarán firmado desde tu panel de empresa.
      </p>
    `;
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Albarán #${noteData.noteNumber} firmado correctamente`,
      html: getSpookyEmailTemplate({
        title: 'Albarán Firmado',
        subtitle: `#${noteData.noteNumber}`,
        body,
        accentColor: 'green'
      })
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
  
  const body = `
    <p style="margin: 0 0 16px; color: #e7e5e4; font-size: 16px; line-height: 1.6;">
      Hola <strong style="color: #fafaf9;">${companyName}</strong>,
    </p>
    <p style="margin: 0 0 24px; color: #d6d3d1; font-size: 15px; line-height: 1.7;">
      ¡Gracias por registrarte en eAlbarán! Para activar tu cuenta y poder acceder al sistema, 
      confirma tu email haciendo clic en el botón de abajo.
    </p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
      <tr>
        <td align="center">
          <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(147, 51, 234, 0.4);">Confirmar mi email</a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 8px; color: #78716c; font-size: 13px;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="background: #292524; padding: 12px 16px; border-radius: 8px; word-break: break-all;">
          <a href="${verificationUrl}" style="color: #ff6b1a; font-size: 12px; text-decoration: none;">${verificationUrl}</a>
        </td>
      </tr>
    </table>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 28px;">
      <tr>
        <td style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 10px; padding: 16px 20px;">
          <p style="margin: 0; color: #fbbf24; font-size: 14px;">
            <strong>⚠️ Este enlace expira en 24 horas.</strong><br>
            <span style="color: #d6d3d1;">Si no solicitaste esta cuenta, puedes ignorar este mensaje.</span>
          </p>
        </td>
      </tr>
    </table>
  `;
  
  const { data, error } = await client.emails.send({
    from: fromEmail,
    to: [to],
    subject: `Confirma tu email para eAlbarán`,
    html: getSpookyEmailTemplate({
      title: 'Confirma tu email',
      subtitle: 'Un paso más para empezar',
      body,
      accentColor: 'purple'
    })
  });

  if (error) {
    console.error('[email] Error sending verification email:', error);
    throw new Error(error.message || 'Failed to send verification email');
  }

  console.log('[email] Verification email sent to:', to);
  return { success: true, data };
}
