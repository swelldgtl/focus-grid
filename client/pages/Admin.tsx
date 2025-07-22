import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Users, 
  BarChart3, 
  Plus, 
  Building2, 
  Briefcase,
  Shield,
  Database,
  Globe
} from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Focus Grid Admin</h1>
                <p className="text-sm text-gray-600">Multi-Tenant Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-red-50 text-red-700">
                <Database className="h-3 w-3 mr-1" />
                Admin Mode
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/'}
              >
                <Globe className="h-4 w-4 mr-1" />
                View Client App
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">
                    +1 from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Features</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">
                    Long-term Goals, Action Plan, etc.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Deployments</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">
                    All sites operational
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button 
                  onClick={() => setActiveTab("clients")}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add New Client
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab("features")}
                >
                  Manage Features
                </Button>
                <Button variant="outline">
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Blue Label Packaging - Blockers & Issues disabled</span>
                    <Badge variant="secondary" className="text-xs">2 hours ago</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-green-600" />
                    <span className="text-sm">ERC - Long-Term Goals disabled</span>
                    <Badge variant="secondary" className="text-xs">1 day ago</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Demo Client - All features enabled</span>
                    <Badge variant="secondary" className="text-xs">3 days ago</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab - Placeholder */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Client Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage all your Focus Grid clients and their configurations
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Client management interface coming next...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab - Placeholder */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Feature Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure which features are available for each client
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Feature management interface coming next...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab - Placeholder */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure admin preferences and system settings
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Admin settings coming next...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
