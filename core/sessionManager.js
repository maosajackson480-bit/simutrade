const sessions = new Map();

export function createSession(userId, ws, account) {
  const session = {
    userId,
    ws,
    account,
    balance: 0,
    contracts: [],
    createdAt: Date.now()
  };

  sessions.set(userId, session);
  return session;
}

export function getSession(userId) {
  return sessions.get(userId);
}

export function deleteSession(userId) {
  sessions.delete(userId);
}

export function updateSessionBalance(userId, balance) {
  const session = sessions.get(userId);
  if (session) session.balance = balance;
}

export function addContract(userId, contract) {
  const session = sessions.get(userId);
  if (session) session.contracts.push(contract);
}

export function getAllSessions() {
  return Array.from(sessions.values());
}