const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, OPTIONS' } });

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return json({}, 204);
    const url = new URL(request.url);
    const flight = url.searchParams.get('flight')?.trim();
    const registration = url.searchParams.get('reg')?.trim();
    if (!flight && !registration) return json({ error: 'Informe flight ou reg' }, 400);
    if (!env.FLIGHTRADAR_URL || !env.FLIGHTRADAR_TOKEN) return json({ error: 'Provedor de localização não configurado' }, 500);
    const key = `aircraft:${flight || ''}:${registration || ''}`;
    if (env.AIRCRAFT_CACHE) { const cached = await env.AIRCRAFT_CACHE.get(key, 'json'); if (cached) return json(cached); }
    try {
      const target = new URL(env.FLIGHTRADAR_URL);
      if (flight) target.searchParams.set('flight', flight);
      if (registration) target.searchParams.set('reg', registration);
      const upstream = await fetch(target, { headers: { Authorization: `Bearer ${env.FLIGHTRADAR_TOKEN}`, Accept: 'application/json' } });
      const value = await upstream.json().catch(() => ({}));
      if (!upstream.ok) return json({ error: value.error || 'Aeronave não encontrada no ar' }, upstream.status || 502);
      const result = { lat: Number(value.lat ?? value.latitude), lon: Number(value.lon ?? value.longitude), altitude: value.altitude ?? value.altitude_ft ?? null, velocidade: value.velocidade ?? value.groundSpeed ?? value.speed ?? null, direcao: value.direcao ?? value.heading ?? value.track ?? 0, origem: value.origem ?? value.originAirportIata ?? null, destino: value.destino ?? value.destinationAirportIata ?? null, atualizado_em: value.atualizado_em || new Date().toISOString() };
      if (!Number.isFinite(result.lat) || !Number.isFinite(result.lon)) return json({ error: 'A posição da aeronave não está disponível' }, 404);
      if (env.AIRCRAFT_CACHE) await env.AIRCRAFT_CACHE.put(key, JSON.stringify(result), { expirationTtl: Number(env.CACHE_SECONDS || 30) });
      return json(result);
    } catch (error) { console.error(error); return json({ error: 'Falha ao consultar o provedor de localização' }, 502); }
  },
};
