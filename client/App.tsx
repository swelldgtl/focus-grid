import "./global.css";

import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initializeFetchWrapper } from "@/lib/fetch-wrapper";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";

// Initialize fetch wrapper to handle FullStory and other interception issues
initializeFetchWrapper();

// Comprehensive React Quill warning suppression
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Store original React development warning handler
const originalReactDOMWarn = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
  ?.onCommitFiberRoot;

// Suppress all React Quill related warnings and errors
const suppressReactQuillWarnings = (...args: any[]) => {
  const message = String(args[0] || "");
  return (
    message.includes("findDOMNode is deprecated") ||
    message.includes("ReactQuill") ||
    message.includes("react-quill") ||
    message.includes("Warning: findDOMNode") ||
    message.includes("ReactQuill2")
  );
};

console.warn = (...args) => {
  if (suppressReactQuillWarnings(...args)) {
    return; // Suppress React Quill warnings
  }
  originalConsoleWarn.apply(console, args);
};

console.error = (...args) => {
  if (suppressReactQuillWarnings(...args)) {
    return; // Suppress React Quill errors
  }
  originalConsoleError.apply(console, args);
};

// Also suppress React development mode warnings
if (typeof window !== "undefined") {
  const originalWindowError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (suppressReactQuillWarnings(message)) {
      return true; // Prevent default error handling
    }
    if (originalWindowError) {
      return originalWindowError(message, source, lineno, colno, error);
    }
    return false;
  };
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
