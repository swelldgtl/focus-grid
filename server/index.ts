import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { handleDemo } from "./routes/demo";
import {
  handleDatabaseTest,
  handleClientConfig,
  handleGetClients,
  handleCreateClient,
  handleUpdateClient,
  handleDeleteClient
} from "./routes/database";
import {
  handleCreateNetlifyProject,
  handleSetNetlifyEnvVars,
  handleDeployNetlifyProject
} from "./routes/netlify";
import {
  handleGetSystemConfig,
  handleUpdateSystemConfig,
  handleGetFeatureDefaults,
  handleUpdateFeatureDefaults,
  handleSystemHealth
} from "./routes/admin";
import {
  handleFeatureToggle,
  handleGetFeatures,
} from "./routes/feature-toggle";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config(); // Also load .env if it exists

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/env-test", (_req, res) => {
    res.json({
      message: "Environment test",
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      clientId: process.env.CLIENT_ID,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/database/test", handleDatabaseTest);
  app.get("/api/config", handleClientConfig);
  app.get("/api/features", handleGetFeatures);
  app.post("/api/features/toggle", handleFeatureToggle);
  app.get("/api/clients", handleGetClients);
  app.post("/api/clients", handleCreateClient);
  app.put("/api/clients/:clientId", handleUpdateClient);
  app.delete("/api/clients/:clientId", handleDeleteClient);
  app.post("/api/netlify/create-project", handleCreateNetlifyProject);
  app.post("/api/netlify/set-env-vars", handleSetNetlifyEnvVars);
  app.post("/api/netlify/deploy", handleDeployNetlifyProject);
  app.get("/api/admin/system-config", handleGetSystemConfig);
  app.post("/api/admin/system-config", handleUpdateSystemConfig);
  app.get("/api/admin/feature-defaults", handleGetFeatureDefaults);
  app.post("/api/admin/feature-defaults", handleUpdateFeatureDefaults);
  app.get("/api/admin/health", handleSystemHealth);

  return app;
}
