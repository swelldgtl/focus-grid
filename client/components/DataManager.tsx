"use client";

import React, { useState } from "react";
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
  AlertDialogTrigger,
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

      alert("Export successful! Your Focus Grid data has been downloaded.");
    } catch (error) {
      alert("Export failed. Please try again.");
    }
  };

  const handleImport = () => {
    try {
      if (!importData.trim()) {
        alert("Please paste your backup data first.");
        return;
      }

      const success = importAllData(importData);
      if (success) {
        alert("Import successful! The page will refresh to load your data.");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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
      alert("All Focus Grid data has been cleared. The page will refresh.");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      alert("Failed to clear data. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          title="Data Management"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Data Management</DialogTitle>
          <DialogDescription>
            Export, import, or clear your Focus Grid data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium">Export Data</h4>
            <Button onClick={handleExport} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Backup
            </Button>
            <p className="text-xs text-muted-foreground">
              Downloads all your data as a JSON file
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium">Import Data</h4>
            <Textarea
              placeholder="Paste your backup data here..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="min-h-[100px] text-xs"
            />
            <Button onClick={handleImport} variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
            <p className="text-xs text-muted-foreground">
              Paste backup data and click to restore
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium text-destructive">
              Danger Zone
            </h4>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your Focus Grid data
                    including goals, action items, agenda items, and blockers.
                    This action cannot be undone.
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
            <p className="text-xs text-muted-foreground">
              Permanently removes all stored data
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
  );
}
