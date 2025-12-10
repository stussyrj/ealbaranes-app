# eAlbarán - Gestión Digital de Albaranes de Transporte

## Status: OPERATIONAL - Acceso Gratuito ([REDACTED-STRIPE] Eliminado)

**La aplicación está funcionando con acceso gratuito. El código de [REDACTED-STRIPE] fue eliminado para permitir publicación.**

## Overview

eAlbarán es una aplicación B2B SaaS multi-tenant para **gestión de albaranes digitales de transporte**. Los trabajadores crean albaranes digitales con fotos/firmas, y las empresas tienen acceso completo para gestionar y controlar esos albaranes.

**Tech Stack**:
- Frontend: React + TypeScript con Vite
- Backend: Express + TypeScript
- Base de datos: PostgreSQL via Neon con Drizzle ORM
- Pagos: Sin pagos (código de [REDACTED-STRIPE] eliminado)
- UI Framework: shadcn/ui con Tailwind CSS

## Modelo de Usuarios

La aplicación tiene dos tipos de usuarios claramente diferenciados:

### Empresa (antes "admin")
- Acceso gratuito ([REDACTED-STRIPE] eliminado)
- Panel de Empresa con acceso completo
- Gestionan trabajadores y supervisan albaranes
- Acceden a: Dashboard, Gestión de Usuarios

### Trabajador
- Acceso gratuito (creados por su empresa)
- Panel de Trabajador con funciones limitadas
- Crean albaranes digitales con fotos y firmas
- Solo ven sus propios albaranes

## Sistema Multi-Tenant

### Modelo de Negocio
- **Empresa**: Acceso gratuito
- **Trabajadores**: Acceso gratuito (invitados por su empresa)

### Flujo de Uso
1. **Empresa** se registra (sin pago requerido)
2. **Empresa** crea trabajadores desde el panel
3. **Trabajadores** crean albaranes digitales con fotos/firmas
4. **Empresa** gestiona y supervisa todos los albaranes

### Rutas Públicas
- `/register` - Registro de empresa (crea tenant, envía email de verificación)
- `/verify-email` - Verificación de email (procesa token de verificación)
- `/login` - Inicio de sesión
- `/forgot-password` - Solicitar recuperación de contraseña
- `/reset-password?token=xxx` - Restablecer contraseña con token

### Rutas Protegidas (Empresa)
- `/` - Dashboard con resumen de albaranes
- `/admin/users` - Gestión de trabajadores
- `/admin/invoices` - Sistema de facturación (crear, ver, descargar PDF)

### Rutas Protegidas (Trabajador)
- `/` - Panel de trabajador para crear/gestionar albaranes

## Endpoints Backend

### Autenticación
- `POST /api/register` - Registro de empresa (crea tenant, envía email verificación)
- `GET /api/verify-email?token=xxx` - Verificar email con token
- `POST /api/resend-verification` - Reenviar email de verificación (rate limited: 3/hora)
- `POST /api/forgot-password` - Solicitar email de recuperación de contraseña (rate limited: 3/hora)
- `POST /api/reset-password` - Restablecer contraseña con token (token expira en 1 hora)
- `POST /api/login` - Login (bloquea usuarios empresa no verificados)
- `POST /api/logout` - Logout
- `GET /api/user` - Usuario actual

### Albaranes (todos requieren autenticación y filtran por tenant)
- `GET /api/delivery-notes` - Lista albaranes (filtrado por tenant del usuario)
- `GET /api/delivery-notes/suggestions` - Sugerencias de autocompletado (filtrado por tenant)
- `GET /api/delivery-notes/:id` - Obtener albarán (verifica propiedad del tenant)
- `POST /api/delivery-notes` - Crea albarán (requiere tenantId, genera noteNumber único)
- `PATCH /api/delivery-notes/:id` - Actualiza albarán (verifica propiedad del tenant)
- `GET /api/workers/:workerId/delivery-notes` - Albaranes de un trabajador (filtrado por tenant)

### Facturas (todos requieren autenticación y filtran por tenant)
- `GET /api/invoices` - Lista facturas (filtrado por tenant)
- `POST /api/invoices` - Crea factura con líneas de artículos (valida albaranes pertenezcan al tenant)
- `PATCH /api/invoices/:id` - Actualiza estado de factura (pending/paid/cancelled)
- `GET /api/invoices/:id/pdf` - Descarga factura en formato PDF
- `GET /api/invoice-template` - Obtener plantilla de factura del tenant
- `PUT /api/invoice-template` - Guardar/actualizar plantilla de factura

## Modelo de Datos - Pickup Origins

Los orígenes de recogida (`pickupOrigins`) usan formato JSONB con objetos:
```typescript
type PickupOrigin = { name: string; address: string };
pickupOrigins: PickupOrigin[] // Array de objetos
```

**Formato de visualización**: "Nombre (Dirección)" o solo Nombre/Dirección si falta uno.
**Múltiples orígenes**: Se muestran como "Origen1 (+N)" donde N es el número de orígenes adicionales.

## Estado Actual

### ✅ Completado
- **Sistema multi-tenant con aislamiento de datos completo**:
  - Todos los endpoints de albaranes requieren autenticación
  - Filtrado por tenantId en todas las consultas
  - Verificación de propiedad al acceder a albaranes individuales
  - Creación de albaranes solo permitida con tenantId válido
  - Endpoint de seed deshabilitado en producción
  - **Endpoints de quotes con aislamiento de tenant** (GET/PATCH/confirm/assign-worker)
  - **Endpoints de workers con aislamiento de tenant** (GET/POST/PATCH/DELETE)
  - Defense-in-depth: storage.getQuote verifica tenantId en capa de datos
  - Rechazo estricto de registros con tenantId nulo o no coincidente
  - Cookies de sesión seguras en producción (secure + sameSite strict)
  - Credenciales por defecto deshabilitadas en producción
- **Rate limiting en login** (protección anti brute-force):
  - Máximo 5 intentos fallidos por IP
  - Bloqueo de 15 minutos tras exceder límite
  - Se resetea automáticamente tras login exitoso
- **Sistema de auditoría** (tabla audit_logs en PostgreSQL):
  - Registra: login, login_failed, logout, create/update/sign/invoice delivery notes
  - Almacena: tenantId, userId, entityType, entityId, IP, user-agent, timestamp
- **Validación estricta de registro**:
  - Usuario: 3-50 caracteres, solo alfanuméricos/guiones/underscore
  - Contraseña: mínimo 8 caracteres, máximo 128
  - Email: validación de formato, máximo 254 caracteres
  - Nombre empresa: máximo 200 caracteres
  - Todos los valores sanitizados (trim, lowercase para email) antes de guardar
- Registro de empresas con creación automática de tenant
- **Verificación de email ACTIVA** - Las empresas deben verificar su email antes de iniciar sesión
- **[REDACTED-STRIPE] ELIMINADO** - Código de pagos eliminado para permitir publicación
- Middleware de acceso por tenant (acceso completo sin verificar suscripción)
- Frontend React con rutas públicas y protegidas
- Tema claro/spooky (Halloween: naranja, púrpura, negro)
- Sidebar simplificado (Dashboard + Gestión de Usuarios)
- Panel de trabajador para albaranes
- Números de albarán únicos (Albarán #X) con generación automática
- Renombrado de app: DirectTransports → eAlbarán
- Terminología actualizada: Admin → Empresa
- Página de login con pestañas (Empresa/Trabajador) y toggle de tema
- Descarga de albaranes para seguridad (fotos firmados / CSV pendientes)
- Sesiones persistentes en PostgreSQL (no requiere re-login al recargar)
- Usuarios persistidos en base de datos (consistencia entre reinicios)
- Login con email O nombre de usuario para empresas
- Lookup de nombres de trabajador con fallback a tabla de usuarios
- Emails vía Resend con diseño spooky (fondo oscuro, colores naranja/púrpura, patrón telaraña)
- Email de contacto: info@ealbaranes.es (incluido en footer de todos los emails)
- Tipos de email: bienvenida, verificación, nuevo albarán, albarán firmado
- Sistema de facturación de albaranes (Cobrados/Pendientes de cobro)
- Filtrado de albaranes por rango de fechas
- **Dashboard con contadores resumen** (Hoy, Este mes, Total):
  - Muestra número de albaranes creados hoy
  - Muestra número de albaranes creados este mes
  - Muestra total de albaranes de todos los tiempos
  - Utiliza `normalizeToLocalDateStr` para manejo correcto de timezone
- **Modal de descarga mejorado**:
  - Selector de rango de fechas (Desde/Hasta)
  - Filtro aplicado a todas las descargas (firmados, cobrados, pendientes)
  - Filtros se resetean al cerrar el modal
  - Manejo de timezone consistente
- Sistema de firma dual: albarán solo "firmado" cuando tiene AMBOS foto Y firma digital
- Componente SignaturePad para captura de firmas táctiles
- Autocomplete para campos de cliente, origen y destino
- Badges separados mostrando estado de foto y firma
- Solo albaranes completamente firmados pueden facturarse
- Orígenes de recogida con campos separados de nombre y dirección (JSONB)
- Formulario dinámico para añadir/eliminar múltiples recogidas con nombre y dirección
- Sidebar móvil optimizado con:
  - Botón X visible para cerrar (esquina superior derecha)
  - Overlay oscuro con desenfoque - click para cerrar
  - Cierre automático al navegar
  - Animaciones suaves (200ms cierre, 300ms apertura)
  - Funciona igual para empresas y trabajadores
- **Tutorial de bienvenida (Onboarding)**:
  - Aparece automáticamente en el primer inicio de sesión
  - Pasos diferentes para empresa vs trabajador
  - Empresa: 5 pasos (Dashboard, Trabajadores, Mensajes, Descargas)
  - Trabajador: 5 pasos (Crear albarán, Foto, Firma, Completado)
  - Se marca como completado en base de datos (hasCompletedOnboarding)
  - No reaparece en sesiones posteriores
- **Sistema de recuperación de contraseña**:
  - Enlace "¿Olvidaste tu contraseña?" en ambas pestañas del login (Empresa/Trabajador)
  - Formulario de solicitud de recuperación vía email
  - Token único de un solo uso con expiración de 1 hora
  - Rate limiting: máximo 3 solicitudes por hora por email
  - Email con tema spooky coherente con el resto de la app
  - Formulario de nueva contraseña con confirmación
  - Registro de auditoría de password_reset
  - No permite enumerar emails (siempre devuelve éxito genérico)
- **Sistema completo de facturación**:
  - Editor de plantilla de factura (logo empresa, datos fiscales, información bancaria)
  - Conversión de albaranes firmados a facturas con wizard/modal guiado
  - Líneas de artículos editables con precios por unidad
  - Cálculo automático de subtotal, IVA (21%) y total
  - Generación de PDF profesional con datos de empresa y cliente
  - Numeración secuencial de facturas por tenant (prefijo + número)
  - Estados de factura: Pendiente, Pagada, Cancelada
  - Descarga de PDF individual por factura
  - Validación de tenant en todas las operaciones (seguridad multi-tenant)
  - Todos los valores monetarios almacenados en céntimos para precisión

## Preferencias Usuario

- Idioma: Español
- Comunicación: Lenguaje simple y cotidiano
- Tema: Toggle oscuro/claro activo

## Credenciales de Desarrollo

- Usuario empresa por defecto: `admin` / `admin123`
- **Solo disponible en desarrollo local** (NODE_ENV=development)
- Deshabilitado automáticamente en producción por seguridad
