const json = (body, status = 410) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  },
});

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return json({}, 204);
    return json({ error: 'Localização de aeronaves desativada.' }, 410);
  },
};
