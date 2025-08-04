import { ClientConfig } from "@/hooks/use-client-config";

// Fallback configurations when API is not available
export const FALLBACK_CLIENTS: Record<string, ClientConfig> = {
  "8323e82d-075a-496d-8861-a86d862a67bc": {
    clientId: "8323e82d-075a-496d-8861-a86d862a67bc",
    name: "Demo Client",
    slug: "demo",
    features: {
      long_term_goals: true,
      action_plan: true,
      blockers_issues: true,
      agenda: true,
      goals_progress: true,
    },
    branding: {
      primaryColor: "#346.8 77.2% 49.8%",
    },
  },
  "fbf03fbc-bf81-462b-a88f-668dfcb09acc": {
    clientId: "fbf03fbc-bf81-462b-a88f-668dfcb09acc",
    name: "Blue Label Packaging",
    slug: "blue-label-packaging",
    features: {
      long_term_goals: true,
      action_plan: true,
      blockers_issues: false, // Disabled for Blue Label
      agenda: true,
      goals_progress: true,
    },
    branding: {
      primaryColor: "#1E40AF", // Blue theme
    },
  },
  "360e6a09-c7e2-447e-8dbc-cebae72f1ff2": {
    clientId: "360e6a09-c7e2-447e-8dbc-cebae72f1ff2",
    name: "ERC",
    slug: "erc",
    features: {
      long_term_goals: false, // Disabled for ERC
      action_plan: true,
      blockers_issues: true,
      agenda: true,
      goals_progress: true,
    },
    branding: {
      primaryColor: "#059669", // Green theme
    },
  },
};

export function getFallbackConfig(clientId: string): ClientConfig | null {
  return FALLBACK_CLIENTS[clientId] || null;
}

export function getDefaultFallbackConfig(): ClientConfig {
  return FALLBACK_CLIENTS["8323e82d-075a-496d-8861-a86d862a67bc"];
}
