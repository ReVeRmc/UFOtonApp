require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { validateInitData } = require('./utils/telegram');
const { createTonInvoice, checkTonTransaction } = require('./utils/ton');

const app = express();
app.use(bodyParser.json());
app.use(express.static('mini-app'));

const users = {};

function requireAuth(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];
  if (!initData || !validateInitData(initData, process.env.BOT_TOKEN)) {
    return res.status(401).json({ error: 'Invalid initData' });
  }
  try {
    req.user = JSON.parse(new URLSearchParams(initData).get('user'));
  } catch (e) {
    return res.status(401).json({ error: 'Invalid user data' });
  }
  next();
}

app.get('/api/balance', requireAuth, (req, res) => {
  const userId = req.user.id;
  res.json({ balance: users[userId]?.balance || 0 });
});

app.post('/api/pay/ton', requireAuth, async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;
  const orderId = `ton_${userId}_${Date.now()}`;
  const { address, amountNano } = await createTonInvoice(amount);
  users[userId] = { ...users[userId], pendingOrder: { orderId, amount, type: 'ton', address, amountNano } };
  res.json({ address, amountNano, orderId });
});

app.post('/api/check-ton', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const order = users[userId]?.pendingOrder;
  if (!order || order.type !== 'ton') {
    return res.status(400).json({ error: 'No TON order' });
  }

  const success = await checkTonTransaction(order.address, order.amountNano);
  if (success) {
    users[userId].balance = (users[userId].balance || 0) + order.amount;
    delete users[userId].pendingOrder;
    return res.json({ success: true, balance: users[userId].balance });
  }
  res.json({ success: false });
});

app.listen(process.env.PORT, () => {
  console.log(`✅ Server running on port ${process.env.PORT}`);
  console.log(`🌐 Mini App URL: ${process.env.FRONTEND_URL}`);
});