import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Building2, 
  Briefcase, 
  Users,
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  created_at: string;
  features?: {
    long_term_goals: boolean;
    action_plan: boolean;
    blockers_issues: boolean;
    agenda: boolean;
    focus_mode: boolean;
  };
}

export default function ClientManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    slug: '',
    subdomain: ''
  });

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setClients([
        {
          id: '8323e82d-075a-496d-8861-a86d862a67bc',
          name: 'Demo Client',
          slug: 'demo',
          subdomain: 'demo',
          created_at: '2025-01-15T10:00:00Z',
          features: {
            long_term_goals: true,
            action_plan: true,
            blockers_issues: true,
            agenda: true,
            focus_mode: true
          }
        },
        {
          id: 'fbf03fbc-bf81-462b-a88f-668dfcb09acc',
          name: 'Blue Label Packaging',
          slug: 'blue-label-packaging',
          subdomain: 'bluelabelpackaging',
          created_at: '2025-01-20T14:30:00Z',
          features: {
            long_term_goals: true,
            action_plan: true,
            blockers_issues: false,
            agenda: true,
            focus_mode: true
          }
        },
        {
          id: '360e6a09-c7e2-447e-8dbc-cebae72f1ff2',
          name: 'ERC',
          slug: 'erc',
          subdomain: 'erc',
          created_at: '2025-01-22T09:15:00Z',
          features: {
            long_term_goals: false,
            action_plan: true,
            blockers_issues: true,
            agenda: true,
            focus_mode: true
          }
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getClientIcon = (name: string) => {
    if (name.includes('Blue Label')) return Building2;
    if (name.includes('ERC')) return Briefcase;
    return Users;
  };

  const getEnabledFeaturesCount = (features?: Client['features']) => {
    if (!features) return 0;
    return Object.values(features).filter(Boolean).length;
  };

  const handleCreateClient = () => {
    // In real implementation, this would make an API call
    const newClientData: Client = {
      id: Date.now().toString(),
      name: newClient.name,
      slug: newClient.slug,
      subdomain: newClient.subdomain,
      created_at: new Date().toISOString(),
      features: {
        long_term_goals: true,
        action_plan: true,
        blockers_issues: true,
        agenda: true,
        focus_mode: true
      }
    };

    setClients(prev => [...prev, newClientData]);
    setNewClient({ name: '', slug: '', subdomain: '' });
    setIsCreateDialogOpen(false);
  };

  const handleDeleteClient = (clientId: string) => {
    setClients(prev => prev.filter(client => client.id !== clientId));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading clients...</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
          <p className="text-gray-600">Manage all your Focus Grid clients</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Client Name</label>
                <Input
                  placeholder="e.g., Acme Corporation"
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input
                  placeholder="e.g., acme-corp"
                  value={newClient.slug}
                  onChange={(e) => setNewClient(prev => ({ ...prev, slug: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subdomain</label>
                <Input
                  placeholder="e.g., acme"
                  value={newClient.subdomain}
                  onChange={(e) => setNewClient(prev => ({ ...prev, subdomain: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateClient}
                  disabled={!newClient.name || !newClient.slug}
                >
                  Create Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const Icon = getClientIcon(client.name);
                const enabledFeatures = getEnabledFeaturesCount(client.features);
                
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">/{client.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {client.subdomain}.swellfocusgrid.com
                        </code>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {enabledFeatures}/5 enabled
                        </Badge>
                        <div className="flex gap-1">
                          {client.features?.long_term_goals ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-400" />
                          )}
                          {client.features?.action_plan ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-400" />
                          )}
                          {client.features?.blockers_issues ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-400" />
                          )}
                          {client.features?.agenda ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-400" />
                          )}
                          {client.features?.focus_mode ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(client.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Client</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{client.name}"? This action cannot be undone and will remove all data for this client.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteClient(client.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
