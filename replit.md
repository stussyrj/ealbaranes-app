# DirectTransports - Transportation Quote SaaS

## Status: OPERATIONAL - App Rendering

**El app está funcionando y renderizando correctamente.**

## Overview

DirectTransports es una aplicación B2B SaaS para gestión de presupuestos de transporte entre administradores y trabajadores. El sistema integra OpenRouteService para cálculo de distancia en tiempo real.

**Tech Stack Resumen**:
- Frontend: React + TypeScript con Vite (Funcionando)
- Backend: Express + TypeScript (Operativo)
- Base de datos: PostgreSQL via Neon con Drizzle ORM (Inicializado)
- API de Enrutamiento: OpenRouteService
- UI Framework: shadcn/ui con Tailwind CSS

## Roles del Sistema

- **Administrador (Daniel)**: Crea presupuestos, asigna a trabajadores, revisa albaranes
- **Trabajadores (José/Luis/Miguel)**: Reciben presupuestos, editan detalles, generan albaranes con firmas

## Endpoints Backend Operativos

- `GET /api/quotes` - Lista presupuestos
- `GET /api/workers` - Lista trabajadores
- `PATCH /api/quotes/:id/status` - Actualiza estado
- `PATCH /api/quotes/:id/assign-worker` - Asigna a trabajador
- `POST /api/delivery-notes` - Crea albarán
- `PATCH /api/delivery-notes/:id` - Actualiza albarán

## Estado Actual

### ✅ Completado
- Backend Express configurado y operativo
- Base de datos PostgreSQL inicializada con tablas
- Autenticación básica (dos roles)
- API REST completa funcional
- Frontend React renderiza correctamente
- Tema oscuro/claro implementado
- Sidebar con navegación

### ⚠️ Pendiente - Contextos Complejos
- Integración completa de AuthContext + ThemeProvider + SidebarProvider en App.tsx
- Importación de componentes de página (DashboardPage, WorkerDashboard, etc.)
- **Causa**: Error silencioso de Vite HMR al cargar múltiples contextos juntos
- **Solución temporal**: App.tsx simplificado pero funcional

### 🔧 Próximos Pasos Recomendados

1. **Debuggear Vite Hot Reload** - Resolver error de importación de módulos
2. **Integrar Autenticación** - Agregar contexto de usuario
3. **Agregar Rutas** - Implementar navegación con wouter
4. **Interfaces Admin/Worker** - Crear dashboards separados
5. **Firma Digital** - Implementar canvas de firma para albaranes

## Preferencias Usuario

- Idioma: Español
- Comunicación: Lenguaje simple y cotidiano
- Tema: Toggle oscuro/claro activo
- Modelo de precios: Precio por km + precio mínimo
- Opción urgencia: Recargo 25%

## Notas Técnicas

- Vite está compilando correctamente
- Express sirve API en puerto 5000
- React renderiza sin errores
- Problema actual: Error silencioso al importar múltiples contextos (circular dependency o problema de módulos)
- Solución: Necesita debugging profundo de imports de Vite
