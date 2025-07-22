import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, RefreshCw } from 'lucide-react';
import { useClientConfig } from '@/hooks/use-client-config';

interface FeatureAdminProps {
  clientId?: string;
}

export default function FeatureAdmin({ clientId }: FeatureAdminProps) {
  const { config, loading, refetch } = useClientConfig(clientId);
  const [updating, setUpdating] = useState<string | null>(null);

  const toggleFeature = async (feature: string, enabled: boolean) => {
    if (!config) return;

    console.log('Toggling feature:', feature, 'to:', enabled);
    setUpdating(feature);

    try {
      const payload = {
        clientId: config.clientId,
        feature,
        enabled
      };
      console.log('Sending payload:', payload);

      const response = await fetch('/api/features/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Toggle response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Toggle success:', result);
        // Refresh the configuration
        refetch();
      } else {
        const errorText = await response.text();
        console.error('Toggle failed:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText };
        }
        alert(`Failed to toggle feature: ${error.error || errorText}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error occurred: ' + (error instanceof Error ? error.message : 'Unknown'));
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feature Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Loading configuration...
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="w-full mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feature Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 mb-2">
            Failed to load configuration
          </div>
          {error && (
            <div className="text-xs text-muted-foreground mb-2">
              Error: {error}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="w-full"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const featureLabels = {
    long_term_goals: 'Long-Term Goals',
    action_plan: 'Action Plan',
    blockers_issues: 'Blockers & Issues',
    agenda: 'Agenda',
    focus_mode: 'Focus Mode'
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feature Admin
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Client: {config.name}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(config.features).map(([feature, enabled]) => (
          <div key={feature} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {featureLabels[feature as keyof typeof featureLabels] || feature}
              </span>
              <Badge variant={enabled ? "default" : "secondary"}>
                {enabled ? "ON" : "OFF"}
              </Badge>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={(checked) => toggleFeature(feature, checked)}
              disabled={updating === feature}
            />
          </div>
        ))}
        
        <div className="pt-2 border-t text-xs text-muted-foreground">
          Changes take effect immediately
        </div>
      </CardContent>
    </Card>
  );
}
