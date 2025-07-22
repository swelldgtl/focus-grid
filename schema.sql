-- Focus Grid Multi-Tenant Database Schema
-- Run this in your Neon database console

-- Clients table - stores information about each client/tenant
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  database_url TEXT, -- Optional: for separate databases per client
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Client features table - controls which features are enabled per client
CREATE TABLE IF NOT EXISTS client_features (
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (client_id, feature_name)
);

-- Goals table - client-specific goals data
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  target_metric TEXT,
  month1 TEXT,
  month2 TEXT,
  month3 TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Action items table - client-specific action items
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'on-track' CHECK (status IN ('on-track', 'off-track')),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Blockers table - client-specific blockers/issues
CREATE TABLE IF NOT EXISTS blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agenda items table - client-specific agenda items
CREATE TABLE IF NOT EXISTS agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Long-term goals table - client-specific long-term goals
CREATE TABLE IF NOT EXISTS long_term_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_goals_client_id ON goals(client_id);
CREATE INDEX IF NOT EXISTS idx_action_items_client_id ON action_items(client_id);
CREATE INDEX IF NOT EXISTS idx_blockers_client_id ON blockers(client_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_client_id ON agenda_items(client_id);
CREATE INDEX IF NOT EXISTS idx_long_term_goals_client_id ON long_term_goals(client_id);

-- Insert default features for new clients (trigger function)
CREATE OR REPLACE FUNCTION insert_default_features()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO client_features (client_id, feature_name, enabled) VALUES
    (NEW.id, 'long_term_goals', true),
    (NEW.id, 'action_plan', true),
    (NEW.id, 'blockers_issues', true),
    (NEW.id, 'agenda', true),
    (NEW.id, 'focus_mode', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add default features for new clients
DROP TRIGGER IF EXISTS trigger_insert_default_features ON clients;
CREATE TRIGGER trigger_insert_default_features
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION insert_default_features();

-- Sample data (remove in production)
-- INSERT INTO clients (name, slug) VALUES ('Demo Client', 'demo');
