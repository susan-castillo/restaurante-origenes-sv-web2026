// Formato de dinero igual que SucursalMetricas: USD con es-SV.
const formatoDolares = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });

export const formatearDolares = (valor) => formatoDolares.format(Number(valor) || 0);

// Margen = ganancia / ventas. Es la ÚNICA fórmula de porcentaje del dashboard.
// Si no hay ventas devuelve null para no mostrar NaN% ni Infinity%.
export const calcularMargen = (ganancia, ventas) => {
    const base = Number(ventas);
    if (!base) return null;
    return (Number(ganancia) / base) * 100;
};

export const formatearMargen = (margen) =>
    margen === null ? '—' : `${margen.toFixed(2)}%`;