const LINE_PUSH_ENDPOINT = 'https://api.line.me/v2/bot/message/push';

function getLineConfig() {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;

  if (!accessToken || !userId) {
    throw new Error('LINE environment variables are not configured');
  }

  return { accessToken, userId };
}

export async function sendLineTextMessage(text: string) {
  const { accessToken, userId } = getLineConfig();

  const response = await fetch(LINE_PUSH_ENDPOINT, {
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
          text
        }
      ]
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || 'LINE push failed');
  }
}
