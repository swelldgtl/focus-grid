// Utility functions for client API operations

export interface Client {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  created_at: string;
  features?: {
    long_term_goals: boolean;
    action_plan: boolean;
    blockers_issues: boolean;
    agenda: boolean;
    goals_progress: boolean;
  };
}

export interface CreateClientData {
  name: string;
  slug: string;
  subdomain: string;
}

// Generate URL-friendly slug from text
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with single
}

// Generate subdomain from client name (shorter version)
export function generateSubdomain(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "") // Remove all non-alphanumeric
    .substring(0, 15); // Limit length for subdomain
}

// API functions
export async function getClients(): Promise<Client[]> {
  try {
    const response = await fetch("/api/clients");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.clients || [];
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

export async function createClient(
  clientData: CreateClientData,
): Promise<Client | null> {
  try {
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return data.client;
  } catch (error) {
    console.error("Error creating client:", error);
    throw error;
  }
}

export async function updateClient(
  clientId: string,
  clientData: Omit<CreateClientData, "subdomain"> & { subdomain?: string },
): Promise<Client | null> {
  try {
    const response = await fetch(`/api/clients/${clientId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return data.client;
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
}

export async function deleteClient(clientId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/clients/${clientId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Error deleting client:", error);
    return false;
  }
}

export async function updateClientFeatures(
  clientId: string,
  features: Record<string, boolean>,
): Promise<boolean> {
  try {
    const response = await fetch(`/api/clients/${clientId}/features`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ features }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error updating client features:", error);
    return false;
  }
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  try {
    const clients = await getClients();
    return !clients.some((client) => client.slug === slug);
  } catch (error) {
    console.error("Error checking slug availability:", error);
    return false;
  }
}
