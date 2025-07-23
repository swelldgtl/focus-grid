import { RequestHandler } from "express";

// Get action items for a specific client
export const handleGetActionItems: RequestHandler = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        error: "Client ID is required",
      });
    }

    const { getActionItems } = await import("../lib/database");
    const actionItems = await getActionItems(clientId);

    return res.status(200).json({ actionItems });
  } catch (error) {
    console.error("Get action items error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create a new action item
export const handleCreateActionItem: RequestHandler = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { title, status, dueDate } = req.body;

    if (!clientId) {
      return res.status(400).json({
        error: "Client ID is required",
      });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        error: "Title is required",
      });
    }

    const { createActionItem } = await import("../lib/database");
    const actionItem = await createActionItem(
      clientId,
      title.trim(),
      status || "on-track",
      dueDate,
    );

    if (!actionItem) {
      return res.status(500).json({
        error: "Failed to create action item",
      });
    }

    return res.status(201).json({ actionItem });
  } catch (error) {
    console.error("Create action item error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update an action item
export const handleUpdateActionItem: RequestHandler = async (req, res) => {
  try {
    const { actionItemId } = req.params;
    const { title, status, dueDate } = req.body;

    if (!actionItemId) {
      return res.status(400).json({
        error: "Action item ID is required",
      });
    }

    const updates: {
      title?: string;
      status?: "on-track" | "off-track";
      due_date?: string | null;
    } = {};

    if (title !== undefined) {
      if (title.trim().length === 0) {
        return res.status(400).json({
          error: "Title cannot be empty",
        });
      }
      updates.title = title.trim();
    }

    if (status !== undefined) {
      if (!["on-track", "off-track"].includes(status)) {
        return res.status(400).json({
          error: "Status must be 'on-track' or 'off-track'",
        });
      }
      updates.status = status;
    }

    if (dueDate !== undefined) {
      updates.due_date = dueDate || null;
    }

    const { updateActionItem } = await import("../lib/database");
    const actionItem = await updateActionItem(actionItemId, updates);

    if (!actionItem) {
      return res.status(404).json({
        error: "Action item not found or update failed",
      });
    }

    return res.status(200).json({ actionItem });
  } catch (error) {
    console.error("Update action item error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete an action item
export const handleDeleteActionItem: RequestHandler = async (req, res) => {
  try {
    const { actionItemId } = req.params;

    if (!actionItemId) {
      return res.status(400).json({
        error: "Action item ID is required",
      });
    }

    const { deleteActionItem } = await import("../lib/database");
    const success = await deleteActionItem(actionItemId);

    if (!success) {
      return res.status(404).json({
        error: "Action item not found or delete failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Action item deleted successfully",
    });
  } catch (error) {
    console.error("Delete action item error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
