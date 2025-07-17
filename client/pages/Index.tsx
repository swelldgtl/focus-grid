import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  GripVertical,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Plus,
  Trash2,
  Check,
  Grid3X3,
  Send,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
}

interface BlockerIssue {
  id: string;
  title: string;
  description: string;
}

interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  completed?: boolean;
}

interface ActionItem {
  id: string;
  title: string;
  status: "on-track" | "off-track";
}

interface GoalRecord {
  id: string;
  goal: string;
  targetMetric: string;
  month1: string;
  month2: string;
  month3: string;
}

export default function Index() {
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    {
      id: "1",
      title: "Review Q4 performance metrics",
      status: "on-track",
    },
    {
      id: "2",
      title: "Update client documentation",
      status: "on-track",
    },
    {
      id: "3",
      title: "Prepare monthly newsletter",
      status: "off-track",
    },
    {
      id: "4",
      title: "Analyze user feedback",
      status: "on-track",
    },
    {
      id: "5",
      title: "Optimize database queries",
      status: "off-track",
    },
  ]);

  const [blockers, setBlockers] = useState<BlockerIssue[]>([
    {
      id: "6",
      title: "API Rate Limiting",
      description:
        "Third-party service imposing unexpected rate limits on our requests",
    },
    {
      id: "7",
      title: "Database Performance",
      description:
        "Slow query performance affecting user experience during peak hours",
    },
    {
      id: "8",
      title: "SSL Certificate Renewal",
      description:
        "Certificate expires next week, need to coordinate with DevOps team",
    },
    {
      id: "9",
      title: "Browser Compatibility",
      description: "Feature not working correctly in older versions of Safari",
    },
    {
      id: "10",
      title: "Vendor Integration",
      description: "Payment processor API changes breaking checkout flow",
    },
  ]);

  const [draggedAction, setDraggedAction] = useState<string | null>(null);
  const [draggedBlocker, setDraggedBlocker] = useState<string | null>(null);
  const [editingActionTitle, setEditingActionTitle] = useState<string | null>(
    null,
  );
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const [editingBlockerTitle, setEditingBlockerTitle] = useState<string | null>(
    null,
  );
  const [editingBlockerTitleValue, setEditingBlockerTitleValue] = useState("");
  const [editingBlockerDescription, setEditingBlockerDescription] = useState<
    string | null
  >(null);
  const [editingBlockerDescriptionValue, setEditingBlockerDescriptionValue] =
    useState("");
  const [activeFocusModule, setActiveFocusModule] = useState<string | null>(
    null,
  );
  const [timers, setTimers] = useState<{
    [key: string]: { seconds: number; running: boolean };
  }>({});

  // Initialize timers for all modules
  const modules = ["goals", "agenda", "action-plan", "blockers"];
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    {
      id: "1",
      title: "Review quarterly objectives",
      description: "Analyze Q4 performance and set goals for next quarter",
      owner: "Sarah Johnson",
      completed: false,
    },
    {
      id: "2",
      title: "Discuss team resource allocation",
      description: "Review current workload and upcoming project assignments",
      owner: "Mike Chen",
      completed: false,
    },
    {
      id: "3",
      title: "Budget planning for next quarter",
      description:
        "Finalize budget allocations and approve department requests",
      owner: "Jennifer Liu",
      completed: false,
    },
    {
      id: "4",
      title: "Client feedback review",
      description: "Address recent client concerns and improvement suggestions",
      owner: "David Martinez",
      completed: false,
    },
    {
      id: "5",
      title: "Next steps and action items",
      description: "Document decisions and assign follow-up tasks",
      owner: "Team Lead",
      completed: false,
    },
  ]);
  const [draggedAgenda, setDraggedAgenda] = useState<string | null>(null);
  const [editingAgendaTitle, setEditingAgendaTitle] = useState<string | null>(
    null,
  );
  const [editingAgendaTitleValue, setEditingAgendaTitleValue] = useState("");
  const [editingAgendaDescription, setEditingAgendaDescription] = useState<
    string | null
  >(null);
  const [editingAgendaDescriptionValue, setEditingAgendaDescriptionValue] =
    useState("");
  const [editingAgendaOwner, setEditingAgendaOwner] = useState<string | null>(
    null,
  );
  const [editingAgendaOwnerValue, setEditingAgendaOwnerValue] = useState("");
  const [editingCell, setEditingCell] = useState<{
    goalId: string;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [pendingGoalToAgenda, setPendingGoalToAgenda] = useState<{
    goalId: string;
    goalName: string;
  } | null>(null);
  const [pendingActionToAgenda, setPendingActionToAgenda] = useState<{
    actionId: string;
    actionTitle: string;
  } | null>(null);
  const [pendingBlockerToAgenda, setPendingBlockerToAgenda] = useState<{
    blockerId: string;
    blockerTitle: string;
  } | null>(null);

  const [goalsData, setGoalsData] = useState<GoalRecord[]>([
    {
      id: "1",
      goal: "Increase Monthly Revenue",
      targetMetric: "$25,000",
      month1: "$18,500",
      month2: "$21,200",
      month3: "$23,800",
    },
    {
      id: "2",
      goal: "Acquire New Customers",
      targetMetric: "50 customers",
      month1: "28 customers",
      month2: "34 customers",
      month3: "42 customers",
    },
    {
      id: "3",
      goal: "Improve Conversion Rate",
      targetMetric: "5.0%",
      month1: "3.2%",
      month2: "3.8%",
      month3: "4.3%",
    },
    {
      id: "4",
      goal: "Reduce Customer Churn",
      targetMetric: "< 2.0%",
      month1: "4.1%",
      month2: "3.2%",
      month3: "2.8%",
    },
    {
      id: "5",
      goal: "Increase User Engagement",
      targetMetric: "85% weekly active",
      month1: "72% weekly active",
      month2: "78% weekly active",
      month3: "81% weekly active",
    },
  ]);

  const handleCellClick = (
    goalId: string,
    field: string,
    currentValue: string,
  ) => {
    setEditingCell({ goalId, field });
    setEditValue(currentValue);
  };

  const handleCellSave = () => {
    if (!editingCell) return;

    setGoalsData((prev) =>
      prev.map((goal) => {
        if (goal.id === editingCell.goalId) {
          return {
            ...goal,
            [editingCell.field]: editValue,
          };
        }
        return goal;
      }),
    );

    setEditingCell(null);
    setEditValue("");
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellSave();
    } else if (e.key === "Escape") {
      handleCellCancel();
    }
  };

  const renderEditableCell = (
    goalId: string,
    field: string,
    value: string,
    className?: string,
  ) => {
    const isEditing =
      editingCell?.goalId === goalId && editingCell?.field === field;

    if (isEditing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleCellSave}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm"
          autoFocus
        />
      );
    }

    return (
      <div
        className={`cursor-pointer hover:bg-accent/50 px-2 py-1 rounded transition-colors ${className || ""}`}
        onClick={() => handleCellClick(goalId, field, value)}
      >
        {value}
      </div>
    );
  };

  const handleActionDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    actionId: string,
  ) => {
    setDraggedAction(actionId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleBlockerDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    blockerId: string,
  ) => {
    setDraggedBlocker(blockerId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleActionDrop = (
    e: React.DragEvent<HTMLDivElement>,
    dropIndex: number,
  ) => {
    e.preventDefault();
    if (!draggedAction) return;

    const draggedIndex = actionItems.findIndex(
      (action) => action.id === draggedAction,
    );
    if (draggedIndex === -1) return;

    const newActions = [...actionItems];
    const [draggedItem] = newActions.splice(draggedIndex, 1);
    newActions.splice(dropIndex, 0, draggedItem);

    setActionItems(newActions);
    setDraggedAction(null);
  };

  const handleStatusChange = (
    actionId: string,
    newStatus: "on-track" | "off-track",
  ) => {
    setActionItems((prev) =>
      prev.map((action) =>
        action.id === actionId ? { ...action, status: newStatus } : action,
      ),
    );
  };

  const getActionItemBackground = (status: "on-track" | "off-track") => {
    return status === "on-track"
      ? "bg-green-50 border-green-200 hover:bg-green-100"
      : "bg-red-50 border-red-200 hover:bg-red-100";
  };

  const addNewActionItem = () => {
    const newId = (
      Math.max(...actionItems.map((item) => parseInt(item.id))) + 1
    ).toString();
    const newItem: ActionItem = {
      id: newId,
      title: "New action item",
      status: "on-track",
    };
    setActionItems((prev) => [newItem, ...prev]);
    // Auto-focus on the new item's title for editing
    setEditingActionTitle(newId);
    setEditingTitleValue("New action item");
  };

  const handleTitleClick = (actionId: string, currentTitle: string) => {
    setEditingActionTitle(actionId);
    setEditingTitleValue(currentTitle);
  };

  const handleTitleSave = () => {
    if (!editingActionTitle) return;

    setActionItems((prev) =>
      prev.map((action) =>
        action.id === editingActionTitle
          ? { ...action, title: editingTitleValue }
          : action,
      ),
    );

    setEditingActionTitle(null);
    setEditingTitleValue("");
  };

  const handleTitleCancel = () => {
    setEditingActionTitle(null);
    setEditingTitleValue("");
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      handleTitleCancel();
    }
  };

  const handleBlockerTitleClick = (blockerId: string, currentTitle: string) => {
    setEditingBlockerTitle(blockerId);
    setEditingBlockerTitleValue(currentTitle);
  };

  const handleBlockerTitleSave = () => {
    if (!editingBlockerTitle) return;

    setBlockers((prev) =>
      prev.map((blocker) =>
        blocker.id === editingBlockerTitle
          ? { ...blocker, title: editingBlockerTitleValue }
          : blocker,
      ),
    );

    setEditingBlockerTitle(null);
    setEditingBlockerTitleValue("");
  };

  const handleBlockerTitleCancel = () => {
    setEditingBlockerTitle(null);
    setEditingBlockerTitleValue("");
  };

  const handleBlockerTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlockerTitleSave();
    } else if (e.key === "Escape") {
      handleBlockerTitleCancel();
    }
  };

  const handleBlockerDescriptionClick = (
    blockerId: string,
    currentDescription: string,
  ) => {
    setEditingBlockerDescription(blockerId);
    setEditingBlockerDescriptionValue(currentDescription);
  };

  const handleBlockerDescriptionSave = () => {
    if (!editingBlockerDescription) return;

    setBlockers((prev) =>
      prev.map((blocker) =>
        blocker.id === editingBlockerDescription
          ? { ...blocker, description: editingBlockerDescriptionValue }
          : blocker,
      ),
    );

    setEditingBlockerDescription(null);
    setEditingBlockerDescriptionValue("");
  };

  const handleBlockerDescriptionCancel = () => {
    setEditingBlockerDescription(null);
    setEditingBlockerDescriptionValue("");
  };

  const handleBlockerDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlockerDescriptionSave();
    } else if (e.key === "Escape") {
      handleBlockerDescriptionCancel();
    }
  };

  const addNewAgendaItem = () => {
    const newId = (
      Math.max(...agendaItems.map((item) => parseInt(item.id))) + 1
    ).toString();
    const newItem: AgendaItem = {
      id: newId,
      title: "New agenda item",
      description: "Add description here",
      owner: "No Owner",
      completed: false,
    };
    setAgendaItems((prev) => [...prev, newItem]);
    // Auto-focus on the new item's title for editing
    setEditingAgendaTitle(newId);
    setEditingAgendaTitleValue("New agenda item");
  };

  const removeAgendaItem = (id: string) => {
    setAgendaItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleGoalToAgendaClick = (goalId: string, goalName: string) => {
    setPendingGoalToAgenda({ goalId, goalName });
  };

  const confirmAddGoalToAgenda = () => {
    if (!pendingGoalToAgenda) return;

    const newId = (
      Math.max(...agendaItems.map((item) => parseInt(item.id))) + 1
    ).toString();
    const newItem: AgendaItem = {
      id: newId,
      title: pendingGoalToAgenda.goalName,
      description: "Add description here",
      owner: "No Owner",
      completed: false,
    };
    setAgendaItems((prev) => [...prev, newItem]);
    setPendingGoalToAgenda(null);
  };

  const cancelAddGoalToAgenda = () => {
    setPendingGoalToAgenda(null);
  };

  const handleActionToAgendaClick = (actionId: string, actionTitle: string) => {
    setPendingActionToAgenda({ actionId, actionTitle });
  };

  const confirmAddActionToAgenda = () => {
    if (!pendingActionToAgenda) return;

    const newId = (
      Math.max(...agendaItems.map((item) => parseInt(item.id))) + 1
    ).toString();
    const newItem: AgendaItem = {
      id: newId,
      title: pendingActionToAgenda.actionTitle,
      description: "Add description here",
      owner: "No Owner",
      completed: false,
    };
    setAgendaItems((prev) => [...prev, newItem]);
    setPendingActionToAgenda(null);
  };

  const cancelAddActionToAgenda = () => {
    setPendingActionToAgenda(null);
  };

  const handleBlockerToAgendaClick = (
    blockerId: string,
    blockerTitle: string,
  ) => {
    setPendingBlockerToAgenda({ blockerId, blockerTitle });
  };

  const confirmAddBlockerToAgenda = () => {
    if (!pendingBlockerToAgenda) return;

    const newId = (
      Math.max(...agendaItems.map((item) => parseInt(item.id))) + 1
    ).toString();
    const newItem: AgendaItem = {
      id: newId,
      title: pendingBlockerToAgenda.blockerTitle,
      description: "Add description here",
      owner: "No Owner",
      completed: false,
    };
    setAgendaItems((prev) => [...prev, newItem]);
    setPendingBlockerToAgenda(null);
  };

  const cancelAddBlockerToAgenda = () => {
    setPendingBlockerToAgenda(null);
  };

  const handleAgendaDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    agendaId: string,
  ) => {
    setDraggedAgenda(agendaId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleAgendaDrop = (
    e: React.DragEvent<HTMLDivElement>,
    dropIndex: number,
  ) => {
    e.preventDefault();
    if (!draggedAgenda) return;

    const draggedIndex = agendaItems.findIndex(
      (item) => item.id === draggedAgenda,
    );
    if (draggedIndex === -1) return;

    const newItems = [...agendaItems];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    setAgendaItems(newItems);
    setDraggedAgenda(null);
  };

  const handleAgendaTitleClick = (agendaId: string, currentTitle: string) => {
    setEditingAgendaTitle(agendaId);
    setEditingAgendaTitleValue(currentTitle);
  };

  const handleAgendaTitleSave = () => {
    if (!editingAgendaTitle) return;

    setAgendaItems((prev) =>
      prev.map((item) =>
        item.id === editingAgendaTitle
          ? { ...item, title: editingAgendaTitleValue }
          : item,
      ),
    );

    setEditingAgendaTitle(null);
    setEditingAgendaTitleValue("");
  };

  const handleAgendaTitleCancel = () => {
    setEditingAgendaTitle(null);
    setEditingAgendaTitleValue("");
  };

  const handleAgendaTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAgendaTitleSave();
    } else if (e.key === "Escape") {
      handleAgendaTitleCancel();
    }
  };

  const handleAgendaDescriptionClick = (
    agendaId: string,
    currentDescription: string,
  ) => {
    setEditingAgendaDescription(agendaId);
    setEditingAgendaDescriptionValue(currentDescription || "");
  };

  const handleAgendaDescriptionSave = () => {
    if (!editingAgendaDescription) return;

    setAgendaItems((prev) =>
      prev.map((item) =>
        item.id === editingAgendaDescription
          ? { ...item, description: editingAgendaDescriptionValue }
          : item,
      ),
    );

    setEditingAgendaDescription(null);
    setEditingAgendaDescriptionValue("");
  };

  const handleAgendaDescriptionCancel = () => {
    setEditingAgendaDescription(null);
    setEditingAgendaDescriptionValue("");
  };

  const handleAgendaDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAgendaDescriptionSave();
    } else if (e.key === "Escape") {
      handleAgendaDescriptionCancel();
    }
  };

  const handleAgendaOwnerClick = (agendaId: string, currentOwner: string) => {
    setEditingAgendaOwner(agendaId);
    setEditingAgendaOwnerValue(currentOwner || "");
  };

  const handleAgendaOwnerSave = () => {
    if (!editingAgendaOwner) return;

    setAgendaItems((prev) =>
      prev.map((item) =>
        item.id === editingAgendaOwner
          ? { ...item, owner: editingAgendaOwnerValue }
          : item,
      ),
    );

    setEditingAgendaOwner(null);
    setEditingAgendaOwnerValue("");
  };

  const handleAgendaOwnerCancel = () => {
    setEditingAgendaOwner(null);
    setEditingAgendaOwnerValue("");
  };

  const handleAgendaOwnerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAgendaOwnerSave();
    } else if (e.key === "Escape") {
      handleAgendaOwnerCancel();
    }
  };

  const markAgendaItemComplete = (id: string) => {
    setAgendaItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: true } : item,
      ),
    );
  };

  const toggleFocusMode = (moduleId: string) => {
    setActiveFocusModule((prev) => {
      if (prev === moduleId) {
        // Turning off focus mode for this module
        setTimers((prevTimers) => ({
          ...prevTimers,
          [moduleId]: {
            ...prevTimers[moduleId],
            running: false,
          },
        }));
        // Reset body background color when turning off focus mode
        document.body.style.backgroundColor = "";
        return null;
      } else {
        // Turning on focus mode for this module
        setTimers((prevTimers) => ({
          ...prevTimers,
          [moduleId]: {
            seconds: 0,
            running: true,
          },
        }));
        // Change body background color to #7D7F7C when turning on focus mode
        document.body.style.backgroundColor = "#7D7F7C";
        return moduleId;
      }
    });
  };

  // Timer effect for all modules
  useEffect(() => {
    const intervals: { [key: string]: NodeJS.Timeout } = {};

    Object.keys(timers).forEach((moduleId) => {
      if (timers[moduleId]?.running) {
        intervals[moduleId] = setInterval(() => {
          setTimers((prev) => ({
            ...prev,
            [moduleId]: {
              ...prev[moduleId],
              seconds: (prev[moduleId]?.seconds || 0) + 1,
            },
          }));
        }, 1000);
      }
    });

    return () => {
      Object.values(intervals).forEach((interval) => clearInterval(interval));
    };
  }, [timers]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Check if a module should be inactive
  const isModuleInactive = (moduleId: string) => {
    return activeFocusModule !== null && activeFocusModule !== moduleId;
  };

  const removeActionItem = (id: string) => {
    setActionItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addNewBlocker = () => {
    const newId = (
      Math.max(...blockers.map((item) => parseInt(item.id))) + 1
    ).toString();
    const newItem: BlockerIssue = {
      id: newId,
      title: "New blocker",
      description: "Describe the issue or blocker",
    };
    setBlockers((prev) => [newItem, ...prev]);
    // Auto-focus on the new item's title for editing
    setEditingBlockerTitle(newId);
    setEditingBlockerTitleValue("New blocker");
  };

  const removeBlocker = (id: string) => {
    setBlockers((prev) => prev.filter((item) => item.id !== id));
  };

  const handleBlockerDrop = (
    e: React.DragEvent<HTMLDivElement>,
    dropIndex: number,
  ) => {
    e.preventDefault();
    if (!draggedBlocker) return;

    const draggedIndex = blockers.findIndex(
      (blocker) => blocker.id === draggedBlocker,
    );
    if (draggedIndex === -1) return;

    const newBlockers = [...blockers];
    const [draggedItem] = newBlockers.splice(draggedIndex, 1);
    newBlockers.splice(dropIndex, 0, draggedItem);

    setBlockers(newBlockers);
    setDraggedBlocker(null);
  };

  const getStatusBadge = (status: SaleRecord["status"]) => {
    const variants = {
      paid: "bg-green-100 text-green-800 hover:bg-green-200",
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      overdue: "bg-red-100 text-red-800 hover:bg-red-200",
    };
    return variants[status];
  };

  const getPriorityBadge = (priority: Task["priority"]) => {
    const variants = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
    };
    return variants[priority];
  };

  const getTaskStatusBadge = (status: Task["status"]) => {
    const variants = {
      pending: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
    };
    return variants[status];
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center border-2 border-primary/20">
              <div className="w-6 h-6 bg-primary/30 rounded-sm"></div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Focus Grid</h1>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium text-muted-foreground">
              Client Name
            </p>
          </div>
        </div>

        {/* Sales Data Table */}
        <Card
          className={
            isModuleInactive("goals") ? "opacity-20 pointer-events-none" : ""
          }
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Goals & Progress</CardTitle>
                <CardDescription>
                  Track your key business objectives and monitor progress over
                  the past three months.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {activeFocusModule === "goals" && (
                  <div className="text-sm font-mono text-muted-foreground">
                    {formatTime(timers["goals"]?.seconds || 0)}
                  </div>
                )}
                <Button
                  onClick={() => toggleFocusMode("goals")}
                  variant="ghost"
                  size="sm"
                  className={`h-10 w-10 p-0 transition-colors ${
                    activeFocusModule === "goals"
                      ? "text-primary bg-primary/10 hover:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Grid3X3 className="h-8 w-8" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal</TableHead>
                  <TableHead>Target Metric</TableHead>
                  <TableHead>Oct 2024</TableHead>
                  <TableHead>Nov 2024</TableHead>
                  <TableHead>Dec 2024</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goalsData.map((goal, index) => (
                  <TableRow
                    key={goal.id}
                    className={index % 2 === 1 ? "bg-muted/30" : ""}
                  >
                    <TableCell className="font-medium">
                      {renderEditableCell(
                        goal.id,
                        "goal",
                        goal.goal,
                        "font-medium",
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {renderEditableCell(
                        goal.id,
                        "targetMetric",
                        goal.targetMetric,
                        "font-medium",
                      )}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(goal.id, "month1", goal.month1)}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(goal.id, "month2", goal.month2)}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(goal.id, "month3", goal.month3)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        onClick={() =>
                          handleGoalToAgendaClick(goal.id, goal.goal)
                        }
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        title="Add to Agenda"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Action Plan */}
        <Card
          className={
            isModuleInactive("action-plan")
              ? "opacity-20 pointer-events-none"
              : ""
          }
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Action Plan</CardTitle>
                <CardDescription>
                  Drag and drop to reorder action items. Track progress and stay
                  focused on your goals.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {activeFocusModule === "action-plan" && (
                  <div className="text-sm font-mono text-muted-foreground">
                    {formatTime(timers["action-plan"]?.seconds || 0)}
                  </div>
                )}
                <Button
                  onClick={() => toggleFocusMode("action-plan")}
                  variant="ghost"
                  size="sm"
                  className={`h-10 w-10 p-0 transition-colors ${
                    activeFocusModule === "action-plan"
                      ? "text-primary bg-primary/10 hover:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Grid3X3 className="h-8 w-8" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={addNewActionItem}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New
              </Button>
            </div>
            <div className="space-y-3">
              {actionItems.map((action, index) => (
                <div
                  key={action.id}
                  draggable
                  onDragStart={(e) => handleActionDragStart(e, action.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleActionDrop(e, index)}
                  className={`flex items-center gap-3 p-4 border rounded-lg transition-colors cursor-move group ${getActionItemBackground(action.status)}`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div className="flex-1">
                    {editingActionTitle === action.id ? (
                      <Input
                        value={editingTitleValue}
                        onChange={(e) => setEditingTitleValue(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={handleTitleKeyDown}
                        className="font-medium"
                        autoFocus
                      />
                    ) : (
                      <h4
                        className="font-medium cursor-pointer hover:text-primary transition-colors"
                        onClick={() =>
                          handleTitleClick(action.id, action.title)
                        }
                      >
                        {action.title}
                      </h4>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={action.status}
                      onValueChange={(value: "on-track" | "off-track") =>
                        handleStatusChange(action.id, value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on-track">On Track</SelectItem>
                        <SelectItem value="off-track">Off Track</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() =>
                        handleActionToAgendaClick(action.id, action.title)
                      }
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      title="Add to Agenda"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Action Item
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{action.title}"?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeActionItem(action.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Blockers & Issues */}
        <Card
          className={
            isModuleInactive("blockers") ? "opacity-20 pointer-events-none" : ""
          }
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Blockers & Issues</CardTitle>
                <CardDescription>
                  Track and prioritize current blockers and issues affecting
                  progress.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {activeFocusModule === "blockers" && (
                  <div className="text-sm font-mono text-muted-foreground">
                    {formatTime(timers["blockers"]?.seconds || 0)}
                  </div>
                )}
                <Button
                  onClick={() => toggleFocusMode("blockers")}
                  variant="ghost"
                  size="sm"
                  className={`h-10 w-10 p-0 transition-colors ${
                    activeFocusModule === "blockers"
                      ? "text-primary bg-primary/10 hover:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Grid3X3 className="h-8 w-8" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={addNewBlocker}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New
              </Button>
            </div>
            <div className="space-y-3">
              {blockers.map((blocker, index) => (
                <div
                  key={blocker.id}
                  draggable
                  onDragStart={(e) => handleBlockerDragStart(e, blocker.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleBlockerDrop(e, index)}
                  className="flex items-center gap-3 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-move group"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div className="flex-1">
                    {editingBlockerTitle === blocker.id ? (
                      <Input
                        value={editingBlockerTitleValue}
                        onChange={(e) =>
                          setEditingBlockerTitleValue(e.target.value)
                        }
                        onBlur={handleBlockerTitleSave}
                        onKeyDown={handleBlockerTitleKeyDown}
                        className="font-medium"
                        autoFocus
                      />
                    ) : (
                      <h4
                        className="font-medium cursor-pointer hover:text-primary transition-colors"
                        onClick={() =>
                          handleBlockerTitleClick(blocker.id, blocker.title)
                        }
                      >
                        {blocker.title}
                      </h4>
                    )}
                    {editingBlockerDescription === blocker.id ? (
                      <Input
                        value={editingBlockerDescriptionValue}
                        onChange={(e) =>
                          setEditingBlockerDescriptionValue(e.target.value)
                        }
                        onBlur={handleBlockerDescriptionSave}
                        onKeyDown={handleBlockerDescriptionKeyDown}
                        className="text-sm mt-1"
                        autoFocus
                      />
                    ) : (
                      <p
                        className="text-sm text-muted-foreground mt-1 cursor-pointer hover:text-foreground transition-colors"
                        onClick={() =>
                          handleBlockerDescriptionClick(
                            blocker.id,
                            blocker.description,
                          )
                        }
                      >
                        {blocker.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() =>
                        handleBlockerToAgendaClick(blocker.id, blocker.title)
                      }
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      title="Add to Agenda"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Blocker</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{blocker.title}"?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeBlocker(blocker.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agenda */}
        <Card
          className={
            isModuleInactive("agenda") ? "opacity-20 pointer-events-none" : ""
          }
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Agenda</CardTitle>
                <CardDescription>
                  Meeting agenda items in order of discussion. Drag and drop to
                  reorder.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {activeFocusModule === "agenda" && (
                  <div className="text-sm font-mono text-muted-foreground">
                    {formatTime(timers["agenda"]?.seconds || 0)}
                  </div>
                )}
                <Button
                  onClick={() => toggleFocusMode("agenda")}
                  variant="ghost"
                  size="sm"
                  className={`h-10 w-10 p-0 transition-colors ${
                    activeFocusModule === "agenda"
                      ? "text-primary bg-primary/10 hover:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Grid3X3 className="h-8 w-8" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={addNewAgendaItem}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New
              </Button>
            </div>
            <div className="space-y-3">
              {agendaItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleAgendaDragStart(e, item.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleAgendaDrop(e, index)}
                  className="flex items-center gap-3 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-move group"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 font-medium text-sm rounded-full flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    {editingAgendaTitle === item.id ? (
                      <Input
                        value={editingAgendaTitleValue}
                        onChange={(e) =>
                          setEditingAgendaTitleValue(e.target.value)
                        }
                        onBlur={handleAgendaTitleSave}
                        onKeyDown={handleAgendaTitleKeyDown}
                        className="font-medium"
                        autoFocus
                      />
                    ) : (
                      <h4
                        className={`font-medium cursor-pointer hover:text-primary transition-colors ${
                          item.completed
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                        onClick={() =>
                          handleAgendaTitleClick(item.id, item.title)
                        }
                      >
                        {item.title}
                      </h4>
                    )}
                    {editingAgendaDescription === item.id ? (
                      <Input
                        value={editingAgendaDescriptionValue}
                        onChange={(e) =>
                          setEditingAgendaDescriptionValue(e.target.value)
                        }
                        onBlur={handleAgendaDescriptionSave}
                        onKeyDown={handleAgendaDescriptionKeyDown}
                        className="text-sm mt-1"
                        autoFocus
                      />
                    ) : (
                      <p
                        className={`text-sm text-muted-foreground mt-1 cursor-pointer hover:text-foreground transition-colors ${
                          item.completed ? "line-through" : ""
                        }`}
                        onClick={() =>
                          handleAgendaDescriptionClick(
                            item.id,
                            item.description || "",
                          )
                        }
                      >
                        {item.description || "Add description..."}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {editingAgendaOwner === item.id ? (
                      <Input
                        value={editingAgendaOwnerValue}
                        onChange={(e) =>
                          setEditingAgendaOwnerValue(e.target.value)
                        }
                        onBlur={handleAgendaOwnerSave}
                        onKeyDown={handleAgendaOwnerKeyDown}
                        className="text-sm w-32"
                        autoFocus
                      />
                    ) : (
                      <p
                        className={`text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-right ${
                          item.completed ? "line-through" : ""
                        }`}
                        onClick={() =>
                          handleAgendaOwnerClick(item.id, item.owner || "")
                        }
                      >
                        {item.owner || "No Owner"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Agenda Item
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{item.title}"? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeAgendaItem(item.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    {!item.completed && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-green-600"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Mark as Complete
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to mark "{item.title}" as
                              complete?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => markAgendaItemComplete(item.id)}
                              className="bg-green-600 text-white hover:bg-green-700"
                            >
                              Yes, Mark as Complete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialog for adding goal to agenda */}
        <AlertDialog
          open={!!pendingGoalToAgenda}
          onOpenChange={() => setPendingGoalToAgenda(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Add Goal to Agenda</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to add "{pendingGoalToAgenda?.goalName}"
                to the agenda?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelAddGoalToAgenda}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmAddGoalToAgenda}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Yes, Add to Agenda
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirmation Dialog for adding action item to agenda */}
        <AlertDialog
          open={!!pendingActionToAgenda}
          onOpenChange={() => setPendingActionToAgenda(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Add Action Item to Agenda</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to add "
                {pendingActionToAgenda?.actionTitle}" to the agenda?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelAddActionToAgenda}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmAddActionToAgenda}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Yes, Add to Agenda
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirmation Dialog for adding blocker item to agenda */}
        <AlertDialog
          open={!!pendingBlockerToAgenda}
          onOpenChange={() => setPendingBlockerToAgenda(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Add Blocker to Agenda</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to add "
                {pendingBlockerToAgenda?.blockerTitle}" to the agenda?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelAddBlockerToAgenda}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmAddBlockerToAgenda}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Yes, Add to Agenda
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
