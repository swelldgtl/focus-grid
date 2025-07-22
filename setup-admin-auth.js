import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config();

async function setupAdminAuth() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error("DATABASE_URL environment variable is not set");
      process.exit(1);
    }

    console.log("Connecting to database...");
    const sql = neon(databaseUrl);

    // Read the SQL migration file
    const sqlContent = fs.readFileSync("admin-auth-schema.sql", "utf8");

    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
      if (statement.trim()) {
        await sql([statement]);
        console.log("✓ Executed:", statement.substring(0, 50) + "...");
      }
    }

    console.log("✅ Admin authentication tables created successfully!");
    console.log("\nDefault admin credentials:");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("\n⚠️  Make sure to change these credentials after first login!");

  } catch (error) {
    console.error("❌ Error setting up admin authentication:", error);
    process.exit(1);
  }
}

setupAdminAuth();
