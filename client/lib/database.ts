import { neon } from "@neondatabase/serverless";

// Database connection
export const sql = neon(process.env.DATABASE_URL || "");

// Test database connection
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Client management functions
export interface Client {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  database_url?: string;
  created_at: string;
}

export interface ClientFeature {
  client_id: string;
  feature_name: string;
  enabled: boolean;
  config: Record<string, any>;
}

// Available features
export const AVAILABLE_FEATURES = {
  LONG_TERM_GOALS: "long_term_goals",
  ACTION_PLAN: "action_plan",
  BLOCKERS_ISSUES: "blockers_issues",
  AGENDA: "agenda",
  FOCUS_MODE: "focus_mode",
} as const;

export type FeatureName =
  (typeof AVAILABLE_FEATURES)[keyof typeof AVAILABLE_FEATURES];

// Client operations
export async function getClients(): Promise<Client[]> {
  try {
    const result = await sql`
      SELECT id, name, slug, subdomain, database_url, created_at
      FROM clients
      ORDER BY created_at DESC
    `;
    return result as Client[];
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

export async function getClient(slugOrId: string): Promise<Client | null> {
  try {
    const result = await sql`
      SELECT id, name, slug, subdomain, database_url, created_at
      FROM clients
      WHERE slug = ${slugOrId} OR id = ${slugOrId}
      LIMIT 1
    `;
    return (result[0] as Client) || null;
  } catch (error) {
    console.error("Error fetching client:", error);
    return null;
  }
}

export async function createClient(data: {
  name: string;
  slug: string;
  subdomain?: string;
}): Promise<Client | null> {
  try {
    const result = await sql`
      INSERT INTO clients (name, slug, subdomain)
      VALUES (${data.name}, ${data.slug}, ${data.subdomain || null})
      RETURNING id, name, slug, subdomain, database_url, created_at
    `;
    return (result[0] as Client) || null;
  } catch (error) {
    console.error("Error creating client:", error);
    return null;
  }
}

// Feature management
export async function getClientFeatures(
  clientId: string,
): Promise<ClientFeature[]> {
  try {
    const result = await sql`
      SELECT client_id, feature_name, enabled, config
      FROM client_features
      WHERE client_id = ${clientId}
    `;
    return result as ClientFeature[];
  } catch (error) {
    console.error("Error fetching client features:", error);
    return [];
  }
}

export async function updateClientFeature(
  clientId: string,
  featureName: FeatureName,
  enabled: boolean,
  config: Record<string, any> = {},
): Promise<boolean> {
  try {
    await sql`
      INSERT INTO client_features (client_id, feature_name, enabled, config)
      VALUES (${clientId}, ${featureName}, ${enabled}, ${JSON.stringify(config)})
      ON CONFLICT (client_id, feature_name)
      DO UPDATE SET enabled = ${enabled}, config = ${JSON.stringify(config)}
    `;
    return true;
  } catch (error) {
    console.error("Error updating client feature:", error);
    return false;
  }
}

// Get client configuration for the app
export async function getClientConfig(clientId: string) {
  try {
    const client = await getClient(clientId);
    if (!client) return null;

    const features = await getClientFeatures(clientId);

    // Convert features array to object
    const featuresConfig: Record<string, boolean> = {};
    Object.values(AVAILABLE_FEATURES).forEach((feature) => {
      const featureData = features.find((f) => f.feature_name === feature);
      featuresConfig[feature] = featureData?.enabled ?? true; // Default to enabled
    });

    return {
      clientId: client.id,
      name: client.name,
      slug: client.slug,
      features: featuresConfig,
      branding: {
        primaryColor: "#346.8 77.2% 49.8%", // Default to current pink theme
      },
    };
  } catch (error) {
    console.error("Error getting client config:", error);
    return null;
  }
}
