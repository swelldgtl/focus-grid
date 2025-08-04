import React, { useState, useEffect } from "react";
import { getClients, type Client } from "@/lib/client-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Briefcase,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  Save,
  RefreshCw,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  features?: {
    long_term_goals: boolean;
    action_plan: boolean;
    blockers_issues: boolean;
    agenda: boolean;
    goals_progress: boolean;
  };
}

interface FeatureConfig {
  key: keyof Client["features"];
  name: string;
  description: string;
}

const FEATURES: FeatureConfig[] = [
  {
    key: "long_term_goals",
    name: "Long-Term Goals",
    description: "Strategic planning and goal tracking module",
  },
  {
    key: "action_plan",
    name: "Action Plan",
    description: "Task management and action item tracking",
  },
  {
    key: "blockers_issues",
    name: "Blockers & Issues",
    description: "Issue tracking and blocker management",
  },
  {
    key: "agenda",
    name: "Agenda",
    description: "Meeting agenda and note-taking functionality",
  },
  {
    key: "goals_progress",
    name: "Goals & Progress",
    description: "Goals tracking and progress analytics module",
  },
];

export default function FeatureManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{
    [clientId: string]: Partial<Client["features"]>;
  }>({});

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
          focus_mode: true,
        },
      }));
      setClients(clientsWithFeatures);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const getClientIcon = (name: string) => {
    if (name.includes("Blue Label")) return Building2;
    if (name.includes("ERC")) return Briefcase;
    return Users;
  };

  const getFilteredClients = () => {
    if (selectedClient === "all") return clients;
    return clients.filter((client) => client.id === selectedClient);
  };

  const getFeatureValue = (client: Client, feature: string): boolean => {
    const clientId = client.id;
    const featureKey = feature as keyof Client["features"];

    // Check if there are pending changes for this client and feature
    if (
      pendingChanges[clientId] &&
      pendingChanges[clientId][featureKey] !== undefined
    ) {
      return pendingChanges[clientId][featureKey]!;
    }

    // Return current value
    return client.features?.[featureKey] || false;
  };

  const handleFeatureToggle = (
    clientId: string,
    feature: string,
    value: boolean,
  ) => {
    const featureKey = feature as keyof Client["features"];

    setPendingChanges((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        [featureKey]: value,
      },
    }));
  };

  const hasChanges = () => {
    return (
      Object.keys(pendingChanges).length > 0 &&
      Object.values(pendingChanges).some(
        (changes) => Object.keys(changes).length > 0,
      )
    );
  };

  const handleSaveChanges = async () => {
    setSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Apply changes to clients state
    setClients((prev) =>
      prev.map((client) => {
        const changes = pendingChanges[client.id];
        if (changes) {
          return {
            ...client,
            features: {
              ...client.features,
              ...changes,
            },
          };
        }
        return client;
      }),
    );

    // Clear pending changes
    setPendingChanges({});
    setSaving(false);
  };

  const handleDiscardChanges = () => {
    setPendingChanges({});
  };

  const getEnabledFeaturesCount = (client: Client) => {
    let count = 0;
    FEATURES.forEach((feature) => {
      if (getFeatureValue(client, feature.key)) {
        count++;
      }
    });
    return count;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-muted-foreground mt-2">
              Loading feature configurations...
            </p>
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
            Feature Management
          </h2>
          <p className="text-gray-600">
            Configure which features are available for each client
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasChanges() && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscardChanges}
                disabled={saving}
              >
                Discard Changes
              </Button>
              <Button
                size="sm"
                onClick={handleSaveChanges}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Feature Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {FEATURES.map((feature) => {
          const enabledCount = getFilteredClients().filter((client) =>
            getFeatureValue(client, feature.key),
          ).length;
          const totalCount = getFilteredClients().length;

          return (
            <Card key={feature.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {feature.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {enabledCount}/{totalCount}
                </div>
                <p className="text-xs text-muted-foreground">clients enabled</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Configuration Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feature Configuration
          </CardTitle>
          {hasChanges() && (
            <Badge
              variant="outline"
              className="w-fit bg-yellow-50 text-yellow-700 border-yellow-200"
            >
              {Object.values(pendingChanges).reduce(
                (total, changes) => total + Object.keys(changes).length,
                0,
              )}{" "}
              unsaved changes
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                {FEATURES.map((feature) => (
                  <TableHead key={feature.key} className="text-center">
                    <div className="font-medium">{feature.name}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredClients().map((client) => {
                const Icon = getClientIcon(client.name);
                const enabledFeatures = getEnabledFeaturesCount(client);
                const hasClientChanges =
                  pendingChanges[client.id] &&
                  Object.keys(pendingChanges[client.id]).length > 0;

                return (
                  <TableRow
                    key={client.id}
                    className={hasClientChanges ? "bg-yellow-50" : ""}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {client.subdomain}.swellfocusgrid.com
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          enabledFeatures === FEATURES.length
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-gray-100 text-gray-600 border-gray-300"
                        }
                      >
                        {enabledFeatures}/{FEATURES.length} enabled
                      </Badge>
                    </TableCell>
                    {FEATURES.map((feature) => {
                      const isEnabled = getFeatureValue(client, feature.key);
                      const hasChanged =
                        pendingChanges[client.id]?.[feature.key] !== undefined;

                      return (
                        <TableCell key={feature.key} className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(value) =>
                                handleFeatureToggle(
                                  client.id,
                                  feature.key,
                                  value,
                                )
                              }
                              className={`${hasChanged ? "ring-2 ring-yellow-400" : ""}`}
                              style={{
                                backgroundColor: isEnabled
                                  ? "#16a34a"
                                  : "#9ca3af",
                              }}
                            />
                            {isEnabled ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
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
