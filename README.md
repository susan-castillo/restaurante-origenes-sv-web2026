# ☕ Restaurante Orígenes SV — Sistema ERP y POS Multi-Sucursal

Sistema web desacoplado *Full-Stack* diseñado para la gestión operativa, financiera y de recursos humanos de una cadena de cafeterías/restaurantes de especialidad con múltiples sucursales en El Salvador.

---

## 📋 Tabla de Contenidos

1. [Arquitectura del Sistema](#-arquitectura-del-sistema)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Módulos Principales](#-módulos-principales)
4. [Estructura del Proyecto (Monorepo)](#-estructura-del-proyecto-monorepo)
5. [Requisitos Previos](#-requisitos-previos)
6. [Instalación y Configuración](#-instalación-y-configuración)
7. [Ejecución en Desarrollo y Producción](#-ejecución-en-desarrollo-y-producción)
8. [Seguridad Implementada](#-seguridad-implementada)
9. [Flujo de Trabajo en Git](#-flujo-de-trabajo-en-git)

---

## 🏗️ Arquitectura del Sistema

El proyecto implementa una arquitectura desacoplada de **tres capas** más base de datos relacional, comunicándose mediante peticiones HTTP/JSON *stateless*:

```text
┌─────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐      ┌───────────────┐
│   Frontend (SPA)    │      │     API Gateway      │      │   Backend REST API   │      │ Base de Datos │
│   React 19 + Vite   │─────▶│     PHP 8.3 CLI      │─────▶│  Node.js + Express 5 │─────▶│  PostgreSQL   │
│  127.0.0.1:5173     │ /api │   127.0.0.1:8085     │ HTTP │   127.0.0.1:3000     │Prisma│restaurante_sv │
└─────────────────────┘      └──────────────────────┘      └──────────────────────┘      └───────────────┘
```

* **Frontend (Vite + React):** Actúa como *Reverse Proxy* en desarrollo (`vite.config.js`), enmascarando las rutas internas mediante el prefijo `/api`.
* **API Gateway (PHP):** Punto único de entrada (`apps/gateway/index.php`). Valida métodos, reenvía la IP real del cliente (`X-Forwarded-For`, `X-Real-IP`) e inyecta el token interno (`X-Gateway-Token`) hacia Express.
* **Backend (Express + Prisma ORM):** Organizado bajo una **Arquitectura en Capas** (`Routes` ➔ `Middlewares` ➔ `Controllers` ➔ `Services` ➔ `Models`).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, React Router DOM 7, Bootstrap 5, Reactstrap, Sass (SCSS), Lucide Icons |
| **API Gateway** | PHP 8.3 (Built-in Server, Streams HTTP nativos) |
| **Backend** | Node.js (>= 22.12.0), Express 5, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `helmet`, `express-rate-limit` |
| **ORM & Base de Datos** | PostgreSQL, Prisma ORM (`@prisma/client` + `@prisma/adapter-pg`), `pg` |

---

## 🧩 Módulos Principales

1. **Autenticación y Multi-Sucursal (RBAC):**
   * Inicio de sesión con JWT, revalidación en tiempo real del estado activo del empleado y control de acceso por roles (`ADMIN`, `RRHH`, `EMPLEADO`) y sucursales (`sucursal_id`).
2. **Punto de Venta y Facturación (POS):**
   * Toma ágil de pedidos, cálculo automático del **13% de IVA**, generación de correlativos por sucursal para **Factura Consumidor Final** y **Comprobante de Crédito Fiscal (CCF)**.
3. **Inventario Complejo y Recetas:**
   * Catálogo global de insumos (`g`, `ml`, `unidad`) y stock independiente por sucursal (`inventario_sucursal`).
   * **Descuento automático por receta:** Al vender un platillo elaborado (ej. *Latte Grande*), el sistema deduce automáticamente los gramos/mililitros/unidades de cada ingrediente en una transacción atómica y genera alertas de stock mínimo.
4. **Compras y Proveedores:**
   * Registro de facturas de proveedores con validación de duplicados (`proveedor_id + numero_factura`), incremento automático de inventario local, cálculo exacto en centavos y manejo de zona horaria de El Salvador (`America/El_Salvador`, `UTC-6`).
5. **Caja y Arqueo Multi-Pago:**
   * Control de apertura y cierre de turno único por sucursal, con cuadre obligatorio de los tres métodos de pago: **Efectivo**, **Tarjeta** y **Bitcoin (Chivo Wallet)**.
6. **Recursos Humanos y Nómina SV:**
   * Gestión de empleados (baristas, cajeros, gerentes, RRHH) y cálculo de planilla quincenal aplicando las deducciones de ley vigentes en El Salvador: **ISSS (3%)**, **AFP (7.25%)** y **Tabla de Retención de Renta**.

---

## 📁 Estructura del Proyecto (Monorepo)

```text
restaurante-origenes-sv-web2026/
├── apps/
│   ├── backend/                  # API RESTful en Node.js + Express + Prisma
│   │   ├── prisma/
│   │   │   └── schema.prisma     # Esquema de las 13 tablas de PostgreSQL
│   │   ├── src/
│   │   │   ├── config/           # Configuración de BD y utilidades de entorno
│   │   │   ├── controllers/      # Manejo de peticiones HTTP y códigos de estado
│   │   │   ├── middlewares/      # Verificación JWT (verifyToken) y Roles (requireRole)
│   │   │   ├── models/           # Instancia de Prisma Client con adaptador PG
│   │   │   ├── routes/           # Definición de endpoints REST (/api/...)
│   │   │   ├── services/         # Lógica de negocio pura (POS, Recetas, Planilla SV)
│   │   │   ├── utils/            # Helpers (jwt.js, fechaSV.js)
│   │   │   ├── app.js            # Configuración de Express, Helmet, CORS y Rate Limit
│   │   │   └── index.js          # Punto de entrada del servidor
│   │   ├── .env.example
│   │   └── package.json
│   │
│   ├── frontend/                 # Aplicación SPA en React + Vite
│   │   ├── src/
│   │   │   ├── components/       # Componentes reutilizables (Navbar, Sidebar, Modales)
│   │   │   ├── context/          # Estado global de sesión (AuthContext.jsx)
│   │   │   ├── pages/            # Vistas principales (POS, Inventario, Compras, Caja, RRHH)
│   │   │   ├── services/         # Cliente HTTP centralizado (apiFetch) y servicios por módulo
│   │   │   ├── styles/           # Hojas de estilo SCSS y Bootstrap
│   │   │   ├── App.jsx           # Definición de rutas protegidas
│   │   │   └── main.jsx          # Punto de montaje React
│   │   ├── vite.config.js        # Configuración de Vite y Reverse Proxy hacia el Gateway
│   │   └── package.json
│   │
│   └── gateway/                  # API Gateway Intermediario en PHP
│       ├── index.php             # Proxy HTTP, inyección de X-Gateway-Token e IP real
│       └── .env.example
│
├── scripts/                      # Scripts de automatización del monorepo
│   ├── dev.mjs                   # Orquestador de desarrollo (levanta Backend, PHP y Vite)
│   ├── db-init.mjs               # Inicialización de esquema SQL
│   └── db-seed.mjs               # Carga de datos iniciales de prueba
│
├── .gitignore
├── package.json                  # Scripts globales del monorepo
└── README.md
```

---

## ⚙️ Requisitos Previos

* **Node.js** `v22.12.0` o superior
* **PostgreSQL** `v14` o superior corriendo localmente
* **PHP** `v8.2` o `v8.3` (CLI agregado al `PATH` del sistema para ejecutar el API Gateway)
  * *Windows:* `winget install PHP.PHP.8.3` (o usar PHP de XAMPP/Laragon)
  * *macOS:* `brew install php`
  * *Linux (Ubuntu/Debian):* `sudo apt install php-cli`

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/susan-castillo/restaurante-origenes-sv-web2026.git
cd restaurante-origenes-sv-web2026
```

### 2. Configurar Variables de Entorno (`.env`)
Copia las plantillas `.env.example` en cada aplicación (el script `npm run dev` también las genera automáticamente si no existen):

#### `apps/backend/.env`
```env
NODE_ENV=development
HOST=127.0.0.1
PORT=3000

# Base de datos PostgreSQL
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/restaurante_sv?schema=public"

# Seguridad JWT y Gateway (Debe coincidir con apps/gateway/.env)
JWT_SECRET=origenes_sv_jwt_super_secreto_2026
INTERNAL_GATEWAY_TOKEN=origenes_gateway_secret_2026
CORS_ORIGIN=http://127.0.0.1:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=500
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=5
```

#### `apps/gateway/.env`
```env
GATEWAY_PORT=8085
BACKEND_INTERNAL_URL=http://127.0.0.1:3000
INTERNAL_GATEWAY_TOKEN=origenes_gateway_secret_2026
```

### 3. Instalar Dependencias e Inicializar Base de Datos
Desde la carpeta raíz del proyecto:
```bash
# Instalar dependencias de Frontend y Backend
npm run setup

# Generar cliente Prisma y sincronizar esquema en PostgreSQL
cd apps/backend
npx prisma generate
npx prisma db push
cd ../..

# Cargar datos iniciales (sucursales, usuarios, insumos, platillos y recetas)
npm run db:seed
```

---

## ▶️ Ejecución en Desarrollo y Producción

### Modo Desarrollo (Un solo comando)
Desde la raíz del proyecto, ejecuta el orquestador que levanta los 3 servicios en paralelo:
```bash
npm run dev
```
* **Frontend (React + Vite):** `http://127.0.0.1:5173`
* **API Gateway (PHP):** `http://127.0.0.1:8085` (Salud: `http://127.0.0.1:8085/gateway/health`)
* **Backend API (Express):** `http://127.0.0.1:3000`

*(Nota: Si PHP no está instalado en el equipo, `scripts/dev.mjs` activa un respaldo automático conectando Vite con Express, aunque se recomienda tener PHP activo para validar el flujo completo).*

### Modo Producción (Compilado)
1. **Compilar el Frontend (`dist/`):**
   ```bash
   npm run build:fe
   ```
2. **Iniciar Backend Express (Terminal 1):**
   ```bash
   npm run start:be
   ```
3. **Iniciar PHP API Gateway (Terminal 2):**
   ```bash
   php -S 127.0.0.1:8085 -t apps/gateway apps/gateway/index.php
   ```
4. **Servir Frontend compilado (Terminal 3):**
   ```bash
   cd apps/frontend && npm run preview -- --host 127.0.0.1
   ```

---

## 🔒 Seguridad Implementada

* **Aislamiento del Backend (`INTERNAL_GATEWAY_TOKEN`):** Express rechaza con `403 Forbidden` cualquier petición directa al puerto `3000` que no incluya la firma `X-Gateway-Token` enviada por el Gateway PHP.
* **Rate Limiting Granular por IP Real:** El Gateway reenvía `X-Real-IP` y `X-Forwarded-For` (`trust proxy` habilitado en Express). El endpoint `/api/auth/login` cuenta con un limitador estricto (máximo 5 intentos fallidos cada 15 minutos) independiente del límite general de la API.
* **Autenticación JWT Robusta:** Secreto único validado al arranque (*fail-fast*, sin claves quemadas en el código) y revalidación en PostgreSQL en cada petición protegida para bloquear al instante usuarios desactivados o actualizar cambios de sucursal/rol.
* **Protección HTTP y Contraseñas:** Cabeceras seguras mediante `helmet`, políticas `CORS` restringidas, límite de payload JSON (`10kb`) y hashing de contraseñas con `bcrypt`.

---

## 🌿 Flujo de Trabajo en Git

El repositorio sigue una estrategia **Git Flow por módulos**:
* `main`: Código estable y listo para producción/defensa.
* `develop`: Rama de integración de módulos completados.
* `feature/<modulo>`: Ramas individuales de trabajo (`feature/auth`, `feature/pos`, `feature/inventario`, `feature/compras`, `feature/caja`, `feature/rrhh`).

---

## 👥 Equipo de Desarrollo — Cátedra Programación Web 2026
Proyecto desarrollado para **Restaurante Orígenes SV** — Arquitectura Full-Stack Multi-Sucursal.