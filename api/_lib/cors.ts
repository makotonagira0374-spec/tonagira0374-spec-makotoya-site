const ALLOWED_ORIGINS = new Set([
  'https://makotoyarickshaw.jp',
  'https://www.makotoyarickshaw.jp'
]);

export function setCorsHeaders(req: any, res: any, methods: string[]) {
  const origin = req.headers.origin || '';

  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function handleOptions(req: any, res: any, methods: string[]) {
  setCorsHeaders(req, res, methods);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
