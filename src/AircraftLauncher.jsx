import React, { useState } from 'react';
import AircraftLocation from './AircraftLocation';

const readFlight = () => {
  try {
    const days = JSON.parse(localStorage.getItem('embarque:dias') || '{}');
    const date = new Date().toISOString().slice(0, 10);
    return days[date]?.flights?.[0] || null;
  } catch { return null; }
};

export default function AircraftLauncher() {
  const [flight, setFlight] = useState(null);
  const open = () => {
    const current = readFlight();
    if (!current?.number) return window.dispatchEvent(new CustomEvent('embarque:toast', { detail: 'Informe o número do voo para localizar a aeronave.' }));
    setFlight(current);
  };
  return <>
    <button className="aircraft-launcher" onClick={open} title="Localizar aeronave">📍 Localizar aeronave</button>
    {flight && <AircraftLocation flight={flight} onClose={() => setFlight(null)} />}
  </>;
}
