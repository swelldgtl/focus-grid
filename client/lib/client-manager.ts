export interface Client {
  id: string;
  name: string;
  createdAt: string;
}

const CLIENTS_KEY = "focus_grid_clients";
const CURRENT_CLIENT_KEY = "focus_grid_current_client";

export const getClients = (): Client[] => {
  try {
    const stored = localStorage.getItem(CLIENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveClients = (clients: Client[]): void => {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
};

export const getCurrentClient = (): Client | null => {
  try {
    const stored = localStorage.getItem(CURRENT_CLIENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const setCurrentClient = (client: Client): void => {
  localStorage.setItem(CURRENT_CLIENT_KEY, JSON.stringify(client));
};

export const createClient = (name: string): Client => {
  const newClient: Client = {
    id: Date.now().toString(),
    name,
    createdAt: new Date().toISOString(),
  };

  const clients = getClients();
  clients.push(newClient);
  saveClients(clients);

  return newClient;
};

export const deleteClient = (clientId: string): void => {
  const clients = getClients().filter((c) => c.id !== clientId);
  saveClients(clients);

  // Clear all data for this client
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(`client_${clientId}_`)) {
      localStorage.removeItem(key);
    }
  });
};

// Modify storage keys to be client-specific
export const getClientStorageKey = (
  baseKey: string,
  clientId: string,
): string => {
  return `client_${clientId}_${baseKey}`;
};
