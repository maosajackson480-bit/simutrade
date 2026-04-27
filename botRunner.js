import { executeTrade } from "./tradeEngine.js";

const activeBots = new Map();

export const startBot = (userId, config) => {
  activeBots.set(userId, { config, running: true });
  console.log(`🤖 Bot started for user: ${userId}`);
  return { status: "started", config };
};

export const stopBot = (userId) => {
  activeBots.delete(userId);
  return { status: "stopped" };
};

export const processTickForBots = (tick) => {
  activeBots.forEach(async (bot, userId) => {
    // Basic Martingale / Over 2 Strategy example
    // Add your custom logic here
    if (bot.config.strategy === "Sniper" && tick.price < bot.config.targetPrice) {
      await executeTrade(userId, bot.config);
    }
  });
};