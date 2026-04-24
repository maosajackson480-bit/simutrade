const contractMap = new Map(); // contractId -> userId
const userContracts = new Map(); // userId -> Set(contractIds)

/* =========================
   REGISTER CONTRACT
========================= */
export function registerContract(contractId, userId) {
  contractMap.set(contractId, userId);

  if (!userContracts.has(userId)) {
    userContracts.set(userId, new Set());
  }

  userContracts.get(userId).add(contractId);
}

/* =========================
   GET USER FOR CONTRACT
========================= */
export function getUserForContract(contractId) {
  return contractMap.get(contractId);
}

/* =========================
   UNREGISTER CONTRACT
========================= */
export function unregisterContract(contractId) {
  const userId = contractMap.get(contractId);

  if (userId) {
    userContracts.get(userId)?.delete(contractId);
  }

  contractMap.delete(contractId);
}

/* =========================
   REMOVE USER CONTRACTS
========================= */
export function unregisterUserContracts(userId) {
  const contracts = userContracts.get(userId);

  if (contracts) {
    contracts.forEach(id => contractMap.delete(id));
  }

  userContracts.delete(userId);
}