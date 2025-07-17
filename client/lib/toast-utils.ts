import { toast } from "@/hooks/use-toast";

/**
 * Shows a simple "Changes saved" confirmation toast
 * Appears in upper right corner with gray styling
 * Fades in (0.5s) → stays visible (2s) → fades out (0.5s)
 */
export function showSaveToast() {
  toast({
    title: "Changes saved",
    className:
      "bg-gray-100 text-gray-700 border-gray-200 shadow-md top-4 right-4",
    duration: 2000, // 2 seconds visible
  });
}

/**
 * Toast notification types for different actions
 */
export const saveToastActions = {
  RECORD_ADDED: "showSaveToast",
  RECORD_DELETED: "showSaveToast",
  RECORD_MOVED: "showSaveToast",
  TEXT_EDITED: "showSaveToast",
} as const;
