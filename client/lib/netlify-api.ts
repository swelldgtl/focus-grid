// Netlify project automation utilities

export interface NetlifyProjectCreationResult {
  success: boolean;
  projectId?: string;
  siteId?: string;
  error?: string;
  primaryUrl?: string;
  branchUrl?: string;
}

export interface ClientNetlifyConfig {
  clientId: string;
  clientName: string;
  subdomain: string;
  databaseUrl: string;
}

// Create a new Netlify project for a client
export async function createNetlifyProject(config: ClientNetlifyConfig): Promise<NetlifyProjectCreationResult> {
  try {
    const response = await fetch('/.netlify/functions/netlify-automation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create-project',
        ...config,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: result.success,
      projectId: result.projectId,
      siteId: result.siteId,
      primaryUrl: result.primaryUrl,
      branchUrl: result.branchUrl,
      error: result.error,
    };
  } catch (error) {
    console.error('Error creating Netlify project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Set environment variables for a Netlify project
export async function setNetlifyEnvironmentVariables(
  siteId: string,
  variables: Record<string, string>
): Promise<boolean> {
  try {
    const response = await fetch('/.netlify/functions/netlify-automation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'set-env-vars',
        siteId,
        variables,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error setting environment variables:', error);
    return false;
  }
}

// Deploy a Netlify project
export async function deployNetlifyProject(siteId: string): Promise<boolean> {
  try {
    const response = await fetch('/.netlify/functions/netlify-automation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'deploy',
        siteId,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error deploying project:', error);
    return false;
  }
}

// Delete a Netlify project
export async function deleteNetlifyProject(subdomain: string): Promise<boolean> {
  try {
    console.log(`Attempting to delete Netlify project for subdomain: ${subdomain}`);

    const response = await fetch('/.netlify/functions/netlify-automation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete-project',
        subdomain,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`Netlify deletion failed (${response.status}):`, errorData);
      return false;
    }

    const result = await response.json();
    console.log('Netlify deletion result:', result);
    return result.success !== false;
  } catch (error) {
    console.error('Error deleting Netlify project:', error);
    return false;
  }
}
