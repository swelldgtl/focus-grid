import { RequestHandler } from "express";

export const handleFeatureToggle: RequestHandler = async (req, res) => {
  try {
    // Import database functions
    const { updateClientFeature, getClientConfig, AVAILABLE_FEATURES } = await import("../lib/database");
    
    const { clientId, feature, enabled } = req.body;
    
    if (!clientId || !feature || typeof enabled !== 'boolean') {
      return res.status(400).json({
        error: 'clientId, feature, and enabled (boolean) are required'
      });
    }

    // Validate feature name
    const validFeatures = Object.values(AVAILABLE_FEATURES);
    if (!validFeatures.includes(feature)) {
      return res.status(400).json({
        error: `Invalid feature. Valid features: ${validFeatures.join(', ')}`
      });
    }

    // Update the feature
    const success = await updateClientFeature(clientId, feature, enabled);
    
    if (!success) {
      return res.status(500).json({
        error: 'Failed to update feature'
      });
    }

    // Return updated config
    const updatedConfig = await getClientConfig(clientId);
    
    return res.status(200).json({
      message: `Feature ${feature} ${enabled ? 'enabled' : 'disabled'} for client ${clientId}`,
      config: updatedConfig
    });

  } catch (error) {
    console.error('Feature toggle error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleGetFeatures: RequestHandler = async (req, res) => {
  try {
    // Import database functions
    const { AVAILABLE_FEATURES } = await import("../lib/database");
    
    return res.status(200).json({
      availableFeatures: Object.values(AVAILABLE_FEATURES),
      featureDescriptions: {
        long_term_goals: "Long-Term Goals module with accordion functionality",
        action_plan: "Action Plan module with status tracking",
        blockers_issues: "Blockers & Issues module for tracking impediments",
        agenda: "Agenda module for meeting items",
        focus_mode: "Focus mode with timers and module dimming"
      }
    });

  } catch (error) {
    console.error('Get features error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
