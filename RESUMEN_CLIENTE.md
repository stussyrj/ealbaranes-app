# eAlbarán - Documentación Completa de Funcionalidades

## Plataforma de Gestión Digital de Albaranes de Transporte

---

# ÍNDICE

1. [Descripción General](#descripción-general)
2. [Portal de Empresa (Administrador)](#portal-de-empresa-administrador)
3. [Portal de Trabajador](#portal-de-trabajador)
4. [Sistema de Facturación](#sistema-de-facturación)
5. [Sistema de Firmas Digitales](#sistema-de-firmas-digitales)
6. [Tracking de Tiempos](#tracking-de-tiempos)
7. [Seguridad y Autenticación](#seguridad-y-autenticación)
8. [Configuración y Personalización](#configuración-y-personalización)
9. [Exportación de Datos](#exportación-de-datos)
10. [Arquitectura Multi-Tenant](#arquitectura-multi-tenant)

---

# Descripción General

**eAlbarán** es una plataforma B2B SaaS diseñada específicamente para empresas de logística, transporte y servicios que necesitan gestionar albaranes de entrega de forma digital. La aplicación elimina completamente el papel, automatiza la captura de evidencias (fotos y firmas), y genera facturas profesionales directamente desde los albaranes completados.

## Modelo de Usuarios

La plataforma distingue dos tipos de usuarios con portales completamente diferenciados:

| Tipo de Usuario | Acceso | Capacidades |
|-----------------|--------|-------------|
| **Empresa (Admin)** | Panel completo de gestión | Supervisar TODOS los albaranes, gestionar trabajadores, generar facturas, configurar empresa |
| **Trabajador** | Panel de operaciones | Crear albaranes, capturar fotos/firmas, registrar tiempos, ver sus propios albaranes |

---

# Portal de Empresa (Administrador)

El portal de empresa proporciona control total sobre la operativa de albaranes de la organización.

## 1. Dashboard Principal

### 1.1 Sistema de Contadores en Tiempo Real

El dashboard muestra **tres contadores principales** mediante tarjetas visuales (StatCards):

| Contador | Descripción | Función |
|----------|-------------|---------|
| **Hoy** | Albaranes creados en el día actual | Click para filtrar solo albaranes de hoy |
| **Este Mes** | Albaranes del mes en curso | Click para filtrar solo albaranes del mes |
| **Total** | Suma histórica de todos los albaranes | Click para ver todos los albaranes |

**Características de los contadores:**
- Actualización automática en tiempo real
- Diferenciación visual por colores
- Funcionan como filtros rápidos al hacer click
- Muestran tendencias (incremento/decremento)

### 1.2 Sistema de Categorías y Filtros

Los albaranes se organizan en **tabs de categorías**:

| Categoría | Descripción | Indicadores Visuales |
|-----------|-------------|----------------------|
| **Pendientes** | Albaranes sin foto O sin firma completa | Badge naranja "Pendiente" |
| **Firmados** | Albaranes con foto Y firma dual completa | Badge verde "Completo" |
| **Papelera** | Albaranes eliminados (recuperables) | Badge rojo "Eliminado" |

**Filtros adicionales disponibles:**
- Filtro por rango de fechas personalizado (calendario)
- Filtro por trabajador específico
- Filtro por cliente
- Filtro por estado de facturación (Facturado / Sin facturar)
- Búsqueda en tiempo real por texto

### 1.3 Sistema de Alertas Automáticas

El dashboard genera alertas visuales para:

- **Albaranes pendientes de firma**: Albaranes que llevan más de X días sin completar
- **Entregas bloqueadas**: Albaranes con problemas de validación
- **Tiempos de espera excesivos**: Cuando el trabajador excede el umbral configurado

### 1.4 Visualización de Albaranes

Cada albarán se muestra en una **tarjeta (DeliveryNoteCard)** con:

| Elemento | Información Mostrada |
|----------|---------------------|
| **Número de albarán** | Numeración automática única (#1, #2, #3...) |
| **Cliente** | Nombre del cliente de la entrega |
| **Fecha y hora** | Timestamp de creación |
| **Trabajador** | Nombre del trabajador que lo creó |
| **Origen(es)** | Punto(s) de recogida con nombre y dirección |
| **Destino** | Punto de entrega con nombre y dirección |
| **Estado de foto** | Badge indicando si tiene foto o no |
| **Estado de firma** | Badge indicando firma origen + destino |
| **Observaciones** | Notas adicionales del trabajador |
| **Tiempo de espera** | Duración calculada (si aplica) |

### 1.5 Modal de Detalle de Albarán

Al hacer click en un albarán, se abre un modal completo con:

- **Foto de entrega** en alta resolución (zoom disponible)
- **Firma de origen** capturada digitalmente
- **Firma de destino** capturada digitalmente  
- **Documento DNI** del receptor (si fue ingresado)
- **Timestamps detallados**: Hora creación, llegada, salida
- **Geolocalización** del punto de entrega (si está disponible)
- **Historial de cambios** del albarán
- **Botones de acción**: Editar, Eliminar, Descargar PDF

---

## 2. Gestión de Trabajadores

La sección de **Gestión de Usuarios** permite control total sobre los trabajadores de la empresa.

### 2.1 Lista de Trabajadores

Vista en tabla/grid mostrando:

| Columna | Información |
|---------|-------------|
| **Nombre** | Nombre completo del trabajador |
| **Usuario** | Username para login |
| **Email** | Email de contacto |
| **Rol** | Badge visual (Empresa / Trabajador) |
| **Estado** | Activo / Inactivo |
| **Fecha de creación** | Cuándo fue creado el perfil |
| **Albaranes** | Cantidad de albaranes creados |

### 2.2 Crear Nuevo Trabajador

Formulario con los siguientes campos:

| Campo | Tipo | Validación |
|-------|------|------------|
| **Nombre completo** | Texto | Obligatorio, mín. 2 caracteres |
| **Nombre de usuario** | Texto | Obligatorio, único, sin espacios |
| **Email** | Email | Formato válido, único en el sistema |
| **Contraseña** | Password | Mín. 6 caracteres |
| **Confirmar contraseña** | Password | Debe coincidir |

**Al crear un trabajador:**
- Se asigna automáticamente al tenant (empresa) del admin
- El trabajador puede iniciar sesión inmediatamente
- No requiere verificación de email (ya está validado por el admin)

### 2.3 Acciones sobre Trabajadores

| Acción | Descripción | Confirmación |
|--------|-------------|--------------|
| **Cambiar contraseña** | Resetear contraseña del trabajador | Modal con nueva contraseña |
| **Editar perfil** | Modificar nombre, email | Validaciones en tiempo real |
| **Desactivar** | Bloquear acceso sin eliminar datos | Confirmación requerida |
| **Eliminar** | Eliminar cuenta permanentemente | Doble confirmación |

### 2.4 Control de Albaranes por Trabajador

Desde el perfil de cada trabajador se puede:

- Ver **todos los albaranes** creados por ese trabajador
- Filtrar sus albaranes por fecha/estado
- Exportar sus albaranes a CSV/PDF
- Ver estadísticas individuales (albaranes/mes, tiempos promedio)

---

## 3. Sistema de Papelera

### 3.1 Soft Delete (Borrado Suave)

Cuando se elimina un albarán:
- NO se borra de la base de datos
- Se mueve a la categoría "Papelera"
- Se registra quién lo eliminó y cuándo
- Permanece recuperable indefinidamente

### 3.2 Acciones en Papelera

| Acción | Descripción |
|--------|-------------|
| **Restaurar** | Devuelve el albarán a la lista principal |
| **Eliminar permanentemente** | Borrado definitivo (hard delete) |

**Nota**: Solo los usuarios Empresa (admin) pueden acceder a la papelera y realizar estas acciones.

---

# Portal de Trabajador

El portal del trabajador está optimizado para uso en campo, desde dispositivos móviles.

## 1. Dashboard del Trabajador

### 1.1 Vista de Albaranes Propios

El trabajador solo ve sus propios albaranes, organizados en:

| Tab | Contenido |
|-----|-----------|
| **Pendientes** | Albaranes sin completar (falta foto o firma) |
| **Firmados** | Albaranes completados correctamente |
| **Archivados** | Albaranes antiguos o marcados como archivados |

### 1.2 Contadores Personales

- Albaranes creados **hoy**
- Albaranes creados **este mes**
- Albaranes **totales** del trabajador

### 1.3 Búsqueda y Filtros

- **Búsqueda en tiempo real** por cliente, origen, destino
- **Filtro por fecha** con calendario
- **Timeline visual** de albaranes recientes

---

## 2. Creación de Albaranes

### 2.1 Formulario de Nuevo Albarán

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **Cliente** | Texto con autocompletado | Nombre del cliente. Sugiere clientes anteriores |
| **Origen(es) de recogida** | Múltiples inputs JSONB | Permite agregar múltiples puntos de recogida |
| **Nombre del origen** | Texto | Nombre o referencia del punto |
| **Dirección del origen** | Texto | Dirección completa |
| **Destino** | Texto con autocompletado | Punto de entrega final |
| **Nombre del destino** | Texto | Nombre o referencia |
| **Dirección del destino** | Texto | Dirección completa |
| **Vehículo** | Selector | Selección del vehículo utilizado |
| **Detalles de carga** | Texto | Descripción de la mercancía transportada |
| **Observaciones** | Texto largo | Notas adicionales sobre la entrega |

### 2.2 Sistema de Autocompletado Inteligente

El formulario implementa **autocompletado** basado en:

- **Clientes anteriores**: Al escribir, sugiere clientes de albaranes previos
- **Orígenes frecuentes**: Sugiere ubicaciones de recogida habituales
- **Destinos frecuentes**: Sugiere destinos usados anteriormente
- **Caché local**: Almacena sugerencias para uso offline

### 2.3 Múltiples Orígenes de Recogida

El sistema permite agregar **múltiples puntos de origen** en un solo albarán:

```
Origen 1: Almacén Central (Calle Mayor 123, Madrid)
Origen 2: Proveedor ABC (Av. Industrial 45, Getafe)
Origen 3: Fábrica XYZ (Pol. Ind. Norte 12, Alcobendas)
```

**Visualización**: Se muestra como "Almacén Central (+2)" indicando 2 orígenes adicionales.

### 2.4 Prevención de Duplicados

El sistema previene la creación accidental de albaranes duplicados:
- Deshabilita el botón de envío mientras se procesa
- Muestra indicador de carga durante la creación
- Valida que no existan albaranes idénticos recientes

### 2.5 Numeración Automática

Cada albarán recibe un número único secuencial:
- Formato: **Albarán #1**, **Albarán #2**, etc.
- La numeración es **por empresa (tenant)**, no global
- No se repiten números incluso si se eliminan albaranes

---

## 3. Captura de Fotos

### 3.1 Opciones de Captura

| Método | Descripción |
|--------|-------------|
| **Cámara** | Abre la cámara del dispositivo para foto instantánea |
| **Galería** | Permite seleccionar una foto existente del dispositivo |

### 3.2 Procesamiento de Imágenes

Las fotos capturadas pasan por:

- **Compresión automática**: Reduce el tamaño para optimizar almacenamiento
- **Conversión de formato**: Estandariza a formatos compatibles
- **Validación de calidad**: Verifica que la imagen sea legible
- **Almacenamiento seguro**: Se guarda en base de datos con encriptación

### 3.3 Visualización

- **Preview** antes de guardar
- **Zoom** para verificar detalles
- **Opción de reemplazar** si la foto no es satisfactoria

---

# Sistema de Firmas Digitales

## 1. Firma Dual (Origen y Destino)

eAlbarán implementa un sistema de **doble firma** para máxima validez legal:

| Firma | Momento | Propósito |
|-------|---------|-----------|
| **Firma de Origen** | Al recoger la mercancía | Confirma que se recibió la carga |
| **Firma de Destino** | Al entregar la mercancía | Confirma que se entregó correctamente |

**Un albarán solo se considera "Completado" cuando tiene AMBAS firmas.**

## 2. Modal de Captura de Firma

### 2.1 Interfaz de Firma

El modal de firma ofrece:

- **Canvas a pantalla completa** para máxima comodidad de firma
- **Soporte táctil completo** optimizado para móviles
- **Soporte de mouse** para uso en desktop
- **Botón "Limpiar"** para reiniciar la firma
- **Botón "Confirmar"** para guardar la firma

### 2.2 Tabs de Firma

El modal organiza las firmas en tabs:

| Tab | Contenido |
|-----|-----------|
| **Origen** | Captura de firma del punto de recogida |
| **Destino** | Captura de firma del punto de entrega |

### 2.3 Campos Adicionales de Destino

En el tab de destino, además de la firma se captura:

| Campo | Descripción |
|-------|-------------|
| **Documento DNI** | Número de identificación del receptor |
| **Foto de destino** | Foto adicional del punto de entrega |
| **Nombre del receptor** | Nombre de quien firma |

## 3. Dirty-State Tracking

El sistema implementa **seguimiento de cambios** para prevenir pérdida de datos:

- Detecta si hay cambios sin guardar
- Muestra confirmación al intentar cerrar el modal
- Auto-guarda la firma de origen al cambiar de tab
- Previene cierre accidental con datos pendientes

## 4. Persistencia Inmediata

Las firmas se guardan inmediatamente al confirmar:
- No se pierden si la app se cierra
- Se sincronizan automáticamente con el servidor
- Mantienen calidad vectorial para validez legal

---

# Tracking de Tiempos

## 1. Botones de Control de Tiempo

El trabajador dispone de dos botones en cada albarán:

| Botón | Acción | Registro |
|-------|--------|----------|
| **"He llegado"** | Marca la hora de llegada al destino | Guarda timestamp exacto en `arrivedAt` |
| **"He salido"** | Marca la hora de salida del destino | Guarda timestamp exacto en `departedAt` |

## 2. Cálculo Automático de Duración

Cuando se registran ambos timestamps:

```
Duración = departedAt - arrivedAt
```

**Ejemplo:**
- He llegado: 10:15
- He salido: 10:47
- **Duración: 32 minutos**

## 3. Umbral de Tiempo de Espera

La empresa puede configurar un **umbral mínimo** para considerar tiempo de espera facturable:

| Configuración | Valor |
|---------------|-------|
| Umbral por defecto | 20 minutos |
| Rango configurable | 1 - 240 minutos |

**Comportamiento:**
- Si duración < umbral → No se considera tiempo de espera
- Si duración >= umbral → Se registra como tiempo de espera facturable
- Se añade automáticamente a las observaciones del albarán

## 4. Warnings Visuales

Cuando el tiempo de espera excede el umbral:
- Se muestra un **warning visual** al trabajador
- Se notifica en el dashboard de la empresa
- Se pre-carga automáticamente al crear facturas

## 5. Bloqueo de Notas Firmadas

Una vez que un albarán tiene ambas firmas:
- Los botones de tiempo se deshabilitan
- No se pueden modificar los timestamps
- El albarán queda "cerrado" para edición de tiempos

---

# Sistema de Facturación

## 1. Acceso a Facturación

La sección de facturación está disponible solo para usuarios **Empresa (admin)** en la ruta `/admin/invoices`.

## 2. Vista de Facturas

### 2.1 Lista de Facturas

La vista principal muestra todas las facturas con:

| Columna | Información |
|---------|-------------|
| **Número** | Numeración secuencial (FAC-001, FAC-002...) |
| **Fecha** | Fecha de emisión |
| **Cliente** | Nombre del cliente facturado |
| **Importe** | Total con IVA incluido |
| **Estado** | Pendiente / Pagada / Cancelada |
| **Acciones** | Ver, Descargar PDF, Cambiar estado |

### 2.2 Estados de Factura

| Estado | Color | Significado |
|--------|-------|-------------|
| **Pendiente** | Amarillo | Factura emitida, pendiente de pago |
| **Pagada** | Verde | Factura cobrada correctamente |
| **Cancelada** | Rojo | Factura anulada |

### 2.3 Filtros de Facturas

- Por estado (Pendiente/Pagada/Cancelada)
- Por rango de fechas
- Por cliente
- Búsqueda por número de factura

---

## 3. Wizard de Creación de Facturas (3 Pasos)

### Paso 1: Selección de Albaranes

En este paso se seleccionan los albaranes a incluir en la factura:

| Elemento | Descripción |
|----------|-------------|
| **Lista de albaranes disponibles** | Solo muestra albaranes "Firmados" y no facturados |
| **Checkboxes de selección** | Permite seleccionar múltiples albaranes |
| **Información visible** | Número, cliente, fecha, destino de cada albarán |
| **Filtro por cliente** | Para agrupar albaranes del mismo cliente |
| **Resumen de selección** | Contador de albaranes seleccionados |

**Validaciones:**
- Debe seleccionar al menos 1 albarán
- Los albaranes deben estar completados (foto + firma)
- Los albaranes no deben estar facturados previamente

### Paso 2: Precificación

En este paso se definen los precios y conceptos de la factura:

#### 2.1 Líneas Automáticas por Albarán

Por cada albarán seleccionado se genera una línea con:

| Campo | Descripción |
|-------|-------------|
| **Descripción** | Generada automáticamente: "Albarán #X - Cliente - Origen → Destino" |
| **Cantidad** | 1 por defecto |
| **Precio unitario** | Campo editable para ingresar el precio |
| **Total** | Calculado automáticamente |

#### 2.2 Tiempo de Espera Automático

Si un albarán tiene tiempo de espera registrado (tracking de llegada/salida):

- Se muestra automáticamente con el tiempo exacto en minutos
- **Formato**: "Tiempo de espera: 62 minutos"
- El tiempo viene del albarán, **no es editable**
- El usuario solo especifica el **precio** del tiempo de espera
- Se añade como línea adicional en la factura

**Ejemplo de línea de tiempo de espera:**
```
Descripción: Albarán #5 - Tiempo de espera: 45 min
Cantidad: 1
Precio: €25.00
Total: €25.00
```

#### 2.3 Tiempo de Espera Manual

También se puede añadir tiempo de espera **manualmente** mediante un botón:

| Campo | Descripción |
|-------|-------------|
| **Botón "Tiempo de Espera"** | Icono de reloj, abre formulario |
| **Minutos** | Campo numérico para ingresar minutos exactos |
| **Precio** | Campo para especificar el precio del tiempo |

Esto permite facturar tiempos de espera incluso si no se usó el tracking automático.

#### 2.4 Líneas Manuales Adicionales

Además de las líneas de albaranes, se pueden agregar:

| Tipo | Uso |
|------|-----|
| **Servicio adicional** | Ej: "Servicio de descarga - €50" |
| **Material** | Ej: "Embalaje especial - €15" |
| **Recargo** | Ej: "Entrega urgente - €30" |
| **Descuento** | Ej: "Descuento comercial - -€20" |

#### 2.5 Configuración de IVA

| Campo | Opciones |
|-------|----------|
| **Tipo de IVA** | 21% (general), 10% (reducido), 4% (superreducido), 0% (exento) |
| **Cálculo** | Automático sobre la base imponible |
| **Visualización** | Base + IVA + Total claramente desglosados |

#### 2.6 Términos de Pago

Selector de condiciones de pago:
- Contado
- 15 días
- 30 días
- 45 días
- 60 días
- Personalizado

### Paso 3: Revisión y Confirmación

Vista previa completa de la factura antes de generarla:

| Sección | Contenido |
|---------|-----------|
| **Cabecera** | Logo empresa, datos fiscales, número de factura |
| **Cliente** | Nombre, dirección, CIF/NIF |
| **Líneas de detalle** | Todas las líneas con descripción, cantidad, precio, total |
| **Resumen** | Base imponible, IVA, Total |
| **Condiciones** | Términos de pago, fecha de vencimiento |
| **Pie** | Información adicional de la empresa |

**Botones de acción:**
- **Volver**: Regresar al paso anterior para modificar
- **Crear Factura**: Genera la factura definitivamente

---

## 4. Editor de Plantilla de Factura

La empresa puede personalizar su plantilla de factura con:

| Campo | Descripción |
|-------|-------------|
| **Logo de empresa** | Subir imagen del logo (aparece en cabecera) |
| **Nombre de empresa** | Razón social |
| **CIF/NIF** | Identificación fiscal |
| **Dirección** | Dirección completa de la empresa |
| **Teléfono** | Número de contacto |
| **Email** | Email de contacto |
| **Términos y condiciones** | Texto legal/comercial (pie de factura) |
| **Cuenta bancaria** | IBAN para pagos |
| **Número de factura inicial** | Para continuar numeración existente |

Esta plantilla se guarda **por empresa (tenant)** y se aplica a todas las facturas.

---

## 5. Descarga de Facturas PDF

Las facturas generadas pueden descargarse en formato PDF con:

- **Diseño profesional** con branding de la empresa
- **Logo en cabecera**
- **Desglose completo** de líneas y totales
- **IVA calculado** correctamente
- **Evidencia de firma** de los albaranes incluidos
- **Términos de pago** y fecha de vencimiento
- **Listo para enviar** al cliente

---

# Seguridad y Autenticación

## 1. Sistema de Login

### 1.1 Login para Empresas

| Campo | Descripción |
|-------|-------------|
| **Usuario o Email** | Acepta nombre de usuario O email |
| **Contraseña** | Contraseña de la cuenta |

**Características:**
- Requiere verificación de email previa
- Bloquea acceso si email no verificado
- Muestra mensaje claro del motivo del bloqueo

### 1.2 Login para Trabajadores

| Campo | Descripción |
|-------|-------------|
| **Usuario** | Nombre de usuario del trabajador |
| **Contraseña** | Contraseña asignada por su empresa |

**Características:**
- No requiere verificación de email (ya validado por admin)
- Acceso inmediato tras creación de cuenta
- Redirige al panel de trabajador automáticamente

### 1.3 Login con Google OAuth

Opción de acceso mediante cuenta de Google:

- **Un click** para iniciar sesión
- **Auto-creación de cuenta** si es nuevo usuario
- **Flujo de setup obligatorio** para nuevos usuarios OAuth:
  1. Seleccionar tipo de cuenta (Empresa/Trabajador)
  2. Completar datos del perfil
  3. Establecer contraseña de respaldo

## 2. Sistema de Tokens

### 2.1 Autenticación Híbrida

eAlbarán usa un sistema **híbrido de sesión + JWT**:

| Método | Uso |
|--------|-----|
| **Sesiones** | Para navegación web normal |
| **JWT Tokens** | Para integración con APIs, apps móviles |

### 2.2 Tokens de Verificación

| Tipo de Token | Propósito | Expiración |
|---------------|-----------|------------|
| **Email Verification** | Verificar email de registro | 24 horas |
| **Password Reset** | Restablecer contraseña olvidada | 1 hora |

## 3. Rate Limiting

Protección contra ataques de fuerza bruta:

| Endpoint | Límite |
|----------|--------|
| **/api/login** | 5 intentos / 15 minutos |
| **/api/forgot-password** | 3 solicitudes / hora |
| **/api/resend-verification** | 3 solicitudes / hora |

**Comportamiento al exceder límite:**
- Bloqueo temporal del endpoint
- Mensaje de error claro al usuario
- Registro en log de auditoría

## 4. Encriptación

| Elemento | Método |
|----------|--------|
| **Contraseñas** | bcrypt con salt automático |
| **Tokens** | Generación criptográficamente segura |
| **Comunicaciones** | HTTPS obligatorio |
| **Base de datos** | Conexión encriptada SSL |

## 5. Sistema de Auditoría

Todas las acciones importantes se registran en un **log de auditoría**:

| Campo | Información |
|-------|-------------|
| **Actor** | Usuario que realizó la acción |
| **Acción** | Tipo de operación (crear, editar, eliminar) |
| **Recurso** | Elemento afectado (albarán, usuario, factura) |
| **Timestamp** | Fecha y hora exacta |
| **IP** | Dirección IP del usuario |
| **Detalles** | Información adicional del cambio |

---

# Configuración y Personalización

## 1. Configuración de Empresa

Disponible en la ruta `/admin/settings`:

### 1.1 Umbral de Tiempo de Espera

| Configuración | Descripción |
|---------------|-------------|
| **Valor** | Entre 1 y 240 minutos |
| **Efecto** | Define cuándo el tiempo de permanencia se considera "tiempo de espera facturable" |
| **Uso** | Se aplica automáticamente al calcular tiempos en albaranes |

### 1.2 Datos de Perfil

- Cambio de contraseña del administrador
- Actualización de datos de contacto
- Modificación de email

## 2. Tema Visual

### 2.1 Modo Claro/Oscuro

Toggle disponible en la interfaz para cambiar entre:

| Modo | Descripción |
|------|-------------|
| **Claro** | Fondos blancos, texto oscuro |
| **Oscuro** | Fondos oscuros, texto claro |

**Características:**
- Preferencia guardada por usuario
- Se mantiene entre sesiones
- Fondos animados sincronizados con el tema

## 3. Onboarding / Tutorial

Cuando un usuario accede por primera vez:

### Tutorial para Empresas:
1. Bienvenida al panel de empresa
2. Cómo crear trabajadores
3. Cómo supervisar albaranes
4. Cómo generar facturas

### Tutorial para Trabajadores:
1. Bienvenida al panel de trabajador
2. Cómo crear un albarán
3. Cómo capturar fotos y firmas
4. Cómo registrar tiempos

---

# Exportación de Datos

## 1. Exportación de Albaranes

### 1.1 Formato PDF

Descarga individual de albaranes con:
- Todos los datos del albarán
- Foto de entrega incluida
- Firmas digitales visibles
- Formato profesional

### 1.2 Formato CSV

Exportación masiva para análisis:
- Selección de rango de fechas
- Filtro por estado
- Incluye todos los campos de datos
- Compatible con Excel/Google Sheets

## 2. Exportación de Facturas

### 2.1 PDF Individual

Cada factura puede descargarse en PDF profesional listo para enviar al cliente.

### 2.2 Listado de Facturas

Exportar lista de facturas con:
- Número, fecha, cliente, importe, estado
- Filtrable por estado y fechas
- Formato CSV para contabilidad

## 3. Modal de Descarga

Interfaz unificada para exportaciones con:
- **Selector de rango de fechas** con calendario
- **Selector de tipo de exportación** (PDF/CSV)
- **Preview** de datos a exportar
- **Progreso de descarga** visible

---

# Arquitectura Multi-Tenant

## 1. Aislamiento de Datos

Cada empresa (tenant) tiene sus datos **completamente aislados**:

| Dato | Aislamiento |
|------|-------------|
| **Usuarios** | Solo visibles dentro de su empresa |
| **Trabajadores** | Pertenecen exclusivamente a su empresa |
| **Albaranes** | Solo accesibles por usuarios de esa empresa |
| **Facturas** | Solo accesibles por admins de esa empresa |
| **Configuración** | Independiente por empresa |

## 2. Validación de Tenant

Cada petición al servidor verifica:

1. Usuario autenticado correctamente
2. Usuario pertenece al tenant correcto
3. Recurso solicitado pertenece al mismo tenant
4. Operación permitida para el rol del usuario

## 3. Beneficios del Multi-Tenant

| Beneficio | Descripción |
|-----------|-------------|
| **Privacidad** | Ninguna empresa ve datos de otra |
| **Seguridad** | Imposible acceder a recursos de otro tenant |
| **Escalabilidad** | Múltiples empresas en la misma plataforma |
| **Personalización** | Cada empresa configura su experiencia |

---

# Comunicación por Email

## 1. Emails Transaccionales

La plataforma envía emails automáticos para:

| Evento | Email Enviado |
|--------|---------------|
| **Registro** | Email de verificación con enlace |
| **Recuperación de contraseña** | Email con enlace de reset |
| **Cuenta creada (trabajador)** | Notificación de credenciales |

## 2. Proveedor de Email

Emails enviados mediante **Resend** con:
- Alta tasa de entrega
- Diseño visual consistente
- Tracking de apertura

---

# Requisitos Técnicos

## 1. Navegadores Compatibles

| Navegador | Versión Mínima |
|-----------|----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## 2. Dispositivos

| Tipo | Soporte |
|------|---------|
| **Desktop** | Completo |
| **Tablet** | Completo (optimizado) |
| **Móvil** | Completo (diseño responsive) |

## 3. Conexión

| Requisito | Especificación |
|-----------|----------------|
| **Internet** | Requerida para todas las operaciones |
| **HTTPS** | Obligatorio (conexión segura) |

---

# Resumen de Capacidades

| Categoría | Funcionalidades |
|-----------|----------------|
| **Dashboard** | Contadores (hoy/mes/total), filtros, alertas, categorías |
| **Albaranes** | Crear, editar, firmar, fotografiar, eliminar, restaurar |
| **Usuarios** | Crear trabajadores, cambiar contraseñas, eliminar, roles |
| **Firmas** | Dual (origen/destino), canvas táctil, DNI, persistencia |
| **Tiempos** | Llegada/salida, cálculo automático, umbral configurable |
| **Facturas** | Wizard 3 pasos, precificación, tiempos de espera, PDF |
| **Seguridad** | JWT, OAuth, verificación email, rate limiting, auditoría |
| **Exportación** | PDF individual, CSV masivo, rango de fechas |
| **Personalización** | Plantilla factura, tema claro/oscuro, onboarding |

---

**eAlbarán: La solución completa para digitalizar la gestión de albaranes de transporte.**
