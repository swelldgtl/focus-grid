import React, { useState, useEffect } from 'react';

export interface ClientConfig {
  clientId: string;
  name: string;
  slug: string;
  features: {
    long_term_goals: boolean;
    action_plan: boolean;
    blockers_issues: boolean;
    agenda: boolean;
    focus_mode: boolean;
  };
  branding: {
    primaryColor: string;
  };
}

export interface UseClientConfigResult {
  config: ClientConfig | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to load client configuration and feature flags from the database
 */
export function useClientConfig(clientId?: string): UseClientConfigResult {
  const [config, setConfig] = useState<ClientConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use provided clientId or fall back to environment default
      const queryParams = clientId ? `?clientId=${clientId}` : '';
      const url = `/api/config${queryParams}`;
      console.log('Fetching config from:', url);

      const response = await fetch(url);
      console.log('Config response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Config API error response:', errorText);

        if (response.status === 404) {
          throw new Error('Client not found');
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Config data received:', data);
      setConfig(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load client configuration';
      setError(errorMessage);
      console.error('Error loading client config:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchConfig();
  };

  useEffect(() => {
    fetchConfig();
  }, [clientId]);

  return {
    config,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeatureFlag(featureName: keyof ClientConfig['features'], clientId?: string): boolean {
  const { config } = useClientConfig(clientId);
  
  // Default to true if config is not loaded yet (prevents flickering)
  return config?.features[featureName] ?? true;
}

/**
 * Hook to get all enabled features
 */
export function useEnabledFeatures(clientId?: string): string[] {
  const { config } = useClientConfig(clientId);
  
  if (!config) return [];
  
  return Object.entries(config.features)
    .filter(([_, enabled]) => enabled)
    .map(([feature, _]) => feature);
}
