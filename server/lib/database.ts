import { neon } from "@neondatabase/serverless";

// Get database URL from environment
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL environment variable is not set");
    console.error(
      "Available env vars:",
      Object.keys(process.env).filter((key) => key.includes("DATABASE")),
    );
  }
  return url || "";
};

// Create database connection
const createConnection = () => {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Check deployment configuration.",
    );
  }
  return neon(url);
};

// Test database connection
export async function testConnection() {
  try {
    const sql = createConnection();
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
  GOALS_PROGRESS: "goals_progress",
} as const;

export type FeatureName =
  (typeof AVAILABLE_FEATURES)[keyof typeof AVAILABLE_FEATURES];

// Admin user management
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface AdminSession {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
}

// Action Items interface for database
export interface ActionItem {
  id: string;
  client_id: string;
  title: string;
  status: "on-track" | "off-track";
  due_date?: string; // ISO date string
  created_at: string;
  updated_at: string;
}

// Client operations
export async function getClients(): Promise<Client[]> {
  try {
    const sql = createConnection();
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
    const sql = createConnection();

    // Check if the input looks like a UUID (simple pattern check)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        slugOrId,
      );

    let result;
    if (isUUID) {
      // If it looks like a UUID, check both slug and id
      result = await sql`
        SELECT id, name, slug, subdomain, database_url, created_at
        FROM clients
        WHERE slug = ${slugOrId} OR id = ${slugOrId}
        LIMIT 1
      `;
    } else {
      // If it's not a UUID, only check slug
      result = await sql`
        SELECT id, name, slug, subdomain, database_url, created_at
        FROM clients
        WHERE slug = ${slugOrId}
        LIMIT 1
      `;
    }

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
    const sql = createConnection();
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

export async function updateClient(
  clientId: string,
  data: {
    name: string;
    slug: string;
    subdomain?: string;
  },
): Promise<Client | null> {
  try {
    const sql = createConnection();
    const result = await sql`
      UPDATE clients
      SET name = ${data.name}, slug = ${data.slug}, subdomain = ${data.subdomain || null}
      WHERE id = ${clientId}
      RETURNING id, name, slug, subdomain, database_url, created_at
    `;
    return (result[0] as Client) || null;
  } catch (error) {
    console.error("Error updating client:", error);
    return null;
  }
}

export async function deleteClient(clientId: string): Promise<boolean> {
  try {
    const sql = createConnection();

    // First delete associated client features
    await sql`DELETE FROM client_features WHERE client_id = ${clientId}`;

    // Then delete the client
    const result = await sql`
      DELETE FROM clients
      WHERE id = ${clientId}
      RETURNING id
    `;

    return result.length > 0;
  } catch (error) {
    console.error("Error deleting client:", error);
    return false;
  }
}

// Admin authentication functions
export async function createAdminUser(
  username: string,
  email: string,
  passwordHash: string,
): Promise<AdminUser | null> {
  try {
    const sql = createConnection();
    const result = await sql`
      INSERT INTO admin_users (username, email, password_hash, is_active)
      VALUES (${username}, ${email}, ${passwordHash}, true)
      RETURNING id, username, email, password_hash, created_at, last_login, is_active
    `;
    return result[0] as AdminUser;
  } catch (error) {
    console.error("Error creating admin user:", error);
    return null;
  }
}

export async function getAdminUserByUsername(
  username: string,
): Promise<AdminUser | null> {
  try {
    const sql = createConnection();
    const result = await sql`
      SELECT id, username, email, password_hash, created_at, last_login, is_active
      FROM admin_users
      WHERE username = ${username} AND is_active = true
      LIMIT 1
    `;
    return (result[0] as AdminUser) || null;
  } catch (error) {
    console.error("Error fetching admin user:", error);
    return null;
  }
}

export async function updateAdminLastLogin(userId: string): Promise<boolean> {
  try {
    const sql = createConnection();
    await sql`
      UPDATE admin_users
      SET last_login = NOW()
      WHERE id = ${userId}
    `;
    return true;
  } catch (error) {
    console.error("Error updating last login:", error);
    return false;
  }
}

export async function createAdminSession(
  userId: string,
  sessionToken: string,
  expiresAt: Date,
): Promise<AdminSession | null> {
  try {
    const sql = createConnection();
    const result = await sql`
      INSERT INTO admin_sessions (user_id, session_token, expires_at)
      VALUES (${userId}, ${sessionToken}, ${expiresAt.toISOString()})
      RETURNING id, user_id, session_token, expires_at, created_at
    `;
    return result[0] as AdminSession;
  } catch (error) {
    console.error("Error creating admin session:", error);
    return null;
  }
}

export async function getAdminSessionByToken(
  sessionToken: string,
): Promise<AdminSession | null> {
  try {
    const sql = createConnection();
    const result = await sql`
      SELECT id, user_id, session_token, expires_at, created_at
      FROM admin_sessions
      WHERE session_token = ${sessionToken} AND expires_at > NOW()
      LIMIT 1
    `;
    return (result[0] as AdminSession) || null;
  } catch (error) {
    console.error("Error fetching admin session:", error);
    return null;
  }
}

export async function deleteAdminSession(
  sessionToken: string,
): Promise<boolean> {
  try {
    const sql = createConnection();
    await sql`
      DELETE FROM admin_sessions
      WHERE session_token = ${sessionToken}
    `;
    return true;
  } catch (error) {
    console.error("Error deleting admin session:", error);
    return false;
  }
}

export async function cleanupExpiredSessions(): Promise<boolean> {
  try {
    const sql = createConnection();
    await sql`
      DELETE FROM admin_sessions
      WHERE expires_at <= NOW()
    `;
    return true;
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error);
    return false;
  }
}

// Action Items CRUD operations
export async function getActionItems(clientId: string): Promise<ActionItem[]> {
  try {
    const sql = createConnection();
    const result = await sql`
      SELECT id, client_id, title, status, due_date, created_at, updated_at
      FROM action_items
      WHERE client_id = ${clientId}
      ORDER BY created_at ASC
    `;
    return result as ActionItem[];
  } catch (error) {
    console.error("Error fetching action items:", error);
    return [];
  }
}

export async function createActionItem(
  clientId: string,
  title: string,
  status: "on-track" | "off-track" = "on-track",
  dueDate?: string,
): Promise<ActionItem | null> {
  try {
    const sql = createConnection();
    const result = await sql`
      INSERT INTO action_items (client_id, title, status, due_date)
      VALUES (${clientId}, ${title}, ${status}, ${dueDate || null})
      RETURNING id, client_id, title, status, due_date, created_at, updated_at
    `;
    return result[0] as ActionItem;
  } catch (error) {
    console.error("Error creating action item:", error);
    return null;
  }
}

export async function updateActionItem(
  actionItemId: string,
  updates: {
    title?: string;
    status?: "on-track" | "off-track";
    due_date?: string | null;
  },
): Promise<ActionItem | null> {
  try {
    const sql = createConnection();

    // Build update query dynamically
    if (
      updates.title !== undefined &&
      updates.status !== undefined &&
      updates.due_date !== undefined
    ) {
      const result = await sql`
        UPDATE action_items
        SET title = ${updates.title}, status = ${updates.status}, due_date = ${updates.due_date}, updated_at = NOW()
        WHERE id = ${actionItemId}
        RETURNING id, client_id, title, status, due_date, created_at, updated_at
      `;
      return (result[0] as ActionItem) || null;
    } else if (updates.title !== undefined && updates.status !== undefined) {
      const result = await sql`
        UPDATE action_items
        SET title = ${updates.title}, status = ${updates.status}, updated_at = NOW()
        WHERE id = ${actionItemId}
        RETURNING id, client_id, title, status, due_date, created_at, updated_at
      `;
      return (result[0] as ActionItem) || null;
    } else if (updates.title !== undefined && updates.due_date !== undefined) {
      const result = await sql`
        UPDATE action_items
        SET title = ${updates.title}, due_date = ${updates.due_date}, updated_at = NOW()
        WHERE id = ${actionItemId}
        RETURNING id, client_id, title, status, due_date, created_at, updated_at
      `;
      return (result[0] as ActionItem) || null;
    } else if (updates.status !== undefined && updates.due_date !== undefined) {
      const result = await sql`
        UPDATE action_items
        SET status = ${updates.status}, due_date = ${updates.due_date}, updated_at = NOW()
        WHERE id = ${actionItemId}
        RETURNING id, client_id, title, status, due_date, created_at, updated_at
      `;
      return (result[0] as ActionItem) || null;
    } else if (updates.title !== undefined) {
      const result = await sql`
        UPDATE action_items
        SET title = ${updates.title}, updated_at = NOW()
        WHERE id = ${actionItemId}
        RETURNING id, client_id, title, status, due_date, created_at, updated_at
      `;
      return (result[0] as ActionItem) || null;
    } else if (updates.status !== undefined) {
      const result = await sql`
        UPDATE action_items
        SET status = ${updates.status}, updated_at = NOW()
        WHERE id = ${actionItemId}
        RETURNING id, client_id, title, status, due_date, created_at, updated_at
      `;
      return (result[0] as ActionItem) || null;
    } else if (updates.due_date !== undefined) {
      const result = await sql`
        UPDATE action_items
        SET due_date = ${updates.due_date}, updated_at = NOW()
        WHERE id = ${actionItemId}
        RETURNING id, client_id, title, status, due_date, created_at, updated_at
      `;
      return (result[0] as ActionItem) || null;
    } else {
      throw new Error("No updates provided");
    }
  } catch (error) {
    console.error("Error updating action item:", error);
    return null;
  }
}

export async function deleteActionItem(actionItemId: string): Promise<boolean> {
  try {
    const sql = createConnection();
    await sql`
      DELETE FROM action_items
      WHERE id = ${actionItemId}
    `;
    return true;
  } catch (error) {
    console.error("Error deleting action item:", error);
    return false;
  }
}

// Feature management
export async function getClientFeatures(
  clientId: string,
): Promise<ClientFeature[]> {
  try {
    const sql = createConnection();
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
    const sql = createConnection();
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
