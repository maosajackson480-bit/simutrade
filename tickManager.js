import { createDerivConnection } from './derivSocket.js';
import { processTickForBots } from './botRunner.js';

export const setupTickManager = (wss) => {
  const derivWS = createDerivConnection();

  derivWS.on('message', (data) => {
    const response = JSON.parse(data);
    if (response.msg_type === 'tick') {
      const tickData = {
        symbol: response.tick.symbol,
        price: response.tick.quote,
        time: response.tick.epoch * 1000
      };

      // Push to Frontend
      wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'TICK_UPDATE', data: tickData }));
        }
      });

      // Push to Bots
      processTickForBots(tickData);
    }
  });

  return {
    subscribe: (symbol) => derivWS.send(JSON.stringify({ ticks: symbol })),
    unsubscribe: () => derivWS.send(JSON.stringify({ forget_all: 'ticks' }))
  };
};