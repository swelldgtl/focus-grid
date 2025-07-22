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
    const response = await fetch('/api/netlify/create-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      projectId: result.projectId,
      siteId: result.siteId,
      primaryUrl: result.primaryUrl,
      branchUrl: result.branchUrl,
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
    const response = await fetch('/api/netlify/set-env-vars', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ siteId, variables }),
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
    const response = await fetch('/api/netlify/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ siteId }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error deploying project:', error);
    return false;
  }
}
