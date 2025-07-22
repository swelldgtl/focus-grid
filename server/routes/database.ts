import { RequestHandler } from "express";

export const handleDatabaseTest: RequestHandler = async (req, res) => {
  try {
    // Import database functions from server-side utilities
    const { testConnection, getClients, AVAILABLE_FEATURES } = await import("../lib/database");

    // Test basic database connection
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      return res.status(500).json({
        error: 'Database connection failed',
        details: connectionTest.error
      });
    }

    // Get existing clients
    const clients = await getClients();

    return res.status(200).json({
      message: 'Database connection successful',
      connectionTime: connectionTest.data?.[0]?.current_time,
      clientsCount: clients.length,
      clients: clients,
      availableFeatures: Object.values(AVAILABLE_FEATURES),
    });

  } catch (error) {
    console.error('Database test error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleClientConfig: RequestHandler = async (req, res) => {
  try {
    // Import database functions from server-side utilities
    const { getClientConfig } = await import("../lib/database");

    // Get client ID from query params or environment
    const clientId = req.query.clientId as string || process.env.CLIENT_ID;

    if (!clientId) {
      return res.status(400).json({
        error: 'Client ID is required'
      });
    }

    const config = await getClientConfig(clientId);

    if (!config) {
      return res.status(404).json({
        error: 'Client not found'
      });
    }

    return res.status(200).json(config);

  } catch (error) {
    console.error('Config API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
