/* import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path = [] } = req.query;
  const targetPath = Array.isArray(path) ? path.join('/') : path;

  const targetUrl = `https://ci.zerobias.com/api/${targetPath}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        Authorization: `APIKey ${process.env.API_KEY}`,
      },
      body: ['GET', 'HEAD'].includes(req.method || '') ? undefined : req.body,
    });

    const data = await response.arrayBuffer();

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    });

    res.send(Buffer.from(data));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
} */
