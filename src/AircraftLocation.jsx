import { useEffect, useRef, useState } from 'react';
import { getAircraftLocation, renderAircraftMap } from './aircraftApi';

export default function AircraftLocation({ flight, onClose }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      setData({ ...(await getAircraftLocation({ flight: flight.number, registration: flight.registration })), voo: flight.number });
    } catch (err) {
      setData(null);
      setError(err.status === 404 ? 'Aeronave ainda não detectada em voo.' : !navigator.onLine ? 'Sem conexão. Tente novamente.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 45000);
    return () => clearInterval(timer);
  }, [flight.number, flight.registration]);

  useEffect(() => {
    if (!data || !mapContainer.current) return;
    map.current?.remove();
    map.current = renderAircraftMap(mapContainer.current, data);
    return () => map.current?.remove();
  }, [data]);

  return <div className="aircraft-modal-backdrop">
    <section className="aircraft-modal" role="dialog" aria-modal="true">
      <header className="aircraft-modal-header"><div><small>LOCALIZAÇÃO DA AERONAVE</small><strong>Voo {flight.number || '—'}</strong></div><button onClick={onClose}>Fechar</button></header>
      {loading && <p className="aircraft-message">Consultando localização…</p>}
      {error && <div className="aircraft-error"><span>{error}</span><button onClick={refresh}>Tentar novamente</button></div>}
      <div ref={mapContainer} className="aircraft-map" />
      {data && <footer className="aircraft-footer"><span>Atualizado às {new Date(data.atualizado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span><button onClick={refresh}>Atualizar</button></footer>}
    </section>
  </div>;
}
