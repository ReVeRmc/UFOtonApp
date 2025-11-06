const axios = require('axios');

const WALLET_ADDRESS = 'UQBPt_qwTc894dXsPGkiWoYkmYEMjbgREkuqHnFy_pHC5k9I';
const DRPC_API_KEY = process.env.DRPC_API_KEY;

async function createTonInvoice(usdAmount) {
  const tonPrice = await getTonPrice();
  const tonAmount = usdAmount / tonPrice;
  const nanoAmount = Math.ceil(tonAmount * 1e9);
  return { address: WALLET_ADDRESS, amountNano: nanoAmount };
}

async function getTonPrice() {
  try {
    const res = await axios.get('https://price.ton.org/ton-usd');
    return res.data.price;
  } catch (e) {
    return 2.5;
  }
}

async function checkTonTransaction(address, expectedNano) {
  try {
    const response = await axios.post(
      'https://ton.drpc.org',
      {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'getTransactions',
        params: {
          address: address,
          limit: 20
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DRPC_API_KEY}`
        }
      }
    );

    const txs = response.data.result?.transactions || [];
    for (const tx of txs) {
      if (tx.in_msg && tx.in_msg.source) {
        const amount = BigInt(tx.in_msg.value || 0);
        const expected = BigInt(expectedNano);
        if (amount >= (expected * 95n) / 100n) {
          console.log('✅ TON payment confirmed:', amount.toString());
          return true;
        }
      }
    }
  } catch (e) {
    console.error('dRPC error:', e.message);
  }
  return false;
}

module.exports = { createTonInvoice, checkTonTransaction };