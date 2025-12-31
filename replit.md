# eAlbarán - Gestión Digital de Albaranes de Transporte

## Overview

eAlbarán is a B2B SaaS multi-tenant application designed for the **digital management of transport delivery notes**. It enables workers to create digital delivery notes complete with photos and signatures, while providing businesses with comprehensive access to manage and monitor these notes. The project's ambition is to streamline logistics operations through digital transformation, offering an efficient, paperless solution for transport documentation.

## User Preferences

- Idioma: Español
- Comunicación: Lenguaje simple y cotidiano
- Tema: Toggle oscuro/claro activo

## System Architecture

The application is built with a multi-tenant architecture, ensuring complete data isolation between companies.

### UI/UX Decisions
- **Frontend**: React + TypeScript with Vite.
- **UI Framework**: shadcn/ui with Tailwind CSS for a modern and responsive design.
- **Theming**: Supports both light and dark modes, including a "spooky" Halloween theme.
- **Signature Capture**: Utilizes a dedicated, full-screen SignatureModalDialog component for an enhanced touch and mouse signature experience.
- **Onboarding**: Features a welcome tutorial tailored for both company administrators and workers.
- **Dynamic UI**: Dashboard buttons for vehicle types dynamically adjust layout based on quantity (3, 4, or 5 columns).

### Technical Implementations
- **Backend**: Express + TypeScript.
- **Database**: PostgreSQL via Neon with Drizzle ORM.
- **Authentication**: JWT-based authentication system with email verification, password recovery, rate limiting, and Google OAuth 2.0 integration.
- **Data Handling**: JSONB format for complex data structures like `pickupOrigins`.
- **File Downloads**: Secure file downloads for invoices using JWT tokens in headers.
- **Error Handling**: Robust validation for registration and user management.
- **Data Backup**: Admins can generate and download comprehensive JSON backups of all tenant data, including delivery notes, invoices, templates, workers, vehicle types, and users (with redacted passwords). An audit log `backup_logs` tracks backup history.

### Feature Specifications
- **Digital Delivery Notes**: Workers create digital delivery notes with photo and signature capabilities. A delivery note is considered "signed" only when both a photo and a digital signature are present.
- **Multi-Tenant Management**: Companies register and manage their workers, viewing only their own delivery notes and configurations.
- **Vehicle Type Management**: Admins can create, edit, and delete vehicle types specific to their tenant. These types are then used by workers when creating delivery notes.
- **Invoice Management**: Comprehensive invoicing system including template management, a wizard for creation, PDF generation, and sequential numbering. Invoices can include "wait time" pricing, both manually entered and automatically calculated from tracked arrival/departure times.
- **Time Tracking**: Functionality to record `arrivedAt` and `departedAt` times for delivery notes, automatically calculating and noting durations over 20 minutes in observations.
- **User Management**: Admins can manage workers, including creation, password changes, and deletion.
- **Delivery Note Lifecycle**: Supports soft deletion (moving to trash), restoration, and permanent deletion of delivery notes by administrators.
- **Audit Logging**: `audit_logs` table in PostgreSQL tracks critical actions.
- **Data Suggestions**: Autocomplete suggestions for client, origin, and destination fields.

### System Design Choices
- **Multi-tenant Architecture**: Each company operates within an isolated environment.
- **Role-Based Access Control**: Differentiated access for "Empresa" (admin) and "Trabajador" roles.
- **Soft Deletion**: Delivery notes are soft-deleted into a "trash" bin before permanent removal, allowing for recovery.
- **Automated Processes**: Automatic generation of unique delivery note numbers and automatic calculation of wait times for invoicing.

## External Dependencies

- **Database**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM
- **Email Service**: Resend (for email verification, password recovery, etc.)
- **Authentication**: Google OAuth 2.0