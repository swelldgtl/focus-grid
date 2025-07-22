import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Briefcase } from "lucide-react";

interface ClientSwitcherProps {
  currentClientId?: string;
  onClientChange: (clientId: string, clientName: string) => void;
}

export default function ClientSwitcher({
  currentClientId,
  onClientChange,
}: ClientSwitcherProps) {
  const [actualCurrentClientId, setActualCurrentClientId] = React.useState(
    () => {
      // Check URL parameters first
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("clientId") || currentClientId;
    },
  );

  const clients = [
    {
      id: "8323e82d-075a-496d-8861-a86d862a67bc",
      name: "Demo Client",
      description: "Original demo client",
      icon: Users,
      color: "bg-gray-100 text-gray-800",
    },
    {
      id: "fbf03fbc-bf81-462b-a88f-668dfcb09acc",
      name: "Blue Label Packaging",
      description: "Packaging company (no Blockers)",
      icon: Building2,
      color: "bg-blue-100 text-blue-800",
    },
    {
      id: "360e6a09-c7e2-447e-8dbc-cebae72f1ff2",
      name: "ERC",
      description: "Consulting firm (no Long-Term Goals)",
      icon: Briefcase,
      color: "bg-green-100 text-green-800",
    },
  ];

  const handleClientSwitch = (clientId: string, clientName: string) => {
    setActualCurrentClientId(clientId);
    const url = new URL(window.location.href);
    url.searchParams.set("clientId", clientId);
    console.log("Switching to client:", clientName, "ID:", clientId);
    window.location.href = url.toString();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Client Switcher (Dev Only)
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Test different client configurations
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {clients.map((client) => {
          const Icon = client.icon;
          const isActive = actualCurrentClientId === client.id;

          return (
            <div key={client.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {client.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isActive && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
                <Button
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleClientSwitch(client.id, client.name)}
                  disabled={isActive}
                >
                  {isActive ? "Current" : "Switch"}
                </Button>
              </div>
            </div>
          );
        })}

        <div className="pt-2 border-t text-xs text-muted-foreground">
          Changes require page refresh to take effect
        </div>
      </CardContent>
    </Card>
  );
}
