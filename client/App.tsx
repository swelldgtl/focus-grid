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

// Suppress React Quill findDOMNode deprecation warnings while keeping other warnings
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('findDOMNode is deprecated')) {
    return; // Suppress this specific React Quill warning
  }
  originalConsoleWarn.apply(console, args);
};

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
