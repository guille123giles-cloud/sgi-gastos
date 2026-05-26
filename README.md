# CDS Gastos Corporativos

## Descripción del Proyecto
CDS Gastos Corporativos es una aplicación de software multiplataforma diseñada con un enfoque prioritario en dispositivos móviles (Mobile-First), siendo completamente funcional también en computadoras de escritorio. El propósito principal del sistema es resolver la necesidad de registrar los gastos operativos diarios de la empresa de manera inmediata y descentralizada. Tanto el director como los socios comerciales pueden ingresar los movimientos financieros en tiempo real desde cualquier ubicación, asegurando la centralización de la información y eliminando los retrasos o pérdidas de datos comunes en los reportes tradicionales.

---

## Objetivos del Proyecto

### Objetivo General
* Desarrollar e implementar una aplicación ágil, intuitiva y segura para la carga, modificación, eliminación y visualización estructurada de los gastos de la empresa, optimizando la toma de decisiones financieras a nivel gerencial.

### Objetivos Específicos
* **Accesibilidad Celular:** Garantizar una interfaz móvil fluida basada en el wireframe inicial para facilitar la carga rápida de datos en pocos clics.
* **Centralización de Datos:** Conectar la aplicación a una base de datos única para que todos los socios visualicen la misma información en tiempo real.
* **Autonómia de Gestión (CRUD Completo):** Permitir a los usuarios autorizados corregir errores de tipeo o eliminar registros obsoletos directamente desde la app.
* **Optimización del Análisis:** Proveer herramientas de filtrado avanzado para categorizar y auditar los gastos de manera visual y ordenada.

---

## Características de la Aplicación (Alcance)

### Dentro del Alcance
* **Módulo de Registro de Gastos:** Pantalla de carga simplificada que incluye validaciones y los campos de Fecha (selección automatizada o manual), Usuario/Ingreso (identificación del socio), Categoría (Proveedores, Logística, Servicios, Viáticos, etc.), Descripción textual del motivo y Monto/Reales (adaptable a la divisa).
* **Módulo de Visualización Híbrida de BBDD:** Apartado exclusivo que adapta su diseño según el dispositivo, mostrando una Matriz Tabular clásica en escritorio y una "Vista de Tarjetas" (Card View) apiladas en móviles para evitar el scroll horizontal.
* **Módulo de Modificación y Eliminación Protegida:** Herramientas de edición directa mediante un Modal de Edición que hereda la lógica de listas desplegables del formulario principal para evitar errores de tipeo en la BBDD.
* **Sistema de Filtros Flotante:** Implementación de un Modal de Filtros superpuesto que permite segmentar la información por fechas, socios, categorías y montos sin ocupar espacio permanente en la interfaz.
* **Módulo de Exportación:** Funcionalidad para generar y descargar un archivo Excel (`.xls`) con los datos filtrados, manteniendo la estructura, estilos y colores corporativos.
* **Escalabilidad de BBDD:** Sistema de paginación por bloques ("Cargar más registros") que solicita los datos a la BBDD en lotes de 100 para optimizar el consumo de red y el rendimiento general.
* **Módulo de Autenticación y Control de Acceso (Login):** Pantalla de inicio de sesión obligatoria integrada con Supabase Auth que restringe el acceso global mediante credenciales individuales.

### Fuera del Alcance
* Conciliación automática con cuentas bancarias o tarjetas de crédito.
* Módulo de facturación electrónica o conexión con sistemas fiscales impositivos.
* Gestión de nóminas o sueldos de empleados (limitado estrictamente a gastos operativos de los socios).

---

## Requerimientos del Sistema

### Requerimientos Funcionales
1. El sistema debe validar la identidad del usuario en la pantalla de Login antes de permitir el acceso a los módulos de carga o visualización.
2. El formulario de carga debe validar que el campo "Monto" sea estrictamente numérico antes de guardarse en la BBDD.
3. La vista de la BBDD debe actualizarse automáticamente cada vez que un socio agregue o modifique un registro.
4. El sistema debe solicitar confirmaciones emergentes con el resumen de los datos antes de un alta definitiva o una eliminación permanente.
5. El sistema debe conectarse a la API de DolarAPI para realizar conversiones multi-moneda (ARS, USD, BRL) en tiempo real.
6. Al final de cada vista de datos, el sistema debe calcular e imprimir dinámicamente el total acumulado desglosado por divisas y su gran total convertido.

### Requerimientos No Funcionales
* **Seguridad (RLS):** Implementación de políticas de Seguridad a Nivel de Fila (Row Level Security) en Supabase, vinculadas al módulo de Login, imposibilitando cualquier lectura o escritura maliciosa externa.
* **Diseño UI (Excel Light Mode):** Interfaz basada en un esquema de colores limpio, profesional y familiar (fondos blancos, grises claros y detalles en verde corporativo).
* **Usabilidad:** Bloqueo explícito del scroll horizontal (`overflow-x-hidden`) en dispositivos móviles para garantizar una lectura vertical fluida.
* **Disponibilidad:** Alojamiento en la nube a través de Vercel y Supabase, garantizando acceso continuo 24/7.
* **Arquitectura:** Estructura de software modular basada en React y Next.js.

---

## Fases de Desarrollo

* **Fase 1: Diseño y Prototipado** (Completada)
* **Fase 2: Modelado de BBDD y Backend** (Completada)
* **Fase 3: Desarrollo del Frontend** (Completada)
* **Fase 4: Pruebas e Implementación** (Completada)
* **Fase 5: Módulo de Seguridad** (Completada)

---

## Créditos y Equipo
* **Líder de Proyecto:** Guillermo Giles
