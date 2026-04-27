import { buyTrade } from "./trading.js";
import { createDerivConnection } from "./derivSocket.js";
import { updateSessionBalance } from "./core/sessionManager.js";

const tradeWS = createDerivConnection();

export const executeTrade = async (userId, config) => {
  try {
    const result = await buyTrade(tradeWS, {
      amount: config.amount,
      contractType: config.contractType,
      duration: config.duration || 5,
      symbol: config.symbol,
      currency: "USD"
    });

    await updateSessionBalance(userId, -config.amount);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};