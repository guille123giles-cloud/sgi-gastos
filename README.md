<div align="center">
  <img src="./public/logo.jpg" alt="Logo CDS Gastos" width="150" />

  <h1>CDS Gastos Corporativos</h1>
  
  <p>
    <i>Plataforma ágil, intuitiva y segura para la gestión, control y visualización estructurada de gastos operativos.</i>
  </p>

  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</div>

<br/>

> **Nota:** Este proyecto resuelve la necesidad de registrar los gastos operativos diarios de la empresa de manera inmediata y descentralizada, eliminando retrasos y pérdidas de datos de los reportes tradicionales.

## Descripción del Proyecto

**CDS Gastos Corporativos** es una aplicación multiplataforma desarrollada bajo la filosofía *Mobile-First*, garantizando una experiencia de usuario fluida en dispositivos móviles mientras se mantiene completamente funcional en entornos de escritorio. 

El sistema permite a los directores y socios comerciales autorizados cargar, auditar y gestionar movimientos financieros en tiempo real desde cualquier lugar, centralizando toda la información en una única BBDD segura.

## Características Principales

* **Autenticación y Seguridad:** Control de acceso estricto integrado con Supabase Auth. Los datos están protegidos mediante políticas RLS (*Row Level Security*), bloqueando lecturas/escrituras no autorizadas.
* **Gestión Autónoma (CRUD Completo):** Los usuarios pueden registrar nuevos gastos, editar errores de tipeo o eliminar registros obsoletos directamente desde la aplicación.
* **Conversión Multi-moneda:** Integración en tiempo real con DolarAPI para realizar conversiones dinámicas entre ARS, USD y BRL, calculando totales de forma automática.
* **Visualización Híbrida de BBDD:** La interfaz se adapta al dispositivo, mostrando una vista de "Tarjetas" (*Card View*) apiladas en móviles para evitar el scroll horizontal, y una "Matriz Tabular" clásica en monitores de escritorio.
* **Filtros Avanzados:** Sistema de filtrado mediante ventanas modales superpuestas para segmentar registros por fecha, socio, categoría y monto.
* **Exportación a Excel:** Funcionalidad para descargar reportes en formato `.xls` de los datos filtrados, manteniendo la estructura y los estilos corporativos.
* **Alto Rendimiento:** Implementación de paginación por lotes (100 registros por bloque) para optimizar el consumo de red y acelerar las consultas a la BBDD.

## Arquitectura y Tecnologías

El proyecto emplea una arquitectura modular basada en las siguientes tecnologías:

* **Frontend:** React / Next.js (App Router).
* **Lenguaje:** TypeScript para tipado estático y reducción de errores en tiempo de ejecución.
* **Estilos:** Tailwind CSS con un diseño "Excel Light Mode" (fondos blancos, grises claros y detalles en verde corporativo).
* **BBDD y Backend:** Supabase (PostgreSQL) para almacenamiento relacional y gestión de usuarios.
* **Despliegue:** Alojado en la nube de Vercel con alta disponibilidad (24/7).

## Instalación y Desarrollo Local

Para correr este proyecto en tu entorno local, seguí estos pasos:

1. Clonar el repositorio:

    git clone https://github.com/guille123giles-cloud/sgi-gastos.git

2. Instalar las dependencias:

    cd sgi-gastos
    npm install

3. Configurar las variables de entorno (`.env.local`) con tus credenciales de Supabase.

4. Iniciar el servidor de desarrollo:

    npm run dev

## Autor

**Guillermo German Giles**  
*Estudiante de Ingeniería en Sistemas & Desarrollador Backend*
