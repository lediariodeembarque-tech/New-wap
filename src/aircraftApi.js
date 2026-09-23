import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const endpoint = import.meta.env.VITE_AIRCRAFT_API_URL || '/api/aircraft-location';

export async function getAircraftLocation({ flight, registration } = {}) {
  const params = new URLSearchParams();
  if (flight) params.set('flight', flight);
  if (registration) params.set('reg', registration);
  if (!params.toString()) throw new Error('Informe o número do voo.');
  const response = await fetch(`${endpoint}?${params}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Não foi possível localizar a aeronave.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export function renderAircraftMap(container, aircraft) {
  const map = L.map(container).setView([aircraft.lat, aircraft.lon], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);
  const icon = L.divIcon({
    className: 'aircraft-marker',
    html: `<span style="transform:rotate(${Number(aircraft.direcao || 0)}deg)">✈</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
  const popup = `<strong>Voo ${aircraft.voo || '—'}</strong><br>${aircraft.origem || '—'} → ${aircraft.destino || '—'}<br>Altitude: ${aircraft.altitude ?? '—'}<br>Velocidade: ${aircraft.velocidade ?? '—'}`;
  L.marker([aircraft.lat, aircraft.lon], { icon }).addTo(map).bindPopup(popup).openPopup();
  return map;
}
