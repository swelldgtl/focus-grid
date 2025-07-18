import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload, Trash2, Settings } from "lucide-react";
import {
  exportAllData,
  importAllData,
  clearAllStoredData,
} from "@/lib/storage";

export function DataManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [importData, setImportData] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExport = () => {
    try {
      const data = exportAllData();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `focus-grid-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsOpen(false);
    } catch (error) {
      alert("Export failed. Please try again.");
    }
  };

  const handleImport = () => {
    try {
      if (!importData.trim()) {
        return;
      }

      const success = importAllData(importData);
      if (success) {
        setIsOpen(false);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        alert(
          "Import failed. Invalid backup data format. Please check your data and try again.",
        );
      }
    } catch (error) {
      alert("Import failed. Please check the format and try again.");
    }
  };

  const handleClearAll = () => {
    try {
      clearAllStoredData();
      setShowClearConfirm(false);
      setIsOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      alert("Failed to clear data. Please try again.");
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Data Management - Click to backup, restore, or clear data"
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">Data Management</span>
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Data Management
            </DialogTitle>
            <DialogDescription>
              Export, import, or clear your Focus Grid data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Export Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-gray-600" />
                <h4 className="text-sm font-medium">Export Data</h4>
              </div>
              <Button
                onClick={handleExport}
                variant="outline"
                className="w-full justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Backup File
              </Button>
              <p className="text-xs text-muted-foreground">
                Downloads all your data as a JSON file with today's date
              </p>
            </div>

            {/* Import Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-gray-600" />
                <h4 className="text-sm font-medium">Import Data</h4>
              </div>
              <Textarea
                placeholder="Paste your backup data here..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="min-h-[100px] text-xs"
              />
              <Button
                onClick={handleImport}
                variant="outline"
                className="w-full justify-start"
                disabled={!importData.trim()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
              <p className="text-xs text-muted-foreground">
                Paste backup data above and click to restore
              </p>
            </div>

            {/* Clear Section */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                <h4 className="text-sm font-medium text-destructive">
                  Clear All Data
                </h4>
              </div>
              <Button
                onClick={() => setShowClearConfirm(true)}
                variant="destructive"
                className="w-full justify-start"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
              <p className="text-xs text-muted-foreground">
                Permanently removes all stored data and resets to defaults
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Clear All Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your Focus Grid data including
              goals, action items, agenda items, and blockers. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
