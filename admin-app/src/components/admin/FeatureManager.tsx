import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Flag, Save } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

interface FeatureConfig {
  long_term_goals: boolean;
  action_plan: boolean;
  blockers_issues: boolean;
  agenda: boolean;
  focus_mode: boolean;
}

const DEFAULT_FEATURES: FeatureConfig = {
  long_term_goals: true,
  action_plan: true,
  blockers_issues: true,
  agenda: true,
  focus_mode: true,
};

const FEATURE_LABELS = {
  long_term_goals: "Long Term Goals",
  action_plan: "Action Plan",
  blockers_issues: "Blockers & Issues",
  agenda: "Agenda",
  focus_mode: "Focus Mode",
};

export default function FeatureManager() {
  const [features, setFeatures] = useState<FeatureConfig>(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFeatureToggle = (key: keyof FeatureConfig) => {
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Feature configuration saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save feature configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Default Features</h3>
        <p className="text-sm text-muted-foreground">
          Configure which features are enabled by default for new clients
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Feature Flags
          </CardTitle>
          <CardDescription>
            Toggle features on or off for the default configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(FEATURE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="text-sm font-medium">
                {label}
              </Label>
              <Switch
                id={key}
                checked={features[key as keyof FeatureConfig]}
                onCheckedChange={() => handleFeatureToggle(key as keyof FeatureConfig)}
              />
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? (
                <Flag className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
