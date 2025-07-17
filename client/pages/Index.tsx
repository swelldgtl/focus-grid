import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  GripVertical,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
}

interface SaleRecord {
  id: string;
  product: string;
  customer: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  date: string;
}

export default function Index() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Review Q4 performance metrics",
      status: "pending",
      priority: "high",
    },
    {
      id: "2",
      title: "Update client documentation",
      status: "in_progress",
      priority: "medium",
    },
    {
      id: "3",
      title: "Prepare monthly newsletter",
      status: "completed",
      priority: "low",
    },
    {
      id: "4",
      title: "Analyze user feedback",
      status: "pending",
      priority: "medium",
    },
    {
      id: "5",
      title: "Optimize database queries",
      status: "in_progress",
      priority: "high",
    },
  ]);

  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const salesData: SaleRecord[] = [
    {
      id: "1",
      product: "Pro Subscription",
      customer: "Acme Corp",
      amount: 2500,
      status: "paid",
      date: "2024-01-15",
    },
    {
      id: "2",
      product: "Starter Plan",
      customer: "TechStart Inc",
      amount: 500,
      status: "pending",
      date: "2024-01-14",
    },
    {
      id: "3",
      product: "Enterprise License",
      customer: "Global Systems",
      amount: 10000,
      status: "paid",
      date: "2024-01-13",
    },
    {
      id: "4",
      product: "Premium Support",
      customer: "DevCorp",
      amount: 1200,
      status: "overdue",
      date: "2024-01-10",
    },
    {
      id: "5",
      product: "Custom Integration",
      customer: "DataFlow Ltd",
      amount: 7500,
      status: "paid",
      date: "2024-01-12",
    },
  ];

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    taskId: string,
  ) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    dropIndex: number,
  ) => {
    e.preventDefault();
    if (!draggedTask) return;

    const draggedIndex = tasks.findIndex((task) => task.id === draggedTask);
    if (draggedIndex === -1) return;

    const newTasks = [...tasks];
    const [draggedItem] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(dropIndex, 0, draggedItem);

    setTasks(newTasks);
    setDraggedTask(null);
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
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              A summary of your recent sales transactions and their current
              status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                      {sale.product}
                    </TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>
                      {new Date(sale.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusBadge(sale.status)}
                        variant="secondary"
                      >
                        {sale.status.charAt(0).toUpperCase() +
                          sale.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${sale.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Draggable Task List */}
        <Card>
          <CardHeader>
            <CardTitle>Task Management</CardTitle>
            <CardDescription>
              Drag and drop to reorder tasks by priority. Stay organized and
              focused.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="flex items-center gap-3 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-move group"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div className="flex-1">
                    <h4 className="font-medium">{task.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={getPriorityBadge(task.priority)}
                      variant="secondary"
                    >
                      {task.priority}
                    </Badge>
                    <Badge
                      className={getTaskStatusBadge(task.status)}
                      variant="secondary"
                    >
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
