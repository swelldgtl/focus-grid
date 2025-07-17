import { toast } from "@/hooks/use-toast";

/**
 * Shows a simple "Changes saved" confirmation toast
 */
export function showSaveToast() {
  toast({
    title: "Changes saved",
    className: "bg-muted text-muted-foreground border-border",
    duration: 2000, // 2 seconds visible + 0.5s fade in + 0.5s fade out = 3s total
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
