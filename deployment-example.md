# Multi-Client Deployment Options

## Option 1: Environment Variables

Create different `.env` files for each client:

### `.env.client1`

```
VITE_CLIENT_NAME="Acme Corp"
VITE_CLIENT_ID="acme-corp"
VITE_PRIMARY_COLOR="#ff6b6b"
VITE_STORAGE_PREFIX="acme_"
```

### `.env.client2`

```
VITE_CLIENT_NAME="Tech Startup"
VITE_CLIENT_ID="tech-startup"
VITE_PRIMARY_COLOR="#4ecdc4"
VITE_STORAGE_PREFIX="tech_"
```

## Option 2: Build-time Configuration

```bash
# Build for different clients
npm run build:acme
npm run build:tech
```

Package.json scripts:

```json
{
  "scripts": {
    "build:acme": "cp .env.acme .env && npm run build",
    "build:tech": "cp .env.tech .env && npm run build"
  }
}
```

## Option 3: Netlify/Vercel Multi-site

Deploy the same codebase to multiple sites:

- acme-corp-focus-grid.netlify.app
- tech-startup-focus-grid.netlify.app

Each with different environment variables.
