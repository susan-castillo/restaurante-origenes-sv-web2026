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
