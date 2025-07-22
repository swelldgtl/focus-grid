import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Trash2, Edit, Users, Plus, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Alert, AlertDescription } from "../ui/alert";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import { generateSlug } from "../../lib/client-api";
import { useToast } from "../../hooks/use-toast";
import type { Client, CreateClientData } from "../../types/client";

export default function ClientManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState<CreateClientData>({
    name: "",
    slug: "",
    subdomain: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load clients
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await fetch("/.netlify/functions/api/clients");
      if (!response.ok) throw new Error("Failed to load clients");
      const data = await response.json();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    try {
      const response = await fetch("/.netlify/functions/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create client");
      }

      await loadClients();
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Client created successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create client",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: "", slug: "", subdomain: "" });
    setFormErrors({});
  };

  const handleNameChange = (value: string) => {
    const slug = generateSlug(value);
    setFormData(prev => ({
      ...prev,
      name: value,
      slug,
      subdomain: slug,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Clients</h3>
          <p className="text-sm text-muted-foreground">
            Manage your SaaS clients and their configurations
          </p>
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
              <DialogDescription>
                Add a new client to your SaaS platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="client-name">Client Name</Label>
                <Input
                  id="client-name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter client name"
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="client-slug">Slug</Label>
                <Input
                  id="client-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="client-slug"
                />
                {formErrors.slug && (
                  <p className="text-sm text-destructive mt-1">{formErrors.slug}</p>
                )}
              </div>
              <div>
                <Label htmlFor="client-subdomain">Subdomain</Label>
                <Input
                  id="client-subdomain"
                  value={formData.subdomain}
                  onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value }))}
                  placeholder="subdomain"
                />
                {formErrors.subdomain && (
                  <p className="text-sm text-destructive mt-1">{formErrors.subdomain}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateClient}>Create Client</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No clients yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first client
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">{client.name}</CardTitle>
                  <CardDescription>
                    {client.subdomain && (
                      <span className="inline-flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        {client.subdomain}.swellfocusgrid.com
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Features configured:</span>
                    <span className="font-medium">
                      {client.features ? Object.values(client.features).filter(Boolean).length : 0}/5
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
