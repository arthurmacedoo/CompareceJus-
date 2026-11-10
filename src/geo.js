'use strict';

/**
 * Distância em metros entre duas coordenadas (fórmula de Haversine).
 */
function distanciaMetros(a, b) {
  if (!a || !b) return null;
  const R = 6371000;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatarDistancia(m) {
  if (m == null) return '—';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',')} km`;
}

function coordenadaValida(c) {
  return (
    c &&
    typeof c.lat === 'number' &&
    typeof c.lng === 'number' &&
    Math.abs(c.lat) <= 90 &&
    Math.abs(c.lng) <= 180
  );
}

module.exports = { distanciaMetros, formatarDistancia, coordenadaValida };
