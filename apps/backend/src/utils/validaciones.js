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