# DirectTransports - Transportation Quote SaaS

## Overview

DirectTransports es una aplicación B2B SaaS para calcular presupuestos de transporte basados en distancia de ruta, tipo de vehículo y reglas de precios basadas en zonas. El sistema se integra con OpenRouteService para cálculo de distancia en tiempo real y proporciona a los administradores herramientas para gestionar zonas de precios, tipos de vehículos, historial de presupuestos, y ahora incluye un sistema de tres roles: clientes, administradores y trabajadores.

**Propuesta de Valor Principal**: Generación automática de presupuestos usando datos de enrutamiento real, eliminando errores en estimación de distancias y cálculos de precios. Sistema completo de asignación de trabajadores y albaranes digitales con firma.

**Tech Stack Resumen**:
- Frontend: React + TypeScript con Vite
- Backend: Express + TypeScript
- Base de datos: PostgreSQL via Neon con Drizzle ORM
- API de Enrutamiento: OpenRouteService
- UI Framework: shadcn/ui con Tailwind CSS
- Sistema de tres roles: Cliente, Admin, Trabajador

## Preferencias del Usuario

- Estilo de comunicación preferido: Lenguaje simple y cotidiano
- Idioma: Español (todo en español)
- Características: Toggle tema oscuro/claro (activado)
- Arquitectura: Control de acceso basado en roles (admin, customer, worker)
- Admin: Daniel (email: daniel@directtransports.com)
- Nombre de app: DirectTransports
- Modelo de precios: Precio por km + precio mínimo
- Opción de urgencia: Recargo del 25% disponible en calculadora
- Nuevos trabajadores: José, Luis, Miguel (cada uno solo ve sus pedidos asignados)

## Arquitectura del Sistema

### Estructura de la Aplicación

**Organización Monorepo**:
- `/client` - SPA React frontend
- `/server` - REST API backend Express
- `/shared` - Esquemas TypeScript compartidos y tipos (esquemas Drizzle, validadores Zod)
- `/migrations` - Migraciones de base de datos generadas por Drizzle Kit

**Roles de Usuario (V2.5 - Nuevo)**:
- **Cliente**: Acceso a calculadora de presupuestos, historial de pedidos, contacto
- **Administrador (Daniel)**: Dashboard, gestión de reglas de precios, tipos de vehículos, asignación de trabajadores
- **Trabajador (José/Luis/Miguel)**: Dashboard aislado con solo pedidos asignados, generador de albaranes digitales, captura de firma

### Nuevas Tablas de Base de Datos (V2.5)

**Workers Table**:
- `id`: UUID único para cada trabajador
- `name`: Nombre del trabajador
- `email`: Email único para el trabajador
- `phone`: Teléfono de contacto
- `isActive`: Flag para desactivar sin perder datos
- `createdAt`: Timestamp de creación

**Quotes Table (Actualizada)**:
- Nuevo campo: `assignedWorkerId` - Referencia al trabajador asignado
- Nuevo campo: `status` - puede ser "pending", "confirmed", "approved", "assigned", "rejected", "canceled"

**DeliveryNotes Table**:
- `id`: UUID único
- `quoteId`: Referencia al presupuesto
- `workerId`: Referencia al trabajador que generó el albarán
- `status`: "pending", "signed", "delivered"
- `signature`: Datos de firma en base64 (canvas)
- `signedAt`: Timestamp de firma
- `notes`: Notas del servicio
- `createdAt`: Timestamp de creación

### Frontend Architecture (V2.5 - Actualizado)

**Sistema de Tres Roles**:
- `/` (cliente) → LandingPage / QuoteCalculator
- `/admin/*` (administrador) → Dashboard / Pricing / Vehicles + Asignación de Trabajadores
- `/worker/*` (trabajador) → WorkerDashboard / Pedidos / Albaranes

**Nuevos Componentes**:
- **WorkerDashboard**: Muestra solo pedidos asignados al trabajador actual
- **WorkerAssignmentModal**: Modal para que admin asigne pedidos a trabajadores
- **DeliveryNoteGenerator**: Generador de albaranes con captura de firma canvas
- **WorkerRouter**: Enrutador protegido para trabajadores

**Flujo de Trabajador**:
1. Trabajador inicia sesión (roles: worker con workerId)
2. Ve solo sus pedidos asignados en WorkerDashboard
3. Para cada pedido, puede generar un albarán digital
4. Captura firma del cliente en canvas
5. Envía albarán firmado al backend que lo almacena

**Flujo de Admin para Asignar Trabajador**:
1. Admin ve solicitud pendiente/confirmada
2. Hace clic en "Asignar Trabajador"
3. Modal muestra lista de José, Luis, Miguel
4. Admin selecciona trabajador
5. Sistema envía `PATCH /api/quotes/{id}/assign-worker` con workerId
6. Pedido aparece en dashboard del trabajador seleccionado

### Backend Architecture (V2.5 - Actualizado)

**Nuevos Endpoints**:
- `GET /api/workers` - Lista todos los trabajadores activos
- `PATCH /api/quotes/:id/assign-worker` - Asigna trabajador a un presupuesto
- `GET /api/workers/:workerId/orders` - Pedidos asignados a un trabajador
- `POST /api/delivery-notes` - Crear albarán digital
- `GET /api/delivery-notes/:id` - Obtener albarán específico
- `PATCH /api/delivery-notes/:id` - Actualizar albarán (añadir firma)
- `GET /api/workers/:workerId/delivery-notes` - Albaranes de un trabajador

**Almacenamiento Actualizado**:
- Interfaz `IStorage` ahora incluye métodos para workers y delivery notes
- Métodos: `getWorkers()`, `getWorker()`, `createWorker()`, `updateWorker()`
- Métodos: `getDeliveryNotes()`, `createDeliveryNote()`, `updateDeliveryNote()`
- Método: `assignQuoteToWorker()` para asignar pedidos

### Autenticación (V2.5)

**Sistema de Tres Roles en Frontend**:
- AuthContext ampliado para soportar roles "customer", "admin", "worker"
- Campo `workerId` en User para identificar al trabajador
- Router condicional según role del usuario en App.tsx

**Trabajadores Predefinidos**:
- José: worker-jose
- Luis: worker-luis
- Miguel: worker-miguel

## Cambios Recientes (V2.5 - Sistema de Tres Roles)

### 2025-12-01 Sistema de Trabajadores y Albaranes

**Agregado**:
- Tabla `workers` en base de datos con tres trabajadores predefinidos
- Tabla `delivery_notes` para almacenar albaranes digitales con firmas
- Campo `assignedWorkerId` en tabla `quotes` para asignaciones
- Nuevos endpoints en backend para gestión de trabajadores y albaranes
- Modal `WorkerAssignmentModal` para que admin asigne pedidos
- Componente `DeliveryNoteGenerator` con captura de firma canvas
- Página `WorkerDashboard` para visualizar solo pedidos asignados
- Botón "Asignar Trabajador" en dashboard de admin (color morado)
- Método `assignQuoteToWorker` en IStorage para asignar pedidos

**Frontend**:
- App.tsx ahora soporta routing para tres roles diferentes
- AuthContext.tsx actualizado con tipos de rol expandidos
- WorkerDashboard.tsx: Panel para trabajadores con pedidos asignados
- WorkerAssignmentModal.tsx: Modal de selección de trabajador
- DeliveryNoteGenerator.tsx: Generador de albaranes con firma digital
- DashboardPage.tsx: Nuevo botón "Asignar Trabajador" (morado) en cada pedido

**Backend**:
- shared/schema.ts: Nuevas tablas Worker, DeliveryNote
- server/storage.ts: Métodos para CRUD de trabajadores y albaranes
- server/routes.ts: Nuevos endpoints para API de trabajadores
- Método IStorage.assignQuoteToWorker() para asignación de pedidos

**Características de Albarán**:
- Canvas para firma del cliente (firma manual)
- Campo de notas del servicio
- Almacenamiento de firma en base64
- Timestamp de firma automático
- Estado: pending → signed → delivered

**Aislamiento de Datos por Trabajador**:
- Cada trabajador solo ve sus pedidos asignados
- Sistema rechaza acceso a pedidos de otros trabajadores
- Los tres trabajadores nunca ven pedidos entre ellos
- Solo admin puede ver todos los pedidos y realizar asignaciones

## Características Plaqueadas

- [ ] Notificaciones en tiempo real para trabajadores (WebSocket)
- [ ] Auto-envío de albaranes firmados a dashboard admin
- [ ] Historial de albaranes por trabajador
- [ ] Integración con email para enviar albaranes PDF

## Limitaciones Actuales

- Sistema de notificaciones requiere implementación (WebSockets)
- Albaranes se almacenan pero no se envían automáticamente
- No hay descarga de PDF de albaranes
- Interface de usuario simple (sin UI enriquecida para firma)

## Notas Técnicas

- Firma se captura en canvas HTML5 y se convierte a base64
- Trabajadores se pre-cargan en almacenamiento (no requieren creación manual)
- Sistema de asignación es atómico: un pedido solo puede tener un trabajador
- Cambiar trabajador asignado sobrescribe la asignación anterior
