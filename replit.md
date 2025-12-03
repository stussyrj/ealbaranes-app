# eAlbarán - Gestión Digital de Albaranes de Transporte

## Status: OPERATIONAL - Multi-tenant SaaS con Suscripciones

**Sistema de suscripciones implementado. La aplicación está funcionando correctamente.**

## Overview

eAlbarán es una aplicación B2B SaaS multi-tenant para **gestión de albaranes digitales de transporte**. Los trabajadores crean albaranes digitales con fotos/firmas, y las empresas tienen acceso completo para gestionar y controlar esos albaranes.

**Tech Stack**:
- Frontend: React + TypeScript con Vite
- Backend: Express + TypeScript
- Base de datos: PostgreSQL via Neon con Drizzle ORM
- Pagos: [REDACTED-STRIPE] (suscripciones)
- UI Framework: shadcn/ui con Tailwind CSS

## Modelo de Usuarios

La aplicación tiene dos tipos de usuarios claramente diferenciados:

### Empresa (antes "admin")
- Pagan suscripción mensual (29€) o anual (290€)
- Panel de Empresa con acceso completo
- Gestionan trabajadores y supervisan albaranes
- Acceden a: Dashboard, Gestión de Usuarios, Suscripción

### Trabajador
- Acceso gratuito (creados por su empresa)
- Panel de Trabajador con funciones limitadas
- Crean albaranes digitales con fotos y firmas
- Solo ven sus propios albaranes

## Sistema Multi-Tenant

### Modelo de Negocio
- **Empresa**: Paga suscripción mensual (29€) o anual (290€)
- **Trabajadores**: Acceso gratuito (invitados por su empresa)
- **Período de gracia**: 30 días después de cancelación (solo lectura)
- **Retención de datos**: 90 días después de cancelación antes de eliminación

### Flujo de Uso
1. **Empresa** se registra y paga suscripción
2. **Empresa** crea trabajadores desde el panel
3. **Trabajadores** crean albaranes digitales con fotos/firmas
4. **Empresa** gestiona y supervisa todos los albaranes

### Rutas Públicas
- `/pricing` - Página de precios
- `/register` - Registro de empresa (crea tenant + cliente [REDACTED-STRIPE] envía email de verificación)
- `/verify-email` - Verificación de email (procesa token de verificación)
- `/login` - Inicio de sesión

### Rutas Protegidas (Empresa)
- `/` - Dashboard con resumen de albaranes
- `/admin/subscription` - Gestión de suscripción
- `/admin/users` - Gestión de trabajadores

### Rutas Protegidas (Trabajador)
- `/` - Panel de trabajador para crear/gestionar albaranes

## Endpoints Backend

### Autenticación
- `POST /api/register` - Registro de empresa (crea tenant + [REDACTED-STRIPE] customer, envía email verificación)
- `GET /api/verify-email?token=xxx` - Verificar email con token
- `POST /api/resend-verification` - Reenviar email de verificación (rate limited: 3/hora)
- `POST /api/login` - Login (bloquea usuarios empresa no verificados)
- `POST /api/logout` - Logout
- `GET /api/user` - Usuario actual

### [REDACTED-STRIPE]
- `GET /api/stripe/products` - Lista productos disponibles
- `POST /api/stripe/checkout` - Crear sesión de checkout
- `POST /api/stripe/portal` - Portal de gestión de suscripción
- `GET /api/stripe/subscription` - Estado de suscripción

### Albaranes
- `GET /api/delivery-notes` - Lista albaranes (filtrado por tenant)
- `POST /api/delivery-notes` - Crea albarán (genera noteNumber único automáticamente)
- `PATCH /api/delivery-notes/:id` - Actualiza albarán (añadir firma/foto)

## Estado Actual

### ✅ Completado
- Sistema multi-tenant con aislamiento de datos
- Registro de empresas con creación automática de tenant
- **Verificación de email obligatoria** para empresas (token 24h, rate limit 3 reenvíos/hora)
- Integración [REDACTED-STRIPE] para suscripciones (pagos activos)
- Middleware de acceso por tenant con verificación de suscripción
- Período de gracia (30 días) y retención de datos (90 días)
- Webhooks [REDACTED-STRIPE] para gestión de estados
- Páginas de pricing, registro y gestión de suscripción
- Frontend React con rutas públicas y protegidas
- Tema claro/spooky (Halloween: naranja, púrpura, negro)
- Sidebar simplificado (Dashboard + Gestión de Usuarios + Suscripción)
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
- Emails vía Resend (bienvenida, verificación, notificaciones albaranes)

## Preferencias Usuario

- Idioma: Español
- Comunicación: Lenguaje simple y cotidiano
- Tema: Toggle oscuro/claro activo

## Credenciales de Desarrollo

- Usuario empresa por defecto: `admin` / `admin123`
- Solo para desarrollo local
