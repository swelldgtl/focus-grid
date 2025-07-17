import { useState } from "react";
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
  const [editingCell, setEditingCell] = useState<{
    goalId: string;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");

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

        {/* Callout Alert */}
        <Alert className="border-primary/20 bg-primary/5">
          <TrendingUp className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Great news!</strong> Your revenue is up 23% compared to last
            month. Keep up the excellent work and consider expanding your
            marketing efforts.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$21,700</div>
              <p className="text-xs text-muted-foreground">
                +23% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,350</div>
              <p className="text-xs text-muted-foreground">
                +180 from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2%</div>
              <p className="text-xs text-muted-foreground">
                +0.4% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Goals & Progress</CardTitle>
            <CardDescription>
              Track your key business objectives and monitor progress over the
              past three months.
            </CardDescription>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Two-Column Task Management Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Action Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Action Plan</CardTitle>
              <CardDescription>
                Drag and drop to reorder action items. Track progress and stay
                focused on your goals.
              </CardDescription>
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

          {/* Right Column - Blockers & Issues */}
          <Card>
            <CardHeader>
              <CardTitle>Blockers & Issues</CardTitle>
              <CardDescription>
                Track and prioritize current blockers and issues affecting
                progress.
              </CardDescription>
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
                      <p className="text-sm text-muted-foreground mt-1">
                        {blocker.description}
                      </p>
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
        </div>
      </div>
    </div>
  );
}
