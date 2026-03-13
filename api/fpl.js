export default async function handler(req, res) {
  // Allow all origins (this is your own proxy, only used by your app)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { path } = req.query;
  if (!path) return res.status(400).json({ error: 'Missing path' });

  // Only allow known FPL endpoints for safety
  const allowed = ['bootstrap-static/', 'fixtures/', 'fixtures'];
  const clean = Array.isArray(path) ? path.join('/') : path;
  if (!allowed.some(p => clean.startsWith(p))) {
    return res.status(403).json({ error: 'Path not allowed' });
  }

  try {
    const fplRes = await fetch(`https://fantasy.premierleague.com/api/${clean}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FPLHub/1.0)',
      }
    });
    if (!fplRes.ok) throw new Error(`FPL API returned ${fplRes.status}`);
    const data = await fplRes.json();
    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
