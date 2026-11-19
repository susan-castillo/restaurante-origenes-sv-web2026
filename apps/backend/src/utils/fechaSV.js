export function rangoDiaSV(ahora = new Date()) {
  const fecha = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/El_Salvador",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
  const inicio = new Date(`${fecha}T00:00:00.000-06:00`);
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  return { fecha, inicio, fin };
}

export function rangoFechasSV(desde, hasta) {
  const fechas = [desde, hasta].map((fecha) => {
    if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error('Usa fechas YYYY-MM-DD.');
    const dia = new Date(fecha + 'T00:00:00Z');
    if (Number.isNaN(dia.getTime()) || dia.toISOString().slice(0, 10) !== fecha) throw new Error('La fecha no existe.');
    return rangoDiaSV(new Date(fecha + 'T12:00:00Z'));
  });
  if (fechas[0].inicio >= fechas[1].fin) throw new Error('El rango de fechas está invertido.');
  return { inicio: fechas[0].inicio, fin: fechas[1].fin };
}
