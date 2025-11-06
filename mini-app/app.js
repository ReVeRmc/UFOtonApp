const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// ←←← ЗАМЕНИ НА СВОЙ localhost.run URL
const API_BASE = 'https://e1c653513267fc.lhr.life';

async function callApi(endpoint, method = 'GET', body = null) {
  const res = await fetch(API_BASE + endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': tg.initData
    },
    body: body ? JSON.stringify(body) : null
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function updateBalance() {
  try {
    const { balance } = await callApi('/api/balance');
    document.getElementById('balance').innerText = `Balance: ${balance} pts`;
  } catch (e) {
    document.getElementById('balance').innerText = 'Error loading balance';
  }
}

async function buyTon() {
  try {
    const { address, amountNano } = await callApi('/api/pay/ton', 'POST', { amount: 1 });
    const tonAmount = (amountNano / 1e9).toFixed(4);
    document.getElementById('result').innerHTML = `
      <p>Send <b>${tonAmount} TON</b> to:</p>
      <p><code style="word-break:break-all; background:#eee; padding:8px; display:block;">${address}</code></p>
      <button onclick="checkTon()" style="margin-top:10px; padding:10px; background:green; color:white; border:none; border-radius:4px;">
        Check Payment
      </button>
    `;
    document.getElementById('result').style.display = 'block';
  } catch (e) {
    alert('TON invoice error: ' + e.message);
  }
}

async function checkTon() {
  try {
    const { success, balance } = await callApi('/api/check-ton', 'POST');
    if (success) {
      alert('✅ Payment received! Balance updated.');
      document.getElementById('balance').innerText = `Balance: ${balance} pts`;
      document.getElementById('result').style.display = 'none';
    } else {
      alert('Payment not found yet. Wait 1-2 min and try again.');
    }
  } catch (e) {
    alert('Check failed: ' + e.message);
  }
}

updateBalance();