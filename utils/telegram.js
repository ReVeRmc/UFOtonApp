const crypto = require('crypto');

function validateInitData(initData, botToken) {
  const searchParams = new URLSearchParams(initData);
  const hash = searchParams.get('hash');
  searchParams.delete('hash');
  const dataCheckString = Array.from(searchParams.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  const calcHash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  return hash === calcHash;
}

module.exports = { validateInitData };