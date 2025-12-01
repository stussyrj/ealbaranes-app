# DirectTransports - Transportation Quote SaaS

## Overview

DirectTransports es una aplicación B2B SaaS para gestión de presupuestos de transporte entre administradores y trabajadores. El sistema integra OpenRouteService para cálculo de distancia en tiempo real. El admin crea presupuestos iniciales, los asigna a trabajadores, quienes editan los detalles, y finalmente el cliente firma el albarán digital desde el dispositivo del trabajador.

**Propuesta de Valor Principal**: Workflow completo de presupuestos con firma digital, desde creación por admin hasta entrega confirmada con firma de cliente.

**Tech Stack Resumen**:
- Frontend: React + TypeScript con Vite
- Backend: Express + TypeScript
- Base de datos: PostgreSQL via Neon con Drizzle ORM
- API de Enrutamiento: OpenRouteService
- UI Framework: shadcn/ui con Tailwind CSS
- Sistema de dos roles: Admin, Worker

## Preferencias del Usuario

- Estilo de comunicación preferido: Lenguaje simple y cotidiano
- Idioma: Español (todo en español)
- Características: Toggle tema oscuro/claro (activado)
- Arquitectura: Control de acceso basado en dos roles (admin, worker)
- Admin: Daniel (email: daniel@directtransports.com)
- Nombre de app: DirectTransports
- Modelo de precios: Precio por km + precio mínimo
- Opción de urgencia: Recargo del 25% disponible

## Arquitectura del Sistema (V3.0 - REDISEÑO)

### Roles de Usuario (V3.0)
- **Administrador (Daniel)**: Crea presupuestos, asigna a trabajadores, revisa albaranes firmados
- **Trabajador (José/Luis/Miguel)**: Recibe presupuestos, edita detalles, genera albaranes, captura firma del cliente

### Nuevo Flujo Completo

**1. Admin Crea Presupuesto**
- Ingresa: origen, destino, datos del cliente (nombre, teléfono)
- Selecciona: tipo de vehículo, urgencia
- Sistema calcula: distancia, precio
- Estado: "pending"

**2. Admin Asigna a Trabajador**
- Botón "Asignar Trabajador" en cada presupuesto
- Estado cambia a: "assigned"

**3. Trabajador Edita Presupuesto**
- Ve presupuestos asignados
- Puede ajustar: horario recogida, observaciones
- Confirma detalles
- Estado: "confirmed"

**4. Trabajador Genera Albarán Digital**
- El CLIENTE firma directamente en la app del trabajador (en tablet/teléfono)
- Sistema captura: firma en canvas + datos cliente
- Estado: "signed"

**5. Admin Revisa Albaranes Firmados**
- Dashboard muestra albaranes con firmas
- Confirmación de entrega
- Prueba de firma digitalmente

### Base de Datos

**Tablas existentes sin cambios**:
- `users` - Autenticación
- `workers` - José, Luis, Miguel (predefinidos)
- `vehicle_types` - Moto, Furgoneta, Furgón, Carrozado
- `quotes` - Presupuestos (admin crea)
- `delivery_notes` - Albaranes con firmas

**Campos clave en quotes**:
- `status`: "pending" → "assigned" → "confirmed" → "signed"
- `customerName`, `phoneNumber` - Datos del cliente
- `assignedWorkerId` - Trabajador asignado

### Frontend Architecture (V3.0)

**Rutas**:
- `/` (admin) → DashboardPage (crear/revisar presupuestos)
- `/admin/pricing` → AdminPricingPage
- `/admin/vehicles` → AdminVehiclesPage
- `/` (worker) → WorkerDashboard (editar presupuestos)

**Componentes principales**:
- **DashboardPage**: Admin crea presupuestos con formulario, ve estado, asigna trabajadores, revisa albaranes
- **WorkerDashboard**: Worker ve presupuestos asignados, edita detalles, genera albaranes
- **DeliveryNoteGenerator**: Modal para capturar firma del cliente + datos

### Backend (Sin cambios en endpoints principales)

Endpoints existentes funcionan igual:
- `GET /api/quotes` - Lista presupuestos
- `PATCH /api/quotes/:id/status` - Actualiza estado
- `PATCH /api/quotes/:id/assign-worker` - Asigna a trabajador
- `POST /api/delivery-notes` - Crea albarán
- `PATCH /api/delivery-notes/:id` - Actualiza albarán (añade firma)

## Cambios V3.0

### Eliminado
- Perfil de "cliente" - NO existe más
- Páginas: LandingPage, QuotePage, HistoryPage, ContactPage
- Sistema de calculadora de presupuestos autocalculados

### Nuevo
- Admin CREA presupuestos (no se calculan automáticamente)
- DeliveryNoteGenerator integra captura de datos del cliente + firma
- Nueva sección de albaranes en admin dashboard

### Flujo de Firmas
- Trabajador accede a tablet/teléfono del cliente
- Abre albarán en app
- Cliente ve detalles y firma en canvas
- Sistema captura firma base64 + timestamp
- Admin recibe albarán firmado como prueba

## Notas Técnicas

- Dos roles únicamente: admin, worker
- Admin crea presupuestos manualmente
- Cliente firma directamente en dispositivo del trabajador (no tiene cuenta)
- Albaranes firmados = prueba de entrega
- Datos cliente se capturan en momento de firma en albarán

## ISSUE CRÍTICO PENDIENTE - TURN 9

**Problema**: React app no renderiza UI completo cuando se importan todos los componentes/contextos de App.tsx
- El app mínimal (sin contextos) renderiza correctamente
- La versión completa con AuthProvider, ThemeProvider, SidebarProvider genera error silencioso de compilación en Vite HMR
- Error: "[hmr] Failed to reload /src/App.tsx - importing non-existent modules"
- **Solución temporal**: App.tsx está simplificado a versión mínimalista que renderiza
- **ACCIÓN REQUERIDA**: Debuggear por qué los imports complejos fallan en Vite (posible circular dependency o problema de compilación de módulos)

