import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Settings, Save, Database, Globe } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    apiUrl: "/.netlify/functions/api",
    defaultDomain: "swellfocusgrid.com",
    maxClients: "100",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">System Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure system-wide settings and preferences
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Configure API endpoints and connection settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="api-url">API Base URL</Label>
              <Input
                id="api-url"
                value={settings.apiUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, apiUrl: e.target.value }))}
                placeholder="/.netlify/functions/api"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Domain Configuration
            </CardTitle>
            <CardDescription>
              Configure domain settings for client subdomains
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="default-domain">Default Domain</Label>
              <Input
                id="default-domain"
                value={settings.defaultDomain}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultDomain: e.target.value }))}
                placeholder="swellfocusgrid.com"
              />
            </div>
            <div>
              <Label htmlFor="max-clients">Maximum Clients</Label>
              <Input
                id="max-clients"
                type="number"
                value={settings.maxClients}
                onChange={(e) => setSettings(prev => ({ ...prev, maxClients: e.target.value }))}
                placeholder="100"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Actions
            </CardTitle>
            <CardDescription>
              Perform system maintenance tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? (
                <Settings className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
