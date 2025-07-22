import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Database,
  Globe,
  Settings2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Save,
  RefreshCw,
  Server,
  Zap,
  Shield,
  Monitor,
  Code,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

interface SystemHealth {
  database: {
    status: 'connected' | 'disconnected' | 'error';
    connectionTime?: number;
    lastChecked: string;
  };
  netlify: {
    status: 'connected' | 'disconnected' | 'error';
    teamId?: string;
    lastChecked: string;
  };
  overall: 'healthy' | 'warning' | 'critical';
}

interface SystemConfig {
  database: {
    url: string;
    poolSize: number;
    connectionTimeout: number;
    backupEnabled: boolean;
    backupFrequency: string;
  };
  netlify: {
    teamSlug: string;
    defaultBuildCommand: string;
    defaultPublishDir: string;
    apiKeyConfigured: boolean;
  };
  environment: {
    globalVars: Record<string, string>;
    defaultClientVars: Record<string, string>;
  };
}

interface FeatureDefaults {
  long_term_goals: boolean;
  action_plan: boolean;
  blockers_issues: boolean;
  agenda: boolean;
  focus_mode: boolean;
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("system");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: { status: 'disconnected', lastChecked: '' },
    netlify: { status: 'disconnected', lastChecked: '' },
    overall: 'critical'
  });
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    database: {
      url: '',
      poolSize: 10,
      connectionTimeout: 5000,
      backupEnabled: true,
      backupFrequency: 'daily'
    },
    netlify: {
      teamSlug: 'swelldgtl',
      defaultBuildCommand: 'npm run build',
      defaultPublishDir: 'dist',
      apiKeyConfigured: false
    },
    environment: {
      globalVars: {},
      defaultClientVars: {
        'NEXT_PUBLIC_CLIENT_NAME': '',
        'NEXT_PUBLIC_CLIENT_SUBDOMAIN': '',
        'CLIENT_ID': ''
      }
    }
  });
  const [featureDefaults, setFeatureDefaults] = useState<FeatureDefaults>({
    long_term_goals: true,
    action_plan: true,
    blockers_issues: true,
    agenda: true,
    focus_mode: true
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load system health
      await checkSystemHealth();
      
      // Load system configuration
      const configResponse = await fetch('/api/admin/system-config');
      if (configResponse.ok) {
        const config = await configResponse.json();
        setSystemConfig(prev => ({ ...prev, ...config }));
      }
      
      // Load feature defaults
      const featuresResponse = await fetch('/api/admin/feature-defaults');
      if (featuresResponse.ok) {
        const features = await featuresResponse.json();
        setFeatureDefaults(features);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load admin settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSystemHealth = async () => {
    try {
      // Check database health
      const dbResponse = await fetch('/api/database/test');
      const dbHealth = await dbResponse.json();
      
      // Check Netlify health (mock for now)
      const netlifyHealth = {
        status: 'connected' as const,
        teamId: '687968df109255a75fd649db',
        lastChecked: new Date().toISOString()
      };
      
      const newHealth: SystemHealth = {
        database: {
          status: dbResponse.ok ? 'connected' : 'error',
          connectionTime: dbHealth.connectionTime,
          lastChecked: new Date().toISOString()
        },
        netlify: netlifyHealth,
        overall: dbResponse.ok ? 'healthy' : 'warning'
      };
      
      setSystemHealth(newHealth);
    } catch (error) {
      setSystemHealth(prev => ({
        ...prev,
        overall: 'critical'
      }));
    }
  };

  const saveSystemConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemConfig)
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "System configuration saved successfully",
        });
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save system configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveFeatureDefaults = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/feature-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(featureDefaults)
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Feature defaults saved successfully",
        });
      } else {
        throw new Error('Failed to save feature defaults');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save feature defaults",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading admin settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Settings</h2>
          <p className="text-gray-600">Configure system-wide settings and monitor platform health</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={checkSystemHealth}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Health Overview Banner */}
      <Card className={`border-2 ${getHealthColor(systemHealth.overall)}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getHealthIcon(systemHealth.overall)}
              <div>
                <h3 className="font-semibold">System Status: {systemHealth.overall.charAt(0).toUpperCase() + systemHealth.overall.slice(1)}</h3>
                <p className="text-sm opacity-80">Last checked: {new Date().toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Database className="h-4 w-4" />
                  <span className="text-sm font-medium">Database</span>
                </div>
                <Badge
                  variant="outline"
                  className={systemHealth.database.status === 'connected'
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-red-100 text-red-800 border-red-300'
                  }
                >
                  {systemHealth.database.status}
                </Badge>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">Netlify</span>
                </div>
                <Badge
                  variant="outline"
                  className={systemHealth.netlify.status === 'connected'
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-red-100 text-red-800 border-red-300'
                  }
                >
                  {systemHealth.netlify.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            System Configuration
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Health Dashboard
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Feature Defaults
          </TabsTrigger>
        </TabsList>

        {/* System Configuration Tab */}
        <TabsContent value="system" className="space-y-6">
          {/* Database Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="db-url">Database URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="db-url"
                      type={showSecrets ? "text" : "password"}
                      value={systemConfig.database.url}
                      onChange={(e) => setSystemConfig(prev => ({
                        ...prev,
                        database: { ...prev.database, url: e.target.value }
                      }))}
                      placeholder="postgresql://..."
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSecrets(!showSecrets)}
                    >
                      {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="pool-size">Connection Pool Size</Label>
                  <Input
                    id="pool-size"
                    type="number"
                    value={systemConfig.database.poolSize}
                    onChange={(e) => setSystemConfig(prev => ({
                      ...prev,
                      database: { ...prev.database, poolSize: parseInt(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="connection-timeout">Connection Timeout (ms)</Label>
                  <Input
                    id="connection-timeout"
                    type="number"
                    value={systemConfig.database.connectionTimeout}
                    onChange={(e) => setSystemConfig(prev => ({
                      ...prev,
                      database: { ...prev.database, connectionTimeout: parseInt(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <select
                    id="backup-frequency"
                    value={systemConfig.database.backupFrequency}
                    onChange={(e) => setSystemConfig(prev => ({
                      ...prev,
                      database: { ...prev.database, backupFrequency: e.target.value }
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="backup-enabled"
                  checked={systemConfig.database.backupEnabled}
                  onCheckedChange={(checked) => setSystemConfig(prev => ({
                    ...prev,
                    database: { ...prev.database, backupEnabled: checked }
                  }))}
                />
                <Label htmlFor="backup-enabled">Enable Automatic Backups</Label>
              </div>
            </CardContent>
          </Card>

          {/* Netlify Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Netlify Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="team-slug">Team Slug</Label>
                  <Input
                    id="team-slug"
                    value={systemConfig.netlify.teamSlug}
                    onChange={(e) => setSystemConfig(prev => ({
                      ...prev,
                      netlify: { ...prev.netlify, teamSlug: e.target.value }
                    }))}
                    placeholder="your-team-slug"
                  />
                </div>
                <div>
                  <Label htmlFor="build-command">Default Build Command</Label>
                  <Input
                    id="build-command"
                    value={systemConfig.netlify.defaultBuildCommand}
                    onChange={(e) => setSystemConfig(prev => ({
                      ...prev,
                      netlify: { ...prev.netlify, defaultBuildCommand: e.target.value }
                    }))}
                    placeholder="npm run build"
                  />
                </div>
                <div>
                  <Label htmlFor="publish-dir">Default Publish Directory</Label>
                  <Input
                    id="publish-dir"
                    value={systemConfig.netlify.defaultPublishDir}
                    onChange={(e) => setSystemConfig(prev => ({
                      ...prev,
                      netlify: { ...prev.netlify, defaultPublishDir: e.target.value }
                    }))}
                    placeholder="dist"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={systemConfig.netlify.apiKeyConfigured ? 'default' : 'secondary'}>
                    {systemConfig.netlify.apiKeyConfigured ? 'API Key Configured' : 'API Key Required'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Environment Variables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Default Client Variables Template</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  These variables will be automatically set for new client projects
                </p>
                <div className="space-y-2">
                  {Object.entries(systemConfig.environment.defaultClientVars).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <Input
                        value={key}
                        readOnly
                        className="bg-gray-50"
                        placeholder="Variable name"
                      />
                      <Input
                        value={value}
                        onChange={(e) => setSystemConfig(prev => ({
                          ...prev,
                          environment: {
                            ...prev.environment,
                            defaultClientVars: {
                              ...prev.environment.defaultClientVars,
                              [key]: e.target.value
                            }
                          }
                        }))}
                        placeholder="Default value"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={saveSystemConfig}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Configuration
            </Button>
          </div>
        </TabsContent>

        {/* Health Dashboard Tab */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Connection Status</span>
                  <div className="flex items-center gap-2">
                    {getHealthIcon(systemHealth.database.status)}
                    <Badge variant={systemHealth.database.status === 'connected' ? 'default' : 'destructive'}>
                      {systemHealth.database.status}
                    </Badge>
                  </div>
                </div>
                {systemHealth.database.connectionTime && (
                  <div className="flex items-center justify-between">
                    <span>Response Time</span>
                    <span className="font-mono text-sm">{systemHealth.database.connectionTime}ms</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Last Checked</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(systemHealth.database.lastChecked).toLocaleString()}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkSystemHealth}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
              </CardContent>
            </Card>

            {/* Netlify Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Netlify Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>API Status</span>
                  <div className="flex items-center gap-2">
                    {getHealthIcon(systemHealth.netlify.status)}
                    <Badge variant={systemHealth.netlify.status === 'connected' ? 'default' : 'destructive'}>
                      {systemHealth.netlify.status}
                    </Badge>
                  </div>
                </div>
                {systemHealth.netlify.teamId && (
                  <div className="flex items-center justify-between">
                    <span>Team ID</span>
                    <span className="font-mono text-sm">{systemHealth.netlify.teamId.substring(0, 8)}...</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Last Checked</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(systemHealth.netlify.lastChecked).toLocaleString()}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkSystemHealth}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Integration
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* System Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                System Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-sm text-muted-foreground">Active Clients</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">5</div>
                  <div className="text-sm text-muted-foreground">Available Features</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-sm text-muted-foreground">Netlify Projects</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Defaults Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Default Feature Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure which features are enabled by default for new clients
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Long-Term Goals</h4>
                    <p className="text-sm text-muted-foreground">Strategic planning and goal tracking module</p>
                  </div>
                  <Switch
                    checked={featureDefaults.long_term_goals}
                    onCheckedChange={(checked) => setFeatureDefaults(prev => ({
                      ...prev,
                      long_term_goals: checked
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Action Plan</h4>
                    <p className="text-sm text-muted-foreground">Task management and action item tracking</p>
                  </div>
                  <Switch
                    checked={featureDefaults.action_plan}
                    onCheckedChange={(checked) => setFeatureDefaults(prev => ({
                      ...prev,
                      action_plan: checked
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Blockers & Issues</h4>
                    <p className="text-sm text-muted-foreground">Issue tracking and blocker management</p>
                  </div>
                  <Switch
                    checked={featureDefaults.blockers_issues}
                    onCheckedChange={(checked) => setFeatureDefaults(prev => ({
                      ...prev,
                      blockers_issues: checked
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Agenda</h4>
                    <p className="text-sm text-muted-foreground">Meeting agenda and note-taking functionality</p>
                  </div>
                  <Switch
                    checked={featureDefaults.agenda}
                    onCheckedChange={(checked) => setFeatureDefaults(prev => ({
                      ...prev,
                      agenda: checked
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Focus Mode</h4>
                    <p className="text-sm text-muted-foreground">Distraction-free interface for enhanced productivity</p>
                  </div>
                  <Switch
                    checked={featureDefaults.focus_mode}
                    onCheckedChange={(checked) => setFeatureDefaults(prev => ({
                      ...prev,
                      focus_mode: checked
                    }))}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-800">Feature Defaults Impact</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      These settings will be applied to all new clients created through the admin console. 
                      Existing clients are not affected by changes to these defaults.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={saveFeatureDefaults}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Feature Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
