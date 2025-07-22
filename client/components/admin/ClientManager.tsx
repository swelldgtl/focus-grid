import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
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
  XCircle,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Database,
  Zap
} from 'lucide-react';
import {
  getClients,
  createClient,
  deleteClient,
  generateSlug,
  generateSubdomain,
  checkSlugAvailability,
  type Client
} from '@/lib/client-api';

// Client interface moved to client-api.ts

export default function ClientManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    slug: '',
    subdomain: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    slug: '',
    subdomain: ''
  });
  const [deleteState, setDeleteState] = useState<{
    isFirstDialogOpen: boolean;
    isSecondDialogOpen: boolean;
    clientToDelete: Client | null;
    confirmationText: string;
    isDeleting: boolean;
  }>({
    isFirstDialogOpen: false,
    isSecondDialogOpen: false,
    clientToDelete: null,
    confirmationText: '',
    isDeleting: false
  });
  const { toast } = useToast();

  // Load clients from API
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await getClients();
      // Add default features for display if not present
      const clientsWithFeatures = clientsData.map(client => ({
        ...client,
        features: client.features || {
          long_term_goals: true,
          action_plan: true,
          blockers_issues: true,
          agenda: true,
          focus_mode: true
        }
      }));
      setClients(clientsWithFeatures);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getClientIcon = (name: string) => {
    if (name.includes('Blue Label')) return Building2;
    if (name.includes('ERC')) return Briefcase;
    return Users;
  };

  const getEnabledFeaturesCount = (features?: Client['features']) => {
    if (!features) return 0;
    return Object.values(features).filter(Boolean).length;
  };

  const validateForm = () => {
    const newErrors = { name: '', slug: '', subdomain: '' };
    let isValid = true;

    if (!newClient.name.trim()) {
      newErrors.name = 'Client name is required';
      isValid = false;
    }

    if (!newClient.slug.trim()) {
      newErrors.slug = 'Slug is required';
      isValid = false;
    } else if (!/^[a-z0-9-]+$/.test(newClient.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
      isValid = false;
    }

    if (!newClient.subdomain.trim()) {
      newErrors.subdomain = 'Subdomain is required';
      isValid = false;
    } else if (!/^[a-z0-9]+$/.test(newClient.subdomain)) {
      newErrors.subdomain = 'Subdomain can only contain lowercase letters and numbers';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCreateClient = async () => {
    if (!validateForm()) return;

    setCreating(true);
    try {
      // Check for duplicates
      const slugAvailable = await checkSlugAvailability(newClient.slug);
      if (!slugAvailable) {
        setErrors(prev => ({ ...prev, slug: 'A client with this slug already exists' }));
        return;
      }

      const newClientData = await createClient({
        name: newClient.name,
        slug: newClient.slug,
        subdomain: newClient.subdomain
      });

      if (newClientData) {
        // Add to local state with default features
        const clientWithFeatures = {
          ...newClientData,
          features: {
            long_term_goals: true,
            action_plan: true,
            blockers_issues: true,
            agenda: true,
            focus_mode: true
          }
        };
        setClients(prev => [clientWithFeatures, ...prev]);
        setNewClient({ name: '', slug: '', subdomain: '' });
        setErrors({ name: '', slug: '', subdomain: '' });
        setIsCreateDialogOpen(false);

        toast({
          title: "Success",
          description: `Client "${newClientData.name}" created successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create client",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const initiateDelete = (client: Client) => {
    setDeleteState({
      isFirstDialogOpen: true,
      isSecondDialogOpen: false,
      clientToDelete: client,
      confirmationText: '',
      isDeleting: false
    });
  };

  const proceedToSecondConfirmation = () => {
    setDeleteState(prev => ({
      ...prev,
      isFirstDialogOpen: false,
      isSecondDialogOpen: true
    }));
  };

  const cancelDelete = () => {
    setDeleteState({
      isFirstDialogOpen: false,
      isSecondDialogOpen: false,
      clientToDelete: null,
      confirmationText: '',
      isDeleting: false
    });
  };

  const executeDelete = async () => {
    if (!deleteState.clientToDelete) return;

    const client = deleteState.clientToDelete;
    const expectedText = `DELETE ${client.name}`;

    if (deleteState.confirmationText !== expectedText) {
      toast({
        title: "Confirmation Required",
        description: `Please type "${expectedText}" exactly as shown`,
        variant: "destructive",
      });
      return;
    }

    setDeleteState(prev => ({ ...prev, isDeleting: true }));

    try {
      const success = await deleteClient(client.id);
      if (success) {
        setClients(prev => prev.filter(c => c.id !== client.id));
        toast({
          title: "Client Deleted",
          description: `"${client.name}" has been permanently deleted`,
        });
        cancelDelete();
      } else {
        throw new Error('Failed to delete client');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
      setDeleteState(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleNameChange = (name: string) => {
    setNewClient(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
      subdomain: generateSubdomain(name)
    }));
    // Clear errors when user starts typing
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const handleSlugChange = (slug: string) => {
    setNewClient(prev => ({ ...prev, slug }));
    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: '' }));
    }
  };

  const handleSubdomainChange = (subdomain: string) => {
    setNewClient(prev => ({ ...prev, subdomain }));
    if (errors.subdomain) {
      setErrors(prev => ({ ...prev, subdomain: '' }));
    }
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
                <Label htmlFor="client-name" className="text-sm font-medium">Client Name</Label>
                <Input
                  id="client-name"
                  placeholder="e.g., Acme Corporation"
                  value={newClient.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="client-slug" className="text-sm font-medium">Slug</Label>
                <Input
                  id="client-slug"
                  placeholder="e.g., acme-corp"
                  value={newClient.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={errors.slug ? "border-red-500" : ""}
                />
                <p className="text-xs text-muted-foreground mt-1">Auto-generated from name, but can be customized</p>
                {errors.slug && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.slug}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="client-subdomain" className="text-sm font-medium">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="client-subdomain"
                    placeholder="e.g., acme"
                    value={newClient.subdomain}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    className={errors.subdomain ? "border-red-500" : ""}
                  />
                  <span className="text-sm text-muted-foreground">.swellfocusgrid.com</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Auto-generated from name, but can be customized</p>
                {errors.subdomain && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.subdomain}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewClient({ name: '', slug: '', subdomain: '' });
                    setErrors({ name: '', slug: '', subdomain: '' });
                  }}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateClient}
                  disabled={!newClient.name || !newClient.slug || !newClient.subdomain || creating}
                  className="flex items-center gap-2"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* First Deletion Warning Dialog */}
      <AlertDialog open={deleteState.isFirstDialogOpen} onOpenChange={(open) => !open && cancelDelete()}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Permanent Client Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-base font-medium text-gray-900">
                You are about to permanently delete "{deleteState.clientToDelete?.name}"
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="font-medium text-red-800">This will permanently:</p>
                    <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                      <li>Delete all client data and configurations</li>
                      <li>Remove access to {deleteState.clientToDelete?.subdomain}.swellfocusgrid.com</li>
                      <li>Delete all associated user data and content</li>
                      <li>Remove all feature settings and customizations</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-800">This action cannot be undone!</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Once deleted, all data will be permanently lost and cannot be recovered.
                    </p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <Button
              onClick={proceedToSecondConfirmation}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              I Understand, Continue
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Second Deletion Confirmation Dialog */}
      <AlertDialog open={deleteState.isSecondDialogOpen} onOpenChange={(open) => !open && cancelDelete()}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Final Confirmation Required
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-sm">
                To confirm deletion of <span className="font-semibold">"{deleteState.clientToDelete?.name}"</span>,
                please type the following text exactly:
              </p>
              <div className="bg-gray-100 border rounded p-3">
                <code className="text-sm font-mono font-semibold text-red-600">
                  DELETE {deleteState.clientToDelete?.name}
                </code>
              </div>
              <div>
                <Label htmlFor="delete-confirmation" className="text-sm font-medium">
                  Confirmation Text
                </Label>
                <Input
                  id="delete-confirmation"
                  placeholder={`DELETE ${deleteState.clientToDelete?.name}`}
                  value={deleteState.confirmationText}
                  onChange={(e) => setDeleteState(prev => ({
                    ...prev,
                    confirmationText: e.target.value
                  }))}
                  className="mt-1 font-mono"
                  disabled={deleteState.isDeleting}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={cancelDelete}
              disabled={deleteState.isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={executeDelete}
              variant="destructive"
              disabled={deleteState.isDeleting || deleteState.confirmationText !== `DELETE ${deleteState.clientToDelete?.name}`}
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
            >
              {deleteState.isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Permanently Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-200"
                          onClick={() => window.open(`https://${client.subdomain}.swellfocusgrid.com`, '_blank')}
                          title={`Open ${client.subdomain}.swellfocusgrid.com`}
                        >
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => initiateDelete(client)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
