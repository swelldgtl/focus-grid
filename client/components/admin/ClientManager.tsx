import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Database,
  Zap,
  Globe,
  Rocket,
  Settings2,
  Play,
} from "lucide-react";
import {
  getClients,
  createClient,
  updateClient,
  updateClientFeatures,
  deleteClient,
  generateSlug,
  generateSubdomain,
  checkSlugAvailability,
  type Client,
} from "@/lib/client-api";
import {
  createNetlifyProject,
  deleteNetlifyProject,
  type NetlifyProjectCreationResult,
} from "@/lib/netlify-api";

// Client interface moved to client-api.ts

export default function ClientManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [creating, setCreating] = useState(false);
  const [createdNetlifyProject, setCreatedNetlifyProject] = useState<{
    siteId: string;
    primaryUrl: string;
    clientName: string;
  } | null>(null);
  const [deployingProject, setDeployingProject] = useState(false);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [deploymentInfo, setDeploymentInfo] = useState<{
    siteName: string;
    subdomain: string;
    clientId: string;
    primaryUrl: string;
    siteId: string;
  } | null>(null);
  const [newClient, setNewClient] = useState({
    name: "",
    slug: "",
    subdomain: "",
    createNetlifyProject: true,
  });
  const [editClient, setEditClient] = useState({
    name: "",
    slug: "",
    subdomain: "",
  });
  const [editFeatures, setEditFeatures] = useState({
    long_term_goals: true,
    action_plan: true,
    blockers_issues: true,
    agenda: true,
    goals_progress: true,
  });
  const [errors, setErrors] = useState({
    name: "",
    slug: "",
    subdomain: "",
  });
  const [editErrors, setEditErrors] = useState({
    name: "",
    slug: "",
    subdomain: "",
  });
  const [domainChecking, setDomainChecking] = useState(false);
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [domainValidated, setDomainValidated] = useState(false);
  const [deleteState, setDeleteState] = useState<{
    isFirstDialogOpen: boolean;
    isSecondDialogOpen: boolean;
    clientToDelete: Client | null;
    confirmationText: string;
    isDeleting: boolean;
    deleteNetlifyProject: boolean;
    deletionStep: string;
  }>({
    isFirstDialogOpen: false,
    isSecondDialogOpen: false,
    clientToDelete: null,
    confirmationText: "",
    isDeleting: false,
    deleteNetlifyProject: true,
    deletionStep: "",
  });
  const { toast } = useToast();

  // Deploy project to Netlify
  const deployProject = async (client: Client) => {
    try {
      toast({
        title: "Deploying Project",
        description: `Starting deployment for ${client.name}...`,
      });

      const response = await fetch("/.netlify/functions/netlify-automation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "deploy",
          siteId: client.netlify_project_id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Deployment Started",
          description: `Repository connected and deployment started for ${client.name}. Check Netlify dashboard for progress.`,
        });
      } else {
        throw new Error(result.error || "Failed to deploy project");
      }
    } catch (error) {
      console.error("Error deploying project:", error);
      toast({
        title: "Deployment Failed",
        description:
          error instanceof Error ? error.message : "Failed to deploy project",
        variant: "destructive",
      });
    }
  };

  // Test environment variables
  const testEnvironmentVariables = async () => {
    try {
      const response = await fetch("/.netlify/functions/netlify-automation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "test-env",
        }),
      });

      const result = await response.json();
      console.log("Environment test result:", result);

      toast({
        title: "Environment Test",
        description: `Netlify Token: ${result.hasNetlifyToken ? "Found" : "Missing"}, GitHub Repo: ${result.githubRepo || "Missing"}`,
      });
    } catch (error) {
      console.error("Environment test failed:", error);
      toast({
        title: "Environment Test Failed",
        description: "Could not test environment variables",
        variant: "destructive",
      });
    }
  };

  // Check if subdomain is available in Netlify (explicit action)
  const checkDomainAvailability = async () => {
    if (!newClient.subdomain || !newClient.createNetlifyProject) {
      toast({
        title: "Cannot Check Domain",
        description:
          "Please enter a subdomain and enable Netlify project creation.",
        variant: "destructive",
      });
      return;
    }

    console.log(`Checking domain availability for: ${newClient.subdomain}`);
    setDomainChecking(true);
    setDomainValidated(false);

    try {
      const response = await fetch("/.netlify/functions/netlify-automation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "check-domain",
          subdomain: newClient.subdomain,
        }),
      });

      console.log(`Domain check response status: ${response.status}`);

      if (!response.ok) {
        console.error(`Domain check failed with status: ${response.status}`);
        const errorText = await response.text();
        console.error("Error response:", errorText);

        toast({
          title: "Domain Check Failed",
          description:
            "Unable to verify domain availability. Please try again.",
          variant: "destructive",
        });

        setDomainAvailable(null);
        return;
      }

      const result = await response.json();
      console.log("=== CLIENT DOMAIN CHECK RESULT ===");
      console.log("Full result:", result);
      console.log("Available:", result.available);
      console.log("Debug info:", result.debug);
      console.log("=== END CLIENT RESULT ===");

      setDomainAvailable(result.available);
      setDomainValidated(true);

      if (!result.available) {
        setErrors((prev) => ({
          ...prev,
          subdomain: "This subdomain is already taken in Netlify",
        }));

        toast({
          title: "Domain Unavailable",
          description: `The subdomain "${newClient.subdomain}" is already taken. Please choose a different one.`,
          variant: "destructive",
        });
      } else {
        setErrors((prev) => ({
          ...prev,
          subdomain: "",
        }));

        toast({
          title: "Domain Available",
          description: `The subdomain "${newClient.subdomain}" is available!`,
        });
      }
    } catch (error) {
      console.error("Error checking domain:", error);
      setDomainAvailable(null);

      toast({
        title: "Check Failed",
        description: "Error checking domain availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDomainChecking(false);
    }
  };

  // Load clients from API
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await getClients();
      // Add default features for display if not present
      const clientsWithFeatures = clientsData.map((client) => ({
        ...client,
        features: client.features || {
          long_term_goals: true,
          action_plan: true,
          blockers_issues: true,
          agenda: true,
          goals_progress: true,
        },
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

  const getEnabledFeaturesCount = (features?: Client["features"]) => {
    if (!features) return 0;
    return Object.values(features).filter(Boolean).length;
  };

  const validateForm = () => {
    const newErrors = { name: "", slug: "", subdomain: "" };
    let isValid = true;

    if (!newClient.name.trim()) {
      newErrors.name = "Client name is required";
      isValid = false;
    }

    if (!newClient.slug.trim()) {
      newErrors.slug = "Slug is required";
      isValid = false;
    } else if (!/^[a-z0-9-]+$/.test(newClient.slug)) {
      newErrors.slug =
        "Slug can only contain lowercase letters, numbers, and hyphens";
      isValid = false;
    }

    if (!newClient.subdomain.trim()) {
      newErrors.subdomain = "Subdomain is required";
      isValid = false;
    } else if (!/^[a-z0-9]+$/.test(newClient.subdomain)) {
      newErrors.subdomain =
        "Subdomain can only contain lowercase letters and numbers";
      isValid = false;
    } else if (newClient.createNetlifyProject && !domainValidated) {
      newErrors.subdomain = "Please check domain availability first";
      isValid = false;
    } else if (newClient.createNetlifyProject && domainAvailable === false) {
      newErrors.subdomain = "This subdomain is already taken in Netlify";
      isValid = false;
    } else if (newClient.createNetlifyProject && domainChecking) {
      newErrors.subdomain = "Please wait while we check domain availability";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCreateClient = async () => {
    if (!validateForm()) return;

    // Additional check: If Netlify project creation is enabled and domain is not available, block submission
    if (newClient.createNetlifyProject && domainAvailable === false) {
      toast({
        title: "Cannot Create Client",
        description:
          "The subdomain is already taken. Please choose a different subdomain.",
        variant: "destructive",
      });
      return;
    }

    // Additional check: If domain checking is still in progress, block submission
    if (newClient.createNetlifyProject && domainChecking) {
      toast({
        title: "Please Wait",
        description:
          "Domain availability is still being checked. Please wait a moment.",
        variant: "destructive",
      });
      return;
    }

    // Additional check: If we don't know domain availability yet, check it first
    if (
      newClient.createNetlifyProject &&
      domainAvailable === null &&
      newClient.subdomain
    ) {
      toast({
        title: "Checking Domain",
        description: "Please wait while we verify domain availability.",
        variant: "destructive",
      });
      await checkDomainAvailability(newClient.subdomain);
      return; // Don't proceed with creation yet
    }

    setCreating(true);

    try {
      // Check for duplicates
      const slugAvailable = await checkSlugAvailability(newClient.slug);
      if (!slugAvailable) {
        setErrors((prev) => ({
          ...prev,
          slug: "A client with this slug already exists",
        }));
        setCreating(false);
        return;
      }

      // Step 1: Create client in database
      const newClientData = await createClient({
        name: newClient.name,
        slug: newClient.slug,
        subdomain: newClient.subdomain,
      });

      if (!newClientData) {
        throw new Error("Failed to create client");
      }

      // Step 2: Create Netlify project if requested
      if (newClient.createNetlifyProject) {
        const netlifyResult = await createNetlifyProject({
          clientId: newClientData.id,
          clientName: newClient.name,
          subdomain: newClient.subdomain,
          databaseUrl: process.env.DATABASE_URL || "",
        });

        if (netlifyResult.success) {
          // Store deployment info and show dedicated deployment modal
          setDeploymentInfo({
            siteName: newClient.subdomain,
            subdomain: newClient.subdomain,
            clientId: newClientData.id,
            primaryUrl: netlifyResult.primaryUrl,
            siteId: netlifyResult.siteId,
          });

          // Close create modal and open deployment modal
          setIsCreateDialogOpen(false);
          setShowDeploymentModal(true);

          // Reset create form
          setNewClient({
            name: "",
            slug: "",
            subdomain: "",
            createNetlifyProject: true,
          });
          setErrors({ name: "", slug: "", subdomain: "" });
          setDomainAvailable(null);
          setDomainValidated(false);
        } else {
          throw new Error(
            netlifyResult.error || "Failed to create Netlify project",
          );
        }
      }

      // Add to local state with default features
      const clientWithFeatures = {
        ...newClientData,
        features: {
          long_term_goals: true,
          action_plan: true,
          blockers_issues: true,
          agenda: true,
          goals_progress: true,
        },
      };
      setClients((prev) => [clientWithFeatures, ...prev]);

      if (!newClient.createNetlifyProject) {
        // If no Netlify project, complete the flow
        completeClientCreation();
        toast({
          title: "Success",
          description: `Client "${newClientData.name}" created successfully`,
        });
      }
      // If Netlify project was created, modal stays open to show deploy option
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create client",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeployProject = async () => {
    if (!deploymentInfo) return;

    setDeployingProject(true);

    try {
      const response = await fetch("/.netlify/functions/netlify-automation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "deploy",
          siteId: deploymentInfo.siteId,
        }),
      });

      const result = await response.json();

      if (result.success && result.requiresManualSetup) {
        // Show manual setup instructions
        console.log("=== NETLIFY DEPLOYMENT SETUP ===");
        console.log(`Site: ${result.siteName}`);
        console.log(`Admin URL: ${result.adminUrl}`);
        console.log("Manual setup steps:");
        result.instructions.steps.forEach((step: string, index: number) => {
          console.log(`${index + 1}. ${step}`);
        });
        console.log(`One-click import: ${result.importUrl}`);
        console.log("=== END SETUP INSTRUCTIONS ===");

        toast({
          title: "Manual Setup Required",
          description: `Site created at ${result.siteName}. Check console for setup instructions or click the admin link provided.`,
        });

        // Open Netlify admin in a new tab (modal stays open)
        window.open(result.adminUrl, "_blank");
      } else if (result.success) {
        toast({
          title: "Deployment Started",
          description: `Repository connected and deployment started. Check Netlify dashboard for progress.`,
        });
      } else {
        throw new Error(result.error || "Failed to deploy project");
      }
    } catch (error) {
      console.error("Error deploying project:", error);
      toast({
        title: "Deployment Setup Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to provide deployment setup",
        variant: "destructive",
      });
    } finally {
      setDeployingProject(false);
    }
  };

  const generateEnvFile = () => {
    if (!deploymentInfo) return;

    const client = clients.find((c) => c.id === deploymentInfo.clientId);

    const envContent = `# Environment Variables for ${client?.name || deploymentInfo.siteName} - ${deploymentInfo.subdomain}
# Generated on ${new Date().toLocaleString()}

# Client Configuration
CLIENT_ID=${deploymentInfo.clientId}
DATABASE_URL=${process.env.DATABASE_URL || "postgresql://neondb_owner:npg_mfqu8lM7oDzj@ep-polished-dew-adh5wbkv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"}
NEXT_PUBLIC_CLIENT_NAME=${client?.name || deploymentInfo.siteName}
NEXT_PUBLIC_CLIENT_SUBDOMAIN=${deploymentInfo.subdomain}

# Admin & Deployment Configuration
NETLIFY_ACCESS_TOKEN=nfp_m56qdRWHHx5MjyzdqrxajMtUBwyhF4776c65
GITHUB_REPO=swelldgtl/focus-grid
`;

    // Create and download the file
    const blob = new Blob([envContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${deploymentInfo.subdomain}-env-variables.env`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Environment File Downloaded",
      description: `Downloaded ${deploymentInfo.subdomain}-env-variables.env - Import this into Netlify!`,
    });
  };

  const completeClientCreation = () => {
    setNewClient({
      name: "",
      slug: "",
      subdomain: "",
      createNetlifyProject: true,
    });
    setErrors({ name: "", slug: "", subdomain: "" });
    setCreatedNetlifyProject(null);
    setIsCreateDialogOpen(false);
    setShowDeploymentModal(false);
    setDeploymentInfo(null);
    setDomainAvailable(null);
    setDomainValidated(false);
  };

  const initiateDelete = (client: Client) => {
    setDeleteState({
      isFirstDialogOpen: true,
      isSecondDialogOpen: false,
      clientToDelete: client,
      confirmationText: "",
      isDeleting: false,
      deleteNetlifyProject: true,
      deletionStep: "",
    });
  };

  const proceedToSecondConfirmation = () => {
    setDeleteState((prev) => ({
      ...prev,
      isFirstDialogOpen: false,
      isSecondDialogOpen: true,
    }));
  };

  const cancelDelete = () => {
    setDeleteState({
      isFirstDialogOpen: false,
      isSecondDialogOpen: false,
      clientToDelete: null,
      confirmationText: "",
      isDeleting: false,
      deleteNetlifyProject: true,
      deletionStep: "",
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

    setDeleteState((prev) => ({
      ...prev,
      isDeleting: true,
      deletionStep: "Deleting from database...",
    }));

    try {
      // Step 1: Delete from database
      const success = await deleteClient(client.id);
      if (!success) {
        throw new Error("Failed to delete client from database");
      }

      // Step 2: Delete Netlify project if requested
      if (deleteState.deleteNetlifyProject && client.subdomain) {
        setDeleteState((prev) => ({
          ...prev,
          deletionStep: "Deleting Netlify project...",
        }));

        const netlifySuccess = await deleteNetlifyProject(client.subdomain);
        if (!netlifySuccess) {
          // Database deletion succeeded but Netlify failed - show warning
          toast({
            title: "Partial Deletion",
            description: `Client deleted from database, but Netlify project deletion failed. Please delete manually.`,
            variant: "destructive",
          });
        }
      }

      // Step 3: Update UI
      setClients((prev) => prev.filter((c) => c.id !== client.id));

      const successMessage = deleteState.deleteNetlifyProject
        ? `"${client.name}" and its Netlify project have been permanently deleted`
        : `"${client.name}" has been permanently deleted`;

      toast({
        title: "Client Deleted",
        description: successMessage,
      });

      cancelDelete();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete client",
        variant: "destructive",
      });
      setDeleteState((prev) => ({
        ...prev,
        isDeleting: false,
        deletionStep: "",
      }));
    }
  };

  const handleNameChange = (name: string) => {
    setNewClient((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
      subdomain: generateSubdomain(name),
    }));
    // Clear errors when user starts typing
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const handleSlugChange = (slug: string) => {
    setNewClient((prev) => ({ ...prev, slug }));
    if (errors.slug) {
      setErrors((prev) => ({ ...prev, slug: "" }));
    }
  };

  const handleSubdomainChange = (subdomain: string) => {
    setNewClient((prev) => ({ ...prev, subdomain }));

    // Reset domain validation when subdomain changes
    setDomainAvailable(null);
    setDomainValidated(false);

    if (errors.subdomain) {
      setErrors((prev) => ({ ...prev, subdomain: "" }));
    }
  };

  const handleCreateNetlifyProjectChange = (createNetlifyProject: boolean) => {
    setNewClient((prev) => ({ ...prev, createNetlifyProject }));

    // Reset domain validation when toggling Netlify project creation
    setDomainAvailable(null);
    setDomainValidated(false);
    setDomainChecking(false);
    setErrors((prev) => ({
      ...prev,
      subdomain: "",
    }));
  };

  const initiateEdit = (client: Client) => {
    setClientToEdit(client);
    setEditClient({
      name: client.name,
      slug: client.slug,
      subdomain: client.subdomain || "",
    });
    setEditFeatures({
      long_term_goals: client.features?.long_term_goals ?? true,
      action_plan: client.features?.action_plan ?? true,
      blockers_issues: client.features?.blockers_issues ?? true,
      agenda: client.features?.agenda ?? true,
      goals_progress: client.features?.goals_progress ?? true,
    });
    setEditErrors({ name: "", slug: "", subdomain: "" });
    setIsEditDialogOpen(true);
  };

  const validateEditForm = () => {
    const newErrors = { name: "", slug: "", subdomain: "" };
    let isValid = true;

    if (!editClient.name.trim()) {
      newErrors.name = "Client name is required";
      isValid = false;
    }

    if (!editClient.slug.trim()) {
      newErrors.slug = "Slug is required";
      isValid = false;
    } else if (!/^[a-z0-9-]+$/.test(editClient.slug)) {
      newErrors.slug =
        "Slug can only contain lowercase letters, numbers, and hyphens";
      isValid = false;
    }

    if (editClient.subdomain && !/^[a-z0-9]+$/.test(editClient.subdomain)) {
      newErrors.subdomain =
        "Subdomain can only contain lowercase letters and numbers";
      isValid = false;
    }

    setEditErrors(newErrors);
    return isValid;
  };

  const handleUpdateClient = async () => {
    if (!validateEditForm() || !clientToEdit) return;

    setCreating(true);
    try {
      // Check for duplicates only if slug changed
      if (editClient.slug !== clientToEdit.slug) {
        const slugAvailable = await checkSlugAvailability(editClient.slug);
        if (!slugAvailable) {
          setEditErrors((prev) => ({
            ...prev,
            slug: "A client with this slug already exists",
          }));
          return;
        }
      }

      const updatedClient = await updateClient(clientToEdit.id, {
        name: editClient.name,
        slug: editClient.slug,
        subdomain: editClient.subdomain,
      });

      if (updatedClient) {
        // Update features
        const featuresUpdated = await updateClientFeatures(
          clientToEdit.id,
          editFeatures,
        );

        if (!featuresUpdated) {
          toast({
            title: "Warning",
            description: "Client updated but features update failed",
            variant: "destructive",
          });
        }

        // Update local state with both client data and features
        const updatedClientWithFeatures = {
          ...updatedClient,
          features: editFeatures,
        };

        setClients((prev) =>
          prev.map((client) =>
            client.id === clientToEdit.id ? updatedClientWithFeatures : client,
          ),
        );
        setIsEditDialogOpen(false);
        setClientToEdit(null);

        // Notify client applications that features have been updated
        localStorage.setItem("admin-feature-update", Date.now().toString());

        toast({
          title: "Success",
          description: `Client "${updatedClient.name}" updated successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update client",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditFeatureToggle = (featureKey: string, enabled: boolean) => {
    setEditFeatures((prev) => ({
      ...prev,
      [featureKey]: enabled,
    }));
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
          <h2 className="text-2xl font-bold text-gray-900">
            Client Management
          </h2>
          <p className="text-gray-600">Manage all your Focus Grid clients</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
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
                <Label htmlFor="client-name" className="text-sm font-medium">
                  Client Name
                </Label>
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
                <Label htmlFor="client-slug" className="text-sm font-medium">
                  Slug
                </Label>
                <Input
                  id="client-slug"
                  placeholder="e.g., acme-corp"
                  value={newClient.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={errors.slug ? "border-red-500" : ""}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-generated from name, but can be customized
                </p>
                {errors.slug && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.slug}
                  </p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="client-subdomain"
                  className="text-sm font-medium"
                >
                  Subdomain
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="client-subdomain"
                        placeholder="e.g., acme"
                        value={newClient.subdomain}
                        onChange={(e) => handleSubdomainChange(e.target.value)}
                        className={
                          errors.subdomain
                            ? "border-red-500"
                            : domainAvailable === true && domainValidated
                              ? "border-green-500"
                              : domainAvailable === false && domainValidated
                                ? "border-red-500"
                                : ""
                        }
                      />
                      {!domainChecking &&
                        domainValidated &&
                        domainAvailable === true &&
                        newClient.createNetlifyProject && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                      {!domainChecking &&
                        domainValidated &&
                        domainAvailable === false &&
                        newClient.createNetlifyProject && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <XCircle className="h-4 w-4 text-red-600" />
                          </div>
                        )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      .swellfocusgrid.com
                    </span>
                  </div>
                  {newClient.createNetlifyProject && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={checkDomainAvailability}
                      disabled={!newClient.subdomain || domainChecking}
                      className="w-full"
                    >
                      {domainChecking ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Checking Domain...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Check Domain Availability
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="mt-1">
                  <p className="text-xs text-muted-foreground">
                    Auto-generated from name, but can be customized
                  </p>
                  {newClient.createNetlifyProject && !domainValidated && (
                    <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      Domain not checked yet - click "Check Domain Availability"
                    </p>
                  )}
                  {newClient.createNetlifyProject &&
                    domainValidated &&
                    domainAvailable === true && (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <CheckCircle className="h-3 w-3" />✓ Subdomain is
                        available and ready to use
                      </p>
                    )}
                  {newClient.createNetlifyProject &&
                    domainValidated &&
                    domainAvailable === false && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <XCircle className="h-3 w-3" />✗ Subdomain is already
                        taken - choose a different one
                      </p>
                    )}
                </div>
                {errors.subdomain && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.subdomain}
                  </p>
                )}
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="create-netlify"
                    checked={newClient.createNetlifyProject}
                    onChange={(e) =>
                      handleCreateNetlifyProjectChange(e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  <Label
                    htmlFor="create-netlify"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Rocket className="h-4 w-4 text-blue-600" />
                    Automatically create Netlify project
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  Creates a new Netlify project with environment variables and
                  deploys automatically
                </p>
                {newClient.createNetlifyProject && (
                  <div className="mt-2 ml-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Settings2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800">
                          Netlify project will include:
                        </p>
                        <ul className="text-blue-700 mt-1 space-y-1 text-xs">
                          <li>
                            • Environment variables (CLIENT_ID, DATABASE_URL)
                          </li>
                          <li>
                            • Custom domain: {newClient.subdomain}
                            .swellfocusgrid.com
                          </li>
                          <li>• Automatic deployment from main branch</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewClient({
                      name: "",
                      slug: "",
                      subdomain: "",
                      createNetlifyProject: true,
                    });
                    setErrors({ name: "", slug: "", subdomain: "" });
                  }}
                  disabled={creating}
                >
                  Cancel
                </Button>
                {!createdNetlifyProject && (
                  <Button
                    onClick={handleCreateClient}
                    disabled={
                      !newClient.name ||
                      !newClient.slug ||
                      !newClient.subdomain ||
                      creating ||
                      (newClient.createNetlifyProject && !domainValidated) ||
                      (newClient.createNetlifyProject && domainChecking) ||
                      (newClient.createNetlifyProject &&
                        domainAvailable === false)
                    }
                    className="flex items-center gap-2"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create Client
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Deployment Setup Modal - shown after client creation */}
      <Dialog open={showDeploymentModal} onOpenChange={setShowDeploymentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Client Created Successfully!
            </DialogTitle>
          </DialogHeader>

          {deploymentInfo && (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>
                    {
                      clients.find((c) => c.id === deploymentInfo.clientId)
                        ?.name
                    }
                  </strong>{" "}
                  has been created with Netlify project:
                </p>
                <p className="text-sm font-mono text-green-700 mt-1">
                  {deploymentInfo.primaryUrl}
                </p>
              </div>

              {/* Environment Variables Copy Section */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Step 1: Copy Environment Variables
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Copy these environment variables and add them individually in
                  Netlify:
                </p>
                <textarea
                  readOnly
                  className="w-full h-32 p-3 text-xs font-mono bg-white border rounded resize-none select-all"
                  value={`CLIENT_ID=${deploymentInfo.clientId}
DATABASE_URL=${process.env.DATABASE_URL || "postgresql://neondb_owner:npg_mfqu8lM7oDzj@ep-polished-dew-adh5wbkv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"}
NEXT_PUBLIC_CLIENT_NAME=${clients.find((c) => c.id === deploymentInfo.clientId)?.name || deploymentInfo.siteName}
NEXT_PUBLIC_CLIENT_SUBDOMAIN=${deploymentInfo.subdomain}
NETLIFY_ACCESS_TOKEN=nfp_m56qdRWHHx5MjyzdqrxajMtUBwyhF4776c65
GITHUB_REPO=swelldgtl/focus-grid`}
                  onClick={(e) => e.currentTarget.select()}
                />
                <p className="text-xs text-blue-600 mt-2">
                  💡 Click anywhere in the text area to select all variables for
                  copying
                </p>
              </div>

              {/* Setup Instructions */}
              <div className="p-4 bg-gray-50 border rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Step 2: Complete Netlify Setup
                </h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                    <strong>Repository & Build:</strong>
                    <ul className="mt-1 ml-4 list-disc space-y-1">
                      <li>
                        Connect to repository:{" "}
                        <code className="bg-gray-100 px-1 rounded">
                          swelldgtl/focus-grid
                        </code>
                      </li>
                      <li>
                        Build command:{" "}
                        <code className="bg-gray-100 px-1 rounded">
                          npm run build:client
                        </code>
                      </li>
                      <li>
                        Publish directory:{" "}
                        <code className="bg-gray-100 px-1 rounded">
                          dist/spa
                        </code>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded border-l-4 border-green-500">
                    <strong>Environment Variables:</strong>
                    <ul className="mt-1 ml-4 list-disc space-y-1">
                      <li>Go to Site settings → Environment variables</li>
                      <li>Click "Add a variable" for each variable above</li>
                      <li>Copy and paste the key and value for each one</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded border-l-4 border-purple-500">
                    <strong>Domain Management:</strong>
                    <ul className="mt-1 ml-4 list-disc space-y-1">
                      <li>
                        Add{" "}
                        <code className="bg-gray-100 px-1 rounded">
                          {deploymentInfo.subdomain}.swellfocusgrid.com
                        </code>{" "}
                        in Domain management
                      </li>
                      <li>Force HTTPS in Domain management</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleDeployProject}
                  disabled={deployingProject}
                  variant="outline"
                  className="flex-1 flex items-center gap-2"
                >
                  {deployingProject ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" />
                      Open Netlify Dashboard
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowDeploymentModal(false);
                    completeClientCreation();
                  }}
                  className="flex-1"
                >
                  I'm Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-client-name" className="text-sm font-medium">
                Client Name
              </Label>
              <Input
                id="edit-client-name"
                placeholder="e.g., Acme Corporation"
                value={editClient.name}
                onChange={(e) =>
                  setEditClient((prev) => ({ ...prev, name: e.target.value }))
                }
                className={editErrors.name ? "border-red-500" : ""}
              />
              {editErrors.name && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {editErrors.name}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-client-slug" className="text-sm font-medium">
                Slug
              </Label>
              <Input
                id="edit-client-slug"
                placeholder="e.g., acme-corp"
                value={editClient.slug}
                onChange={(e) =>
                  setEditClient((prev) => ({ ...prev, slug: e.target.value }))
                }
                className={editErrors.slug ? "border-red-500" : ""}
              />
              {editErrors.slug && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {editErrors.slug}
                </p>
              )}
            </div>
            <div>
              <Label
                htmlFor="edit-client-subdomain"
                className="text-sm font-medium"
              >
                Subdomain
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-client-subdomain"
                  placeholder="e.g., acme"
                  value={editClient.subdomain}
                  onChange={(e) =>
                    setEditClient((prev) => ({
                      ...prev,
                      subdomain: e.target.value,
                    }))
                  }
                  className={editErrors.subdomain ? "border-red-500" : ""}
                />
                <span className="text-sm text-muted-foreground">
                  .swellfocusgrid.com
                </span>
              </div>
              {editErrors.subdomain && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {editErrors.subdomain}
                </p>
              )}
            </div>

            {/* Feature Toggles */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-3 block">
                Feature Configuration
              </Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Long-Term Goals</div>
                    <div className="text-sm text-muted-foreground">
                      Strategic planning and goal tracking
                    </div>
                  </div>
                  <Switch
                    checked={editFeatures.long_term_goals}
                    onCheckedChange={(checked) =>
                      handleEditFeatureToggle("long_term_goals", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Action Plan</div>
                    <div className="text-sm text-muted-foreground">
                      Task management and action items
                    </div>
                  </div>
                  <Switch
                    checked={editFeatures.action_plan}
                    onCheckedChange={(checked) =>
                      handleEditFeatureToggle("action_plan", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Blockers & Issues</div>
                    <div className="text-sm text-muted-foreground">
                      Issue tracking and blocker management
                    </div>
                  </div>
                  <Switch
                    checked={editFeatures.blockers_issues}
                    onCheckedChange={(checked) =>
                      handleEditFeatureToggle("blockers_issues", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Agenda</div>
                    <div className="text-sm text-muted-foreground">
                      Meeting agenda and note-taking
                    </div>
                  </div>
                  <Switch
                    checked={editFeatures.agenda}
                    onCheckedChange={(checked) =>
                      handleEditFeatureToggle("agenda", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Goals & Progress</div>
                    <div className="text-sm text-muted-foreground">
                      Goals tracking and progress analytics
                    </div>
                  </div>
                  <Switch
                    checked={editFeatures.goals_progress}
                    onCheckedChange={(checked) =>
                      handleEditFeatureToggle("goals_progress", checked)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateClient}
                disabled={!editClient.name || !editClient.slug || creating}
                className="flex items-center gap-2"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* First Deletion Warning Dialog */}
      <AlertDialog
        open={deleteState.isFirstDialogOpen}
        onOpenChange={(open) => !open && cancelDelete()}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Permanent Client Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-base font-medium text-gray-900">
                You are about to permanently delete "
                {deleteState.clientToDelete?.name}"
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="font-medium text-red-800">
                      This will permanently:
                    </p>
                    <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                      <li>Delete all client data and configurations</li>
                      <li>
                        Remove access to {deleteState.clientToDelete?.subdomain}
                        .swellfocusgrid.com
                      </li>
                      <li>Delete all associated user data and content</li>
                      <li>Remove all feature settings and customizations</li>
                      <li>
                        Delete the corresponding Netlify project (if selected)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      This action cannot be undone!
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Once deleted, all data will be permanently lost and cannot
                      be recovered.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="delete-netlify"
                    checked={deleteState.deleteNetlifyProject}
                    onChange={(e) =>
                      setDeleteState((prev) => ({
                        ...prev,
                        deleteNetlifyProject: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <Label
                    htmlFor="delete-netlify"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4 text-red-600" />
                    Also delete Netlify project
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  This will permanently delete the Netlify project for{" "}
                  {deleteState.clientToDelete?.subdomain}.swellfocusgrid.com
                </p>
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
      <AlertDialog
        open={deleteState.isSecondDialogOpen}
        onOpenChange={(open) => !open && cancelDelete()}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Final Confirmation Required
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-sm">
                To confirm deletion of{" "}
                <span className="font-semibold">
                  "{deleteState.clientToDelete?.name}"
                </span>
                , please type the following text exactly:
              </p>
              <div className="bg-gray-100 border rounded p-3">
                <code className="text-sm font-mono font-semibold text-red-600">
                  DELETE {deleteState.clientToDelete?.name}
                </code>
              </div>
              <div>
                <Label
                  htmlFor="delete-confirmation"
                  className="text-sm font-medium"
                >
                  Confirmation Text
                </Label>
                <Input
                  id="delete-confirmation"
                  placeholder={`DELETE ${deleteState.clientToDelete?.name}`}
                  value={deleteState.confirmationText}
                  onChange={(e) =>
                    setDeleteState((prev) => ({
                      ...prev,
                      confirmationText: e.target.value,
                    }))
                  }
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
              disabled={
                deleteState.isDeleting ||
                deleteState.confirmationText !==
                  `DELETE ${deleteState.clientToDelete?.name}`
              }
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
            >
              {deleteState.isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {deleteState.deletionStep || "Deleting..."}
                </>
              ) : (
                "Permanently Delete"
              )}
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
                const enabledFeatures = getEnabledFeaturesCount(
                  client.features,
                );

                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">
                          /{client.slug}
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
                          onClick={() =>
                            window.open(
                              `https://${client.subdomain}.swellfocusgrid.com`,
                              "_blank",
                            )
                          }
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
                          {client.features?.goals_progress ? (
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => initiateEdit(client)}
                          title="Edit client"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {client.netlify_project_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deployProject(client)}
                            title="Deploy to Netlify"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
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
