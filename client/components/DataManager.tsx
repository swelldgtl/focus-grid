import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
  exportAllData,
  importAllData,
  clearAllStoredData,
} from "@/lib/storage";

export function DataManager() {
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
      const jsonData = prompt("Paste your backup data here:");
      if (!jsonData?.trim()) {
        return;
      }

      const success = importAllData(jsonData);
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
    if (
      confirm(
        "Are you sure you want to clear all Focus Grid data? This action cannot be undone.",
      )
    ) {
      try {
        clearAllStoredData();
        alert("All Focus Grid data has been cleared. The page will refresh.");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        alert("Failed to clear data. Please try again.");
      }
    }
  };

  const handleMenuClick = () => {
    const choice = prompt(
      "Data Management Options:\n\n" +
        "1 - Export/Download backup\n" +
        "2 - Import from backup\n" +
        "3 - Clear all data\n\n" +
        "Enter your choice (1, 2, or 3):",
    );

    switch (choice) {
      case "1":
        handleExport();
        break;
      case "2":
        handleImport();
        break;
      case "3":
        handleClearAll();
        break;
      default:
        if (choice) {
          alert("Invalid choice. Please try again.");
        }
        break;
    }
  };

  return (
    <button
      onClick={handleMenuClick}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      title="Data Management - Click to backup, restore, or clear data"
    >
      <Settings className="h-4 w-4" />
      <span className="text-sm">Data Management</span>
    </button>
  );
}
