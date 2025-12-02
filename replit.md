# DirectTransports - Transportation Quote SaaS

## Status: OPERATIONAL - Multi-tenant SaaS con Suscripciones

**Sistema de suscripciones implementado. La aplicación está funcionando correctamente.**

## Overview

DirectTransports es una aplicación B2B SaaS multi-tenant para gestión de presupuestos de transporte. Cada empresa (tenant) tiene su propia cuenta administrada con suscripción mensual/anual vía [REDACTED-STRIPE]

**Tech Stack Resumen**:
- Frontend: React + TypeScript con Vite
- Backend: Express + TypeScript
- Base de datos: PostgreSQL via Neon con Drizzle ORM
- Pagos: [REDACTED-STRIPE] (suscripciones)
- API de Enrutamiento: OpenRouteService
- UI Framework: shadcn/ui con Tailwind CSS

## Sistema Multi-Tenant

### Modelo de Negocio
- **Administradores**: Pagan suscripción mensual (29€) o anual (290€)
- **Trabajadores**: Acceso gratuito (invitados por su admin)
- **Período de gracia**: 30 días después de cancelación (solo lectura)
- **Retención de datos**: 90 días después de cancelación antes de eliminación

### Rutas Públicas
- `/pricing` - Página de precios
- `/register` - Registro de empresa (crea tenant + cliente [REDACTED-STRIPE]

### Rutas Protegidas
- `/admin/subscription` - Gestión de suscripción (solo admin)
- `/admin/users` - Gestión de usuarios

## Endpoints Backend

### Autenticación
- `POST /api/register` - Registro de admin (crea tenant + [REDACTED-STRIPE] customer)
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/user` - Usuario actual

### [REDACTED-STRIPE]
- `GET /api/stripe/products` - Lista productos disponibles
- `POST /api/stripe/checkout` - Crear sesión de checkout
- `POST /api/stripe/portal` - Portal de gestión de suscripción
- `GET /api/stripe/subscription` - Estado de suscripción

### Presupuestos y Albaranes
- `GET /api/quotes` - Lista presupuestos (filtrado por tenant)
- `POST /api/quotes` - Crear presupuesto
- `PATCH /api/quotes/:id/status` - Actualiza estado
- `PATCH /api/quotes/:id/assign-worker` - Asigna a trabajador
- `GET /api/delivery-notes` - Lista albaranes
- `POST /api/delivery-notes` - Crea albarán
- `PATCH /api/delivery-notes/:id` - Actualiza albarán

## Estado Actual

### ✅ Completado
- Sistema multi-tenant con aislamiento de datos
- Registro de empresas con creación automática de tenant
- Integración [REDACTED-STRIPE] para suscripciones
- Middleware de acceso por tenant con verificación de suscripción
- Período de gracia (30 días) y retención de datos (90 días)
- Webhooks [REDACTED-STRIPE] para gestión de estados
- Páginas de pricing, registro y gestión de suscripción
- Frontend React con rutas públicas y protegidas
- Tema oscuro/claro
- Sidebar con navegación

### ⚠️ Problema Actual
- **API Key de [REDACTED-STRIPE] Expirada**: Necesita actualizar la clave en el panel de [REDACTED-STRIPE]
  - El servidor funciona pero sin integración de pagos activa
  - Una vez actualizada la clave, la sincronización será automática

## Preferencias Usuario

- Idioma: Español
- Comunicación: Lenguaje simple y cotidiano
- Tema: Toggle oscuro/claro activo
- Modelo de precios: Precio por km + precio mínimo
- Opción urgencia: Recargo 25%

## Credenciales de Desarrollo

- Usuario admin por defecto: `admin` / `admin123`
- Solo para desarrollo local
