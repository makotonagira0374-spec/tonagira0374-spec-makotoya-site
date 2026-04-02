const ALLOWED_ORIGINS = new Set([
  'https://makotoyarickshaw.jp',
  'https://www.makotoyarickshaw.jp'
]);

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || '';

  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;

  if (!accessToken || !userId) {
    return res.status(500).json({ error: 'LINE environment variables are not configured' });
  }

  const {
    name = '',
    service = '',
    plan = '',
    date = '',
    time = '',
    people = '',
    phone = '',
    email = '',
    lineId = '',
    note = ''
  } = req.body || {};

  if (!name || !service || !date || !time || !people) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const message = [
    '【新規予約】',
    `サービス：${service}`,
    `プラン：${plan || '未定'}`,
    `お名前：${name}`,
    `日時：${date} ${time}`,
    `人数：${people}名`,
    `電話：${phone || '未記入'}`,
    `メール：${email || '未記入'}`,
    `LINE：${lineId || '未記入'}`,
    `備考：${note || 'なし'}`
  ].join('\n');

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        to: userId,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({
        error: 'LINE push failed',
        details: errorText || 'Unknown LINE API error'
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
