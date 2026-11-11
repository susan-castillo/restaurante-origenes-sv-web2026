// Reinicia los datos de la base local: borra todo y carga database/seeds.sql.
// Uso, desde la raíz del repo:
//   node scripts/db-reset.mjs              borra todo y carga los datos de demostración
//   node scripts/db-reset.mjs --sin-seed   solo borra los datos (tablas vacías)
// Las tablas deben existir: si es una base nueva, corre antes `npx prisma db push`
// dentro de apps/backend.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.join(raiz, 'apps', 'backend');

// pg está instalado en apps/backend, no en la raíz del repo
const require = createRequire(path.join(backend, 'package.json'));
const { Client } = require('pg');

try {
    process.loadEnvFile(path.join(backend, '.env'));
} catch {
    console.error('No se pudo leer apps/backend/.env. Créalo desde .env.example.');
    process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
    console.error('Falta DATABASE_URL en apps/backend/.env');
    process.exit(1);
}

// Protección: este script borra datos, así que solo corre contra una base local.
const host = new URL(url).hostname;
if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(host)) {
    console.error(`Por seguridad solo se permite una base local (host actual: ${host}).`);
    process.exit(1);
}

const sinSeed = process.argv.includes('--sin-seed');
const leer = (archivo) => readFileSync(path.join(raiz, 'database', archivo), 'utf8');

const TABLAS = [
    'sucursales', 'usuarios', 'insumos', 'platillos', 'recetas', 'inventario_sucursal',
    'proveedores', 'compras', 'detalle_compra', 'turnos_caja', 'ventas', 'detalle_venta',
    'pagos_planilla',
];

const client = new Client({ connectionString: url });
try {
    await client.connect();

    await client.query(leer('reset.sql'));
    console.log('Datos borrados.');

    if (!sinSeed) {
        await client.query(leer('seeds.sql'));
        console.log('Seeds cargados.');
    }

    console.log('\nFilas por tabla:');
    for (const tabla of TABLAS) {
        const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${tabla}`);
        console.log(`  ${tabla.padEnd(20)} ${rows[0].n}`);
    }
} catch (error) {
    console.error('Error:', error.message);
    if (error.code === '42P01') {
        console.error('Faltan tablas. Corre primero `npx prisma db push` dentro de apps/backend.');
    }
    process.exitCode = 1;
} finally {
    await client.end();
}