# eAlbarán - Gestión Digital de Albaranes de Transporte

## Status: OPERATIONAL - Modal de Firma Mejorado

**La aplicación está funcionando con modal separado para firmas digitales con más espacio.**

## Overview

eAlbarán es una aplicación B2B SaaS multi-tenant para **gestión de albaranes digitales de transporte**. Los trabajadores crean albaranes digitales con fotos/firmas, y las empresas tienen acceso completo para gestionar y controlar esos albaranes.

**Tech Stack**:
- Frontend: React + TypeScript con Vite
- Backend: Express + TypeScript
- Base de datos: PostgreSQL via Neon con Drizzle ORM
- Pagos: Sin pagos (código de [REDACTED-STRIPE] eliminado)
- UI Framework: shadcn/ui con Tailwind CSS

## Últimos Cambios

### Modal de Firma Digital Separado (Diciembre 12, 2025)
- **SignatureModalDialog.tsx**: Nuevo componente modal independiente para capturar firmas
  - Canvas de tamaño completo (max-w-4xl, h-[90vh]) para mejor experiencia
  - Soporte completo de mouse y touch
  - Botones para limpiar y confirmar
  - Auto-cierra después de confirmar

- **DeliveryNoteSigningModal.tsx**: Actualizado para usar el nuevo modal
  - Botones "Capturar firma de origen/destino" reemplazan canvas inline
  - Al hacer click, abre modal separado para firma
  - Dirty-tracking mejorado para documento DNI
  - Auto-save de firma de origen al cambiar tabs

### Bug Fixes
- Resolver pérdida de datos en firmas de origen al cerrar app
- Agregar tracking de cambios para documento DNI
- Confirmación al cerrar modal con datos sin guardar

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
- Sistema multi-tenant con aislamiento de datos completo
- Rate limiting en login (protección anti brute-force)
- Sistema de auditoría (tabla audit_logs en PostgreSQL)
- Validación estricta de registro
- Registro de empresas con creación automática de tenant
- Verificación de email ACTIVA
- Middleware de acceso por tenant
- Frontend React con rutas públicas y protegidas
- Tema claro/spooky (Halloween: naranja, púrpura, negro)
- Números de albarán únicos (Albarán #X) con generación automática
- Descarga de albaranes para seguridad (fotos firmados / CSV pendientes)
- Sesiones persistentes en PostgreSQL
- Usuarios persistidos en base de datos
- Login con email O nombre de usuario para empresas
- Emails vía Resend con diseño spooky
- Sistema de facturación de albaranes (Cobrados/Pendientes de cobro)
- Dashboard con contadores resumen (Hoy, Este mes, Total)
- Modal de descarga mejorado con selector de rango de fechas
- Sistema de firma dual: albarán solo "firmado" cuando tiene AMBOS foto Y firma digital
- Componente SignaturePad para captura de firmas táctiles
- Autocomplete para campos de cliente, origen y destino
- Badges separados mostrando estado de foto y firma
- Orígenes de recogida con campos separados de nombre y dirección (JSONB)
- Sidebar móvil optimizado
- **Tutorial de bienvenida (Onboarding)** con pasos diferentes para empresa vs trabajador
- **Sistema de recuperación de contraseña** con tokens y rate limiting
- **Sistema completo de facturación** (plantilla, wizard, PDF, numeración secuencial)
- **Autenticación con Google OAuth 2.0** con auto-creación de cuentas
- **Flujo de Setup Obligatorio para OAuth** (empresa, usuario, contraseña)
- **Artículos de Blog SEO-optimizados**
- **Corrección de Cálculos Financieros** (IVA correcto)
- **Modal de firma separado** con canvas de tamaño completo
- **Dirty-tracking para firma y documento DNI**
- **Auto-save de firma de origen** al cambiar tabs
- **Sistema de borrado de albaranes (Papelera)** - Soft delete con restauración para admin

## Endpoints de Borrado de Albaranes
- `DELETE /api/delivery-notes/:id` - Borrar albarán (soft delete, marca deletedAt/deletedBy)
- `GET /api/delivery-notes/deleted` - Lista albaranes borrados (solo admin)
- `POST /api/delivery-notes/:id/restore` - Restaurar albarán borrado (solo admin)

## Preferencias Usuario

- Idioma: Español
- Comunicación: Lenguaje simple y cotidiano
- Tema: Toggle oscuro/claro activo

## Credenciales de Desarrollo

- Usuario empresa por defecto: `admin` / `admin123`
- **Solo disponible en desarrollo local** (NODE_ENV=development)
- Deshabilitado automáticamente en producción por seguridad
