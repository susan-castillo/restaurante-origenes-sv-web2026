// Utilidades de validación compartidas por los controllers.

// Convierte un valor en id entero positivo, o devuelve null si no es válido.
export const idValido = (valor) => {
    if (typeof valor !== 'number' && typeof valor !== 'string') return null;
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
};

// Convierte un número o un texto numérico en number; devuelve NaN si no se puede.
export const aNumero = (valor) => {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string' && valor.trim() !== '') return Number(valor);
    return NaN;
};

// Interpreta el filtro ?activo=true|false.
// Devuelve { valor } (undefined si no se envió) o { error } si el texto no es válido.
export const filtroActivo = (valor) => {
    if (valor === undefined) return { valor: undefined };
    if (valor === 'true') return { valor: true };
    if (valor === 'false') return { valor: false };
    return { error: 'El filtro activo debe ser true o false.' };
};

// Normaliza texto para buscar: minúsculas y sin tildes ("Café" → "cafe").
export const normalizarTexto = (texto) =>
    String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Interpreta el filtro ?buscar=.
// Devuelve { valor } (undefined si no se envió o viene vacío) o { error } si no es válido.
export const filtroBuscar = (valor) => {
    if (valor === undefined) return { valor: undefined };
    if (typeof valor !== 'string') return { error: 'El filtro buscar debe ser un texto.' };
    const texto = valor.trim();
    if (texto.length > 100) return { error: 'La búsqueda no puede superar 100 caracteres.' };
    return { valor: texto === '' ? undefined : texto };
};

// Indica si el nombre contiene el texto buscado, ignorando mayúsculas y tildes.
export const coincideNombre = (nombre, buscar) =>
    normalizarTexto(nombre).includes(normalizarTexto(buscar));