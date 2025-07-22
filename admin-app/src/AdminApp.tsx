import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../client/components/ui/card';
import { Button } from '../../client/components/ui/button';
import { Badge } from '../../client/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../client/components/ui/tabs';
import { Toaster } from '../../client/components/ui/toaster';
import {
  Settings,
  Users,
  Database,
  Globe,
  Monitor
} from 'lucide-react';
import ClientManager from '../../client/components/admin/ClientManager';
import FeatureManager from '../../client/components/admin/FeatureManager';
import AdminSettings from '../../client/components/admin/AdminSettings';

export default function AdminApp() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Focus Grid Admin</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gray-50 text-gray-700">
                <Database className="h-3 w-3 mr-1" />
                Admin Mode
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = 'https://swellfocusgrid.com'}
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
              <Monitor className="h-4 w-4" />
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
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setActiveTab("clients")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">
                    Demo, Blue Label Packaging, ERC
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setActiveTab("features")}
              >
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
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Blue Label Packaging - Blockers & Issues disabled</span>
                    <Badge variant="secondary" className="text-xs">2 hours ago</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-green-600" />
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

          {/* Clients Tab */}
          <TabsContent value="clients">
            <ClientManager />
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <FeatureManager />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
      
      <Toaster />
    </div>
  );
}
