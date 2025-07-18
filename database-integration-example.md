# Database Integration for Multi-Client Support

## Recommended Stack:

1. **Supabase** (PostgreSQL + Auth + Real-time)
2. **Neon** (Serverless PostgreSQL)
3. **Prisma** (ORM) + **Vercel** (Hosting)

## Database Schema Example:

```sql
-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_metric TEXT,
  month1 TEXT,
  month2 TEXT,
  month3 TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Action items table
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'on-track',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Continue for other modules...
```

## API Routes Example:

```typescript
// /api/clients/[clientId]/goals
// /api/clients/[clientId]/actions
// /api/clients/[clientId]/blockers
// /api/clients/[clientId]/agenda
```

This provides:

- True data isolation
- Scalability
- Real-time collaboration
- Backup/restore
- Analytics across clients
