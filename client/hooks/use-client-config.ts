import React, { useState, useEffect } from "react";
import {
  getFallbackConfig,
  getDefaultFallbackConfig,
} from "@/lib/fallback-configs";

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

      // Check URL parameters first, then subdomain, then provided clientId
      const urlParams = new URLSearchParams(window.location.search);
      const urlClientId = urlParams.get("clientId");

      // Try to detect client from subdomain (e.g., erc.swellfocusgrid.com -> "erc")
      let subdomainClientId = null;
      const hostname = window.location.hostname;
      if (
        hostname.includes(".swellfocusgrid.com") &&
        !hostname.startsWith("www.")
      ) {
        const subdomain = hostname.split(".")[0];
        // Map subdomain to client ID based on slug
        const subdomainToClientId: Record<string, string> = {
          demo: "8323e82d-075a-496d-8861-a86d862a67bc",
          bluelabelpackaging: "fbf03fbc-bf81-462b-a88f-668dfcb09acc",
          "blue-label-packaging": "fbf03fbc-bf81-462b-a88f-668dfcb09acc",
          erc: "360e6a09-c7e2-447e-8dbc-cebae72f1ff2",
        };
        subdomainClientId = subdomainToClientId[subdomain];
      }

      // Priority order: URL param > subdomain > provided clientId
      const targetClientId = urlClientId || subdomainClientId || clientId;

      const queryParams = targetClientId ? `?clientId=${targetClientId}` : "";
      const url = `/api/config${queryParams}`;
      console.log("Fetching config from:", url, "for client:", targetClientId);

      const response = await fetch(url);
      console.log("Config response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Config API error response:", errorText);

        if (response.status === 404) {
          throw new Error("Client not found");
        }
        if (response.status === 500 && errorText.includes("DATABASE_URL")) {
          throw new Error(
            "Database connection failed - check environment variables",
          );
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Config data received:", data);
      setConfig(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load client configuration";
      setError(errorMessage);
      console.error("Error loading client config:", err);

      // Try fallback configuration
      const fallbackConfig = targetClientId
        ? getFallbackConfig(targetClientId)
        : getDefaultFallbackConfig();
      if (fallbackConfig) {
        console.log("Using fallback configuration for client:", targetClientId);
        setConfig(fallbackConfig);
        setError(errorMessage + " (using fallback)");
      }
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchConfig();
  };

  useEffect(() => {
    // Detect client from multiple sources with priority order
    const urlParams = new URLSearchParams(window.location.search);
    const urlClientId = urlParams.get("clientId");

    // Detect client from subdomain (highest priority)
    let subdomainClientId = null;
    const hostname = window.location.hostname;
    if (
      hostname.includes(".swellfocusgrid.com") &&
      !hostname.startsWith("www.")
    ) {
      const subdomain = hostname.split(".")[0];
      const subdomainToClientId: Record<string, string> = {
        demo: "8323e82d-075a-496d-8861-a86d862a67bc",
        bluelabelpackaging: "fbf03fbc-bf81-462b-a88f-668dfcb09acc",
        "blue-label-packaging": "fbf03fbc-bf81-462b-a88f-668dfcb09acc",
        erc: "360e6a09-c7e2-447e-8dbc-cebae72f1ff2",
      };
      subdomainClientId = subdomainToClientId[subdomain];
    }

    // Priority order: URL param > subdomain > provided clientId > default
    const targetClientId = urlClientId || subdomainClientId || clientId;

    // Only load fallback if we have a specific client ID
    // This prevents showing "Demo Client" when we should show a specific client
    if (targetClientId) {
      const fallbackConfig = getFallbackConfig(targetClientId);
      if (fallbackConfig) {
        console.log(
          "Loading fallback configuration immediately for:",
          targetClientId,
        );
        setConfig(fallbackConfig);
        setLoading(false);
      }
    } else {
      // If no specific client is detected, use default but keep loading state
      const fallbackConfig = getDefaultFallbackConfig();
      setConfig(fallbackConfig);
      setLoading(false);
    }

    // Then try to fetch from API (will override fallback if successful)
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
export function useFeatureFlag(
  featureName: keyof ClientConfig["features"],
  clientId?: string,
): boolean {
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
