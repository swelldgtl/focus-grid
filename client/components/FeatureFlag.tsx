import React from "react";
import {
  useFeatureFlag,
  useClientConfig,
  type ClientConfig,
} from "@/hooks/use-client-config";

interface FeatureFlagProps {
  feature: keyof ClientConfig["features"];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  clientId?: string;
}

/**
 * Wrapper component that conditionally renders children based on feature flag
 */
export function FeatureFlag({
  feature,
  children,
  fallback = null,
  clientId,
}: FeatureFlagProps) {
  const isEnabled = useFeatureFlag(feature, clientId);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Specific feature flag components for better type safety and readability
 */
export function LongTermGoalsFeature({
  children,
  fallback,
  clientId,
}: Omit<FeatureFlagProps, "feature">) {
  return (
    <FeatureFlag
      feature="long_term_goals"
      fallback={fallback}
      clientId={clientId}
    >
      {children}
    </FeatureFlag>
  );
}

export function ActionPlanFeature({
  children,
  fallback,
  clientId,
}: Omit<FeatureFlagProps, "feature">) {
  return (
    <FeatureFlag feature="action_plan" fallback={fallback} clientId={clientId}>
      {children}
    </FeatureFlag>
  );
}

export function BlockersIssuesFeature({
  children,
  fallback,
  clientId,
}: Omit<FeatureFlagProps, "feature">) {
  return (
    <FeatureFlag
      feature="blockers_issues"
      fallback={fallback}
      clientId={clientId}
    >
      {children}
    </FeatureFlag>
  );
}

export function AgendaFeature({
  children,
  fallback,
  clientId,
}: Omit<FeatureFlagProps, "feature">) {
  return (
    <FeatureFlag feature="agenda" fallback={fallback} clientId={clientId}>
      {children}
    </FeatureFlag>
  );
}

export function GoalsProgressFeature({
  children,
  fallback,
  clientId,
}: Omit<FeatureFlagProps, "feature">) {
  return (
    <FeatureFlag feature="goals_progress" fallback={fallback} clientId={clientId}>
      {children}
    </FeatureFlag>
  );
}

/**
 * Component to display client configuration status
 */
export function ClientConfigStatus({ clientId }: { clientId?: string }) {
  const { config, loading, error } = useClientConfig(clientId);

  if (loading) {
    return (
      <div className="text-xs text-muted-foreground">
        Loading configuration...
      </div>
    );
  }

  if (error) {
    return <div className="text-xs text-red-600">Config error: {error}</div>;
  }

  if (!config) {
    return (
      <div className="text-xs text-muted-foreground">
        No configuration loaded
      </div>
    );
  }

  const enabledFeatures = Object.entries(config.features).filter(
    ([_, enabled]) => enabled,
  ).length;

  return (
    <div className="text-xs text-muted-foreground">
      {config.name} - {enabledFeatures}/5 features enabled
    </div>
  );
}
