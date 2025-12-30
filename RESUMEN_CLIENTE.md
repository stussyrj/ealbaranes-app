# eAlbarán - Plataforma Digital de Gestión de Albaranes de Transporte

## 📋 Descripción General

**eAlbarán** es una plataforma B2B SaaS que revoluciona la gestión de albaranes de transporte. Permite a las empresas de logística y transporte automatizar completamente el proceso de creación, firmado y facturación de albaranes digitales, mientras que sus trabajadores pueden crear albaranes desde cualquier dispositivo con fotos, firmas digitales y tracking automático de tiempos.

---

## 🎯 Características Principales

### Para Empresas (Administradores)

#### 1. **Dashboard Ejecutivo**
- Resumen visual de albaranes con contadores por período:
  - Albaranes creados hoy
  - Albaranes del mes actual
  - Total histórico de albaranes
- Filtrado rápido de albaranes por períodos

#### 2. **Gestión de Trabajadores**
- Crear nuevos trabajadores con usuario y contraseña
- Ver lista completa de todos los trabajadores registrados
- Cambiar contraseña de trabajadores
- Eliminar trabajadores del sistema

#### 3. **Supervisión de Albaranes**
- Ver albaranes de TODOS los trabajadores de su empresa
- Visualizar detalles completos: fotos, firmas, clientes, direcciones
- Descargar albaranes en PDF o CSV
- Filtrar por rango de fechas personalizado
- Ver papelera de albaranes eliminados

#### 4. **Sistema de Papelera**
- Albaranes borrados se guardan en papelera (no se pierden)
- Restaurar albaranes eliminados a la lista principal
- Eliminación permanente definitiva cuando sea necesario

#### 5. **Sistema de Facturación Avanzado**
- Crear facturas a partir de albaranes completados
- Configurar plantilla de factura personalizada (logo, datos empresa, condiciones de pago)
- Seleccionar múltiples albaranes para incluir en una factura
- Precificación flexible de artículos y servicios
- Registrar tiempo de espera como concepto facturable independiente
- Cálculo automático de IVA
- Descargar facturas en PDF listo para enviar
- Ver estado de facturas (pendiente de pago / pagado / cancelado)

#### 6. **Configuración de Empresa**
- Ajustar umbral de tiempo de espera (1-240 minutos) para cálculos automáticos
- Cambiar contraseña propia
- Perfil de empresa y datos de contacto

---

### Para Trabajadores

#### 1. **Creación de Albaranes**
Los trabajadores pueden crear albaranes digitales con:
- **Datos del cliente**: Nombre del cliente con autocompletado
- **Origen de recogida**: Localización con nombre y dirección
- **Destino de entrega**: Localización con nombre y dirección
- **Observaciones**: Notas adicionales sobre la entrega
- **Fotos**: Capturar fotos de la entrega con cámara o galería
- **Firmas digitales**: Capturar firma del cliente (origen) Y firma de destino
- **Numeración automática**: Cada albarán recibe un número único (Albarán #1, #2, etc.)

#### 2. **Tracking Automático de Tiempos**
- Botón "He llegado": Registra hora exacta de llegada
- Botón "He salido": Registra hora exacta de salida
- **Cálculo automático de duración**: Si el tiempo de espera es mayor al umbral configurado (por defecto 20 minutos), se registra automáticamente
- Estos tiempos se usan luego para facturación

#### 3. **Validación Inteligente**
- Los albaranes solo se marcan como "completados" cuando tienen AMBOS:
  - Una foto de la entrega
  - Una firma digital del cliente
- El sistema previene albaranes incompletos

#### 4. **Panel Personal**
- Ver todos sus albaranes creados
- Filtrar albaranes por períodos (hoy, este mes, total)
- Consultar detalles de albaranes anteriores
- Ver estado de cada albarán

---

## 🔒 Seguridad y Privacidad

### Autenticación
- **Multi-método de login**: Usuario/contraseña o Google OAuth
- **Verificación de email**: Todos los usuarios deben verificar su email al registrarse
- **Recuperación de contraseña**: Sistema seguro con tokens que expiran en 1 hora
- **JWT Tokens**: Autenticación con tokens seguros para integración API
- **Rate limiting**: Protección contra intentos de acceso brutos (3 intentos máximo)

### Aislamiento de Datos
- **Sistema Multi-Tenant**: Cada empresa tiene acceso ÚNICAMENTE a sus datos
- Los albaranes de una empresa nunca se mezclan con otras empresas
- Los trabajadores solo ven sus propios albaranes
- Validación en cada petición al servidor

### Auditoría
- Registro completo de acciones en log de auditoría
- Seguimiento de quién creó, modificó o eliminó cada albarán
- Información de IP y dispositivo en auditoría

---

## 📱 Acceso Multi-Dispositivo

✅ **Funciona completamente en**:
- Computadoras de escritorio
- Tablets
- Teléfonos móviles
- Navegadores modernos (Chrome, Safari, Firefox, Edge)

La aplicación se adapta automáticamente al tamaño de pantalla para una mejor experiencia.

---

## 🔄 Flujo de Uso Típico

### Semana 1: Configuración Inicial
1. La empresa se registra en eAlbarán
2. Verifica su email
3. Accede al panel de empresa
4. Crea usuarios para sus trabajadores

### Operación Diaria
1. **Trabajador**: Crea nuevo albarán con fotos y firma
2. **Trabajador**: Al llegar, pulsa "He llegado" y al terminar "He salido"
3. **Trabajador**: El albarán queda completado automáticamente
4. **Empresa**: Revisa albaranes en su dashboard
5. **Empresa**: Genera facturas a partir de albaranes completados
6. **Empresa**: Descarga PDF de factura para enviar al cliente

### Fin de Mes
1. La empresa revisa todos los albaranes del mes
2. Selecciona los albaranes para facturar
3. Configura precios y tiempos de espera
4. Genera facturas en PDF
5. Exporta listados en CSV si es necesario

---

## 💼 Casos de Uso

✅ **Empresas de Logística y Distribución**
- Automatizar entrega de mercancías
- Capturar evidencia (fotos + firma) de cada entrega
- Facturación automática

✅ **Servicios de Mensajería**
- Rastreo de tiempos de entrega
- Firmas digitales de clientes
- Documentación de entregas

✅ **Transporte de Valores**
- Registro de llegadas y salidas
- Tiempo de espera documentado
- Facturas con detalles de duración

✅ **Instaladores y Técnicos**
- Capturar fotos de trabajo realizado
- Firma del cliente como comprobante
- Facturación por tiempo de permanencia

---

## ✨ Funcionalidades Especiales

### Autocompletado Inteligente
- Busca automática de clientes anteriores
- Suggestions de orígenes y destinos frecuentes
- Ahorra tiempo en cada albarán

### Descarga de Datos
- Exportar listados en CSV para análisis
- Descargar PDFs de albaranes individuales
- Exportar PDFs de facturas

### Plantillas Personalizables
- Configurar datos de la empresa en facturas
- Personalizar términos y condiciones
- Logo de empresa en PDFs

### Gestión de Tiempos
- Umbral de tiempo de espera configurable (1-240 minutos)
- Cálculo automático vs. manual de tiempos
- Precificación flexible de tiempos de espera

### Tema Claro/Oscuro
- Toggle automático entre modo claro y oscuro
- Preferencia guardada por usuario
- Interfaz cómoda para cualquier hora del día

---

## 📊 Ventajas para el Negocio

| Aspecto | Beneficio |
|--------|-----------|
| **Tiempo** | Albaranes completados en minutos vs. horas con papel |
| **Costos** | Eliminación de papel, impresoras y almacenamiento |
| **Errores** | Validación automática previene datos incompletos |
| **Documentación** | Fotos y firmas digitales como evidencia legal |
| **Facturación** | Generación automática de facturas en PDF |
| **Auditoría** | Registro completo de todas las operaciones |
| **Acceso** | Disponible desde cualquier dispositivo, en cualquier lugar |
| **Seguridad** | Datos encriptados en servidor empresarial |

---

## 🚀 Disponibilidad

- **Acceso 24/7**: Plataforma disponible cualquier hora del día
- **Sincronización automática**: Los datos se guardan constantemente
- **Backup automático**: Base de datos PostgreSQL con backups regulares
- **Sin mantenimiento**: Los usuarios no necesitan hacer nada, todo funciona en background

---

## 📞 Soporte y Seguridad

✅ **Certificados y Validaciones**:
- Autenticación JWT segura
- Encriptación de contraseñas con bcrypt
- HTTPS en todas las conexiones
- Base de datos PostgreSQL empresarial
- Hosting en infraestructura profesional

---

## 📦 Tecnología Detrás

- **Frontend**: React + TypeScript (rápido, moderno, responsive)
- **Backend**: Express + Node.js (confiable, escalable)
- **Base de datos**: PostgreSQL (empresarial, seguro, confiable)
- **UI**: Componentes modernos con Tailwind CSS

---

## 🎓 Primer Uso: Onboarding Incluido

Cuando un usuario accede por primera vez:
- Tutorial paso a paso adaptado para empresa vs. trabajador
- Explicación de cómo crear el primer albarán
- Guía de cómo usar el dashboard
- No necesita capacitación externa

---

## 📌 Modelo de Precios

✅ **Acceso Gratuito** para:
- Número ilimitado de empresas
- Número ilimitado de trabajadores por empresa
- Número ilimitado de albaranes
- Sistema de facturación completo
- Todas las features incluidas

---

## ✅ Estado Actual

**eAlbarán está completamente operacional y listo para producción**:

- ✅ Sistema de usuarios con roles (empresa/trabajador)
- ✅ Creación de albaranes con fotos y firmas
- ✅ Tracking automático de tiempos
- ✅ Sistema de facturas completo
- ✅ Papelera con recuperación
- ✅ Autenticación segura JWT + OAuth Google
- ✅ Base de datos de producción
- ✅ Interfaz responsive para móvil/desktop
- ✅ Recuperación de contraseña
- ✅ Validación en todos los campos
- ✅ Exportación de datos (PDF, CSV)

---

## 🎯 Próximos Pasos

Para comenzar a usar eAlbarán:

1. **Registro**: Cree cuenta de empresa
2. **Verificación**: Confirme su email
3. **Configuración**: Cree usuarios para sus trabajadores
4. **Uso**: Sus trabajadores crean albaranes digitales
5. **Facturación**: Genere facturas desde el dashboard

---

**eAlbarán: Transformando la gestión de albaranes de papel a digital** 🚀
