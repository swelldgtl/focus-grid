import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Trash2, Users } from "lucide-react";
import {
  Client,
  getClients,
  getCurrentClient,
  setCurrentClient,
  createClient,
  deleteClient,
} from "@/lib/client-manager";

interface ClientSelectorProps {
  onClientChange: (client: Client) => void;
}

export default function ClientSelector({
  onClientChange,
}: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [currentClient, setCurrentClientState] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  useEffect(() => {
    const loadedClients = getClients();
    setClients(loadedClients);

    const current = getCurrentClient();
    if (current && loadedClients.find((c) => c.id === current.id)) {
      setCurrentClientState(current);
    } else if (loadedClients.length > 0) {
      // Auto-select first client if none selected
      const firstClient = loadedClients[0];
      setCurrentClientState(firstClient);
      setCurrentClient(firstClient);
      onClientChange(firstClient);
    }
  }, [onClientChange]);

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setCurrentClientState(client);
      setCurrentClient(client);
      onClientChange(client);
    }
  };

  const handleCreateClient = () => {
    if (!newClientName.trim()) return;

    const newClient = createClient(newClientName.trim());
    const updatedClients = getClients();
    setClients(updatedClients);
    setNewClientName("");
    setIsDialogOpen(false);

    // Auto-switch to new client
    setCurrentClientState(newClient);
    setCurrentClient(newClient);
    onClientChange(newClient);
  };

  const handleDeleteClient = (clientId: string) => {
    deleteClient(clientId);
    const updatedClients = getClients();
    setClients(updatedClients);

    // If we deleted the current client, switch to another one
    if (currentClient?.id === clientId) {
      if (updatedClients.length > 0) {
        const newCurrent = updatedClients[0];
        setCurrentClientState(newCurrent);
        setCurrentClient(newCurrent);
        onClientChange(newCurrent);
      } else {
        setCurrentClientState(null);
      }
    }
  };

  if (clients.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No clients</span>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Create First Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Client name..."
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateClient()}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateClient}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <Select
        value={currentClient?.id || ""}
        onValueChange={handleClientSelect}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select client..." />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              <div className="flex items-center justify-between w-full">
                <span>{client.name}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Client</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{client.name}"? This
                        will permanently remove all data for this client.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteClient(client.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Client name..."
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateClient()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateClient}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
