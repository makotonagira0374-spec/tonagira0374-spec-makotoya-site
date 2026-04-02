export default async function handler(req, res) {
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
    serviceName = '',
    planName = '',
    date = '',
    time = '',
    guests = '',
    phone = '',
    lineContact = '',
    purpose = '',
    notes = ''
  } = req.body || {};

  const lines = [
    '【新規予約】',
    '',
    `名前：${name}`,
    `サービス：${serviceName}`,
    `プラン：${planName || '未定'}`,
    `日時：${date} ${time}`,
    `人数：${guests}名`,
    `電話：${phone}`,
    `LINE：${lineContact || '未記入'}`
  ];

  if (purpose) lines.push(`利用目的：${purpose}`);
  if (notes) lines.push(`備考：${notes}`);

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
          text: lines.join('\n')
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return res.status(500).json({ error: errorText || 'LINE push failed' });
  }

  return res.status(200).json({ success: true });
}
