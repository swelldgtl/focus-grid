import { RequestHandler } from "express";

export const handleDatabaseTest: RequestHandler = async (req, res) => {
  try {
    // Import database functions from server-side utilities
    const { testConnection, getClients, AVAILABLE_FEATURES } = await import(
      "../lib/database"
    );

    // Test basic database connection
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      return res.status(500).json({
        error: "Database connection failed",
        details: connectionTest.error,
      });
    }

    // Get existing clients
    const clients = await getClients();

    return res.status(200).json({
      message: "Database connection successful",
      connectionTime: connectionTest.data?.[0]?.current_time,
      clientsCount: clients.length,
      clients: clients,
      availableFeatures: Object.values(AVAILABLE_FEATURES),
    });
  } catch (error) {
    console.error("Database test error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleClientConfig: RequestHandler = async (req, res) => {
  try {
    // Import database functions from server-side utilities
    const { getClientConfig } = await import("../lib/database");

    // Get client ID from query params or environment
    const clientId = (req.query.clientId as string) || process.env.CLIENT_ID;

    if (!clientId) {
      return res.status(400).json({
        error: "Client ID is required",
      });
    }

    const config = await getClientConfig(clientId);

    if (!config) {
      return res.status(404).json({
        error: "Client not found",
      });
    }

    return res.status(200).json(config);
  } catch (error) {
    console.error("Config API error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetClients: RequestHandler = async (req, res) => {
  try {
    const { getClients } = await import("../lib/database");
    const clients = await getClients();
    return res.status(200).json({ clients });
  } catch (error) {
    console.error("Get clients error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleCreateClient: RequestHandler = async (req, res) => {
  try {
    const { createClient, getClient, updateClientFeature, AVAILABLE_FEATURES } =
      await import("../lib/database");
    const { getCurrentFeatureDefaults } = await import("./admin");
    const { name, slug, subdomain } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        error: "Name and slug are required",
      });
    }

    // Check for duplicates
    const existingClient = await getClient(slug);
    if (existingClient) {
      return res.status(409).json({
        error: "Client with this slug already exists",
      });
    }

    const newClient = await createClient({ name, slug, subdomain });

    if (!newClient) {
      return res.status(500).json({
        error: "Failed to create client",
      });
    }

    // Apply feature defaults from admin settings
    const featureDefaults = getCurrentFeatureDefaults();

    // Set up features based on admin defaults
    await updateClientFeature(
      newClient.id,
      AVAILABLE_FEATURES.LONG_TERM_GOALS,
      featureDefaults.long_term_goals,
    );
    await updateClientFeature(
      newClient.id,
      AVAILABLE_FEATURES.ACTION_PLAN,
      featureDefaults.action_plan,
    );
    await updateClientFeature(
      newClient.id,
      AVAILABLE_FEATURES.BLOCKERS_ISSUES,
      featureDefaults.blockers_issues,
    );
    await updateClientFeature(
      newClient.id,
      AVAILABLE_FEATURES.AGENDA,
      featureDefaults.agenda,
    );
    await updateClientFeature(
      newClient.id,
      AVAILABLE_FEATURES.GOALS_PROGRESS,
      featureDefaults.goals_progress,
    );

    return res.status(201).json({ client: newClient });
  } catch (error) {
    console.error("Create client error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleUpdateClient: RequestHandler = async (req, res) => {
  try {
    const { updateClient, getClient } = await import("../lib/database");
    const { clientId } = req.params;
    const { name, slug, subdomain } = req.body;

    if (!clientId) {
      return res.status(400).json({
        error: "Client ID is required",
      });
    }

    if (!name || !slug) {
      return res.status(400).json({
        error: "Name and slug are required",
      });
    }

    // Check if slug is being changed and if it conflicts with another client
    const existingClient = await getClient(clientId);
    if (!existingClient) {
      return res.status(404).json({
        error: "Client not found",
      });
    }

    if (slug !== existingClient.slug) {
      const conflictClient = await getClient(slug);
      if (conflictClient && conflictClient.id !== clientId) {
        return res.status(409).json({
          error: "Client with this slug already exists",
        });
      }
    }

    const updatedClient = await updateClient(clientId, {
      name,
      slug,
      subdomain,
    });

    if (!updatedClient) {
      return res.status(500).json({
        error: "Failed to update client",
      });
    }

    return res.status(200).json({ client: updatedClient });
  } catch (error) {
    console.error("Update client error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleUpdateClientFeatures: RequestHandler = async (req, res) => {
  try {
    const { updateClientFeature, AVAILABLE_FEATURES } = await import(
      "../lib/database"
    );
    const { clientId } = req.params;
    const { features } = req.body;

    if (!clientId) {
      return res.status(400).json({
        error: "Client ID is required",
      });
    }

    if (!features || typeof features !== "object") {
      return res.status(400).json({
        error: "Features object is required",
      });
    }

    try {
      // Update each feature
      const featureMap = {
        long_term_goals: AVAILABLE_FEATURES.LONG_TERM_GOALS,
        action_plan: AVAILABLE_FEATURES.ACTION_PLAN,
        blockers_issues: AVAILABLE_FEATURES.BLOCKERS_ISSUES,
        agenda: AVAILABLE_FEATURES.AGENDA,
        goals_progress: AVAILABLE_FEATURES.GOALS_PROGRESS,
      };

      for (const [featureKey, enabled] of Object.entries(features)) {
        if (featureKey in featureMap) {
          await updateClientFeature(
            clientId,
            featureMap[featureKey as keyof typeof featureMap],
            Boolean(enabled),
          );
        }
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Update client features error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleDeleteClient: RequestHandler = async (req, res) => {
  try {
    const { deleteClient } = await import("../lib/database");
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        error: "Client ID is required",
      });
    }

    const success = await deleteClient(clientId);

    if (!success) {
      return res.status(404).json({
        error: "Client not found or could not be deleted",
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete client error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
