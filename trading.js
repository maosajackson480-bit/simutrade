/* =========================
   BUY TRADE
========================= */
export function buyTrade(ws, { amount, contractType, duration, symbol, currency }) {
  return new Promise((resolve, reject) => {
    ws.send(JSON.stringify({
      proposal: 1,
      amount,
      basis: "stake",
      contract_type: contractType,
      currency,
      duration,
      duration_unit: "t",
      symbol
    }));

    ws.once("message", (msg) => {
      const data = JSON.parse(msg);

      if (data.error) return reject(new Error(data.error.message));

      const proposalId = data.proposal.id;

      ws.send(JSON.stringify({
        buy: proposalId,
        price: amount
      }));

      ws.once("message", (buyMsg) => {
        const buyData = JSON.parse(buyMsg);

        if (buyData.error) return reject(new Error(buyData.error.message));

        resolve({
          contractId: buyData.buy.contract_id,
          payout: buyData.buy.payout,
          askPrice: buyData.buy.buy_price
        });
      });
    });
  });
}

/* =========================
   SELL TRADE
========================= */
export function sellTrade(ws, contractId, price) {
  return new Promise((resolve, reject) => {
    ws.send(JSON.stringify({
      sell: contractId,
      price
    }));

    ws.once("message", (msg) => {
      const data = JSON.parse(msg);

      if (data.error) return reject(new Error(data.error.message));

      resolve({
        soldFor: data.sell.sold_for,
        transactionId: data.sell.transaction_id
      });
    });
  });
}