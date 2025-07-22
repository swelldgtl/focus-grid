import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { handleDemo } from "./routes/demo";
import { handleDatabaseTest, handleClientConfig } from "./routes/database";

// Load environment variables
dotenv.config({ path: '.env.local' });
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
      databaseUrlLength: process.env.DATABASE_URL?.length || 0
    });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/database/test", handleDatabaseTest);
  app.get("/api/config", handleClientConfig);

  return app;
}
