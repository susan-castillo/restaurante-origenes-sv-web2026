# Restaurante Origenes SV - inicio de proyectos

Este repositorio contiene dos aplicaciones y un gateway:

- `apps/frontend/`: React 19.3, Vite y Reactstrap.
- `apps/backend/`: API REST con Express 5.
- `apps/gateway/`: punto de entrada PHP que reenvia `/api` a Express.
- `database/`: esquema inicial para MySQL.
- `scripts/dev.js`: prepara e inicia los proyectos para desarrollo.

## Requisitos

- Node.js 22.12 o posterior.
- npm.
- PHP 8.1 o posterior para usar el gateway (`curl` habilitado).
- MySQL 8.0 o posterior para inicializar el esquema.

## Inicio rapido

Desde la raiz del repositorio:

```powershell
node scripts/dev.js
```

El script crea los `.env` faltantes desde sus ejemplos, instala dependencias
cuando hace falta e inicia el backend y frontend. Si PHP esta instalado,
tambien inicia el gateway en `http://127.0.0.1:8080`; sin PHP, Vite conecta
directamente con Express en `http://127.0.0.1:3000`.

Para iniciar los servicios manualmente:

```powershell
cd apps/backend
npm install
npm run dev
```

En otra terminal:

```powershell
cd apps/frontend
npm install
npm run dev
```

Con PHP disponible, inicia el gateway desde otra terminal:

```powershell
cd apps/gateway
php -S 127.0.0.1:8080 index.php
```

El endpoint inicial es `/api/health`. Para usar MySQL, crea la base de datos
local e importa `database/schema.sql` con una cuenta que tenga permisos solo
para esa base. Los parametros de conexion de ejemplo estan en
`database/.env.example`; el esquema es una plantilla inicial y aun no esta
conectado a las rutas de Express.

Los `.env` se excluyen de Git. Las variables del frontend con prefijo `VITE_`
son publicas y nunca deben contener secretos.

## Dependencias

Se usan dependencias npm conocidas y minimas, con versiones fijadas y archivos
`package-lock.json`. Antes de desplegar, actualiza dependencias de forma
controlada y ejecuta `npm audit` dentro de cada proyecto. Ningun paquete puede
considerarse completamente seguro; revisa tambien la procedencia y el alcance
de las dependencias antes de publicar la aplicacion.