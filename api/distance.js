// Vercel Serverless Function: /api/distance
// Keeps your Google Maps API key secure on the server.
// Deploy this file to your repo at: api/distance.js
// Set GOOGLE_MAPS_KEY in Vercel → Settings → Environment Variables.

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { origin, destination } = req.query;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'Missing origin or destination' });
  }

  const apiKey = process.env.GOOGLE_MAPS_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.set('origins', origin);
    url.searchParams.set('destinations', destination);
    url.searchParams.set('region', 'ie');
    url.searchParams.set('units', 'metric');
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.status(400).json({ error: `Maps API error: ${data.status}` });
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') {
      return res.status(400).json({ error: `Route not found: ${element?.status || 'UNKNOWN'}` });
    }

    // Return just what we need — distance in km
    return res.status(200).json({
      distanceKm: element.distance.value / 1000,
      distanceText: element.distance.text,
      durationText: element.duration.text,
    });

  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch distance' });
  }
}
