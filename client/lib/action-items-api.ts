// Action Items API functions

export interface ActionItem {
  id: string;
  client_id: string;
  title: string;
  status: "on-track" | "off-track";
  due_date?: string; // ISO date string
  created_at: string;
  updated_at: string;
}

export interface CreateActionItemData {
  title: string;
  status?: "on-track" | "off-track";
  dueDate?: string;
}

export interface UpdateActionItemData {
  title?: string;
  status?: "on-track" | "off-track";
  dueDate?: string | null;
}

// Get all action items for a client
export async function getActionItems(clientId: string): Promise<ActionItem[]> {
  try {
    const response = await fetch(`/api/clients/${clientId}/action-items`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.actionItems || [];
  } catch (error) {
    console.error("Error fetching action items:", error);
    return [];
  }
}

// Create a new action item
export async function createActionItem(
  clientId: string,
  actionItemData: CreateActionItemData,
): Promise<ActionItem | null> {
  try {
    const response = await fetch(`/api/clients/${clientId}/action-items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(actionItemData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.actionItem;
  } catch (error) {
    console.error("Error creating action item:", error);
    return null;
  }
}

// Update an action item
export async function updateActionItem(
  actionItemId: string,
  updates: UpdateActionItemData,
): Promise<ActionItem | null> {
  try {
    const response = await fetch(`/api/action-items/${actionItemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.actionItem;
  } catch (error) {
    console.error("Error updating action item:", error);
    return null;
  }
}

// Delete an action item
export async function deleteActionItem(actionItemId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/action-items/${actionItemId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Error deleting action item:", error);
    return false;
  }
}
