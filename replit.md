# DirectTransports - Gestión de Albaranes Digitales

## Status: OPERATIONAL - Multi-tenant SaaS con Suscripciones

**Sistema de suscripciones implementado. La aplicación está funcionando correctamente.**

## Overview

DirectTransports es una aplicación B2B SaaS multi-tenant para **gestión de albaranes digitales de transporte**. Los trabajadores crean albaranes digitales con fotos/firmas, y los empresarios (administradores) tienen acceso completo para gestionar y controlar esos albaranes.

**Tech Stack**:
- Frontend: React + TypeScript con Vite
- Backend: Express + TypeScript
- Base de datos: PostgreSQL via Neon con Drizzle ORM
- Pagos: [REDACTED-STRIPE] (suscripciones)
- UI Framework: shadcn/ui con Tailwind CSS

## Sistema Multi-Tenant

### Modelo de Negocio
- **Administradores (empresarios)**: Pagan suscripción mensual (29€) o anual (290€)
- **Trabajadores**: Acceso gratuito (invitados por su admin)
- **Período de gracia**: 30 días después de cancelación (solo lectura)
- **Retención de datos**: 90 días después de cancelación antes de eliminación

### Flujo de Uso
1. **Empresario** se registra y paga suscripción
2. **Empresario** crea trabajadores desde el panel
3. **Trabajadores** crean albaranes digitales con fotos/firmas
4. **Empresario** gestiona y supervisa todos los albaranes

### Rutas Públicas
- `/pricing` - Página de precios
- `/register` - Registro de empresa (crea tenant + cliente [REDACTED-STRIPE]

### Rutas Protegidas (Admin)
- `/` - Dashboard con resumen de albaranes
- `/admin/subscription` - Gestión de suscripción
- `/admin/users` - Gestión de trabajadores

### Rutas Protegidas (Trabajador)
- `/` - Panel de trabajador para crear/gestionar albaranes

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

### Albaranes
- `GET /api/delivery-notes` - Lista albaranes (filtrado por tenant)
- `POST /api/delivery-notes` - Crea albarán
- `PATCH /api/delivery-notes/:id` - Actualiza albarán (añadir firma/foto)

## Estado Actual

### ✅ Completado
- Sistema multi-tenant con aislamiento de datos
- Registro de empresas con creación automática de tenant
- Integración [REDACTED-STRIPE] para suscripciones (pagos activos)
- Middleware de acceso por tenant con verificación de suscripción
- Período de gracia (30 días) y retención de datos (90 días)
- Webhooks [REDACTED-STRIPE] para gestión de estados
- Páginas de pricing, registro y gestión de suscripción
- Frontend React con rutas públicas y protegidas
- Tema oscuro/claro
- Sidebar simplificado (Dashboard + Gestión de Usuarios)
- Panel de trabajador para albaranes

## Preferencias Usuario

- Idioma: Español
- Comunicación: Lenguaje simple y cotidiano
- Tema: Toggle oscuro/claro activo

## Credenciales de Desarrollo

- Usuario admin por defecto: `admin` / `admin123`
- Solo para desarrollo local
