import { RequestHandler } from "express";

interface SystemConfig {
  database: {
    url: string;
    poolSize: number;
    connectionTimeout: number;
    backupEnabled: boolean;
    backupFrequency: string;
  };
  netlify: {
    teamSlug: string;
    defaultBuildCommand: string;
    defaultPublishDir: string;
    apiKeyConfigured: boolean;
  };
  environment: {
    globalVars: Record<string, string>;
    defaultClientVars: Record<string, string>;
  };
}

interface FeatureDefaults {
  long_term_goals: boolean;
  action_plan: boolean;
  blockers_issues: boolean;
  agenda: boolean;
  goals_progress: boolean;
}

// Mock storage for demo purposes - in production, this would be stored in database
let systemConfig: SystemConfig = {
  database: {
    url: process.env.DATABASE_URL || "",
    poolSize: 10,
    connectionTimeout: 5000,
    backupEnabled: true,
    backupFrequency: "daily",
  },
  netlify: {
    teamSlug: "swelldgtl",
    defaultBuildCommand: "npm run build",
    defaultPublishDir: "dist",
    apiKeyConfigured: !!process.env.NETLIFY_API_TOKEN,
  },
  environment: {
    globalVars: {},
    defaultClientVars: {
      NEXT_PUBLIC_CLIENT_NAME: "",
      NEXT_PUBLIC_CLIENT_SUBDOMAIN: "",
      CLIENT_ID: "",
      DATABASE_URL: process.env.DATABASE_URL || "",
    },
  },
};

let featureDefaults: FeatureDefaults = {
  long_term_goals: true,
  action_plan: true,
  blockers_issues: true,
  agenda: true,
  goals_progress: true,
};

export const handleGetSystemConfig: RequestHandler = async (req, res) => {
  try {
    // Mask sensitive information
    const safeConfig = {
      ...systemConfig,
      database: {
        ...systemConfig.database,
        url: systemConfig.database.url ? "***masked***" : "",
      },
    };

    return res.status(200).json(safeConfig);
  } catch (error) {
    console.error("Get system config error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleUpdateSystemConfig: RequestHandler = async (req, res) => {
  try {
    const updates = req.body as Partial<SystemConfig>;

    // Validate required fields
    if (updates.database?.poolSize && updates.database.poolSize < 1) {
      return res.status(400).json({
        error: "Pool size must be at least 1",
      });
    }

    if (
      updates.database?.connectionTimeout &&
      updates.database.connectionTimeout < 1000
    ) {
      return res.status(400).json({
        error: "Connection timeout must be at least 1000ms",
      });
    }

    // Update configuration
    systemConfig = {
      ...systemConfig,
      ...updates,
      database: {
        ...systemConfig.database,
        ...updates.database,
      },
      netlify: {
        ...systemConfig.netlify,
        ...updates.netlify,
      },
      environment: {
        ...systemConfig.environment,
        ...updates.environment,
      },
    };

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Update system config error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetFeatureDefaults: RequestHandler = async (req, res) => {
  try {
    return res.status(200).json(featureDefaults);
  } catch (error) {
    console.error("Get feature defaults error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleUpdateFeatureDefaults: RequestHandler = async (req, res) => {
  try {
    const updates = req.body as Partial<FeatureDefaults>;

    // Validate that all provided features are valid
    const validFeatures = [
      "long_term_goals",
      "action_plan",
      "blockers_issues",
      "agenda",
      "goals_progress",
    ];
    for (const key of Object.keys(updates)) {
      if (!validFeatures.includes(key)) {
        return res.status(400).json({
          error: `Invalid feature: ${key}`,
        });
      }
    }

    // Update feature defaults
    featureDefaults = {
      ...featureDefaults,
      ...updates,
    };

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Update feature defaults error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleSystemHealth: RequestHandler = async (req, res) => {
  try {
    // Import database functions to test health
    const { testConnection } = await import("../lib/database");

    // Test database connection
    const dbHealth = await testConnection();

    // Mock Netlify health check
    const netlifyHealth = {
      status: "connected",
      teamId: "687968df109255a75fd649db",
      lastChecked: new Date().toISOString(),
    };

    const health = {
      database: {
        status: dbHealth.success ? "connected" : "error",
        connectionTime: dbHealth.success ? 50 : null,
        lastChecked: new Date().toISOString(),
      },
      netlify: netlifyHealth,
      overall: dbHealth.success ? "healthy" : "warning",
    };

    return res.status(200).json(health);
  } catch (error) {
    console.error("System health check error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Export current feature defaults for use in client creation
export function getCurrentFeatureDefaults(): FeatureDefaults {
  return { ...featureDefaults };
}

// Export current system config for use in other modules
export function getCurrentSystemConfig(): SystemConfig {
  return { ...systemConfig };
}
