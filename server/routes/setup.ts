import { RequestHandler } from "express";

export const handleSetupAdminAuth: RequestHandler = async (req, res) => {
  try {
    const { neon } = await import("@neondatabase/serverless");

    const getDatabaseUrl = () => {
      const url = process.env.DATABASE_URL;
      if (!url) {
        throw new Error("DATABASE_URL environment variable is not set");
      }
      return url;
    };

    const sql = neon(getDatabaseUrl());

    // Create admin_users table
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP,
          is_active BOOLEAN DEFAULT true
      )
    `;

    // Create admin_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS admin_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at)`;

    // Insert default admin user (password: admin123)
    await sql`
      INSERT INTO admin_users (username, email, password_hash)
      VALUES ('admin', 'admin@swellfocusgrid.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
      ON CONFLICT (username) DO NOTHING
    `;

    // Create action_items table
    await sql`
      CREATE TABLE IF NOT EXISTS action_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          title VARCHAR(500) NOT NULL,
          status VARCHAR(20) DEFAULT 'on-track' CHECK (status IN ('on-track', 'off-track')),
          due_date DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for action_items
    await sql`CREATE INDEX IF NOT EXISTS idx_action_items_client_id ON action_items(client_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date)`;

    return res.status(200).json({
      success: true,
      message: "Admin authentication and action items tables created successfully",
      defaultCredentials: {
        username: "admin",
        password: "admin123",
        note: "Please change these credentials after first login",
      },
    });
  } catch (error) {
    console.error("Setup admin auth error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to setup admin authentication",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
