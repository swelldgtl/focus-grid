# Multi-Tenant Netlify Deployment Guide

## Overview
Deploy the same Focus Grid codebase to multiple Netlify sites with different client configurations.

## Sites to Create

### 1. Blue Label Packaging
- **Site Name**: `blue-label-packaging-focus-grid`
- **Domain**: `bluelabelpackaging.domain.com`
- **Environment Variables** (copy from `.env.bluelabel`):
  ```
  DATABASE_URL=postgresql://neondb_owner:npg_mfqu8lM7oDzj@ep-polished-dew-adh5wbkv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
  CLIENT_ID=fbf03fbc-bf81-462b-a88f-668dfcb09acc
  CLIENT_NAME=Blue Label Packaging
  APP_MODE=client
  PRIMARY_COLOR=#1E40AF
  BASE_DOMAIN=bluelabelpackaging.domain.com
  ```

### 2. ERC
- **Site Name**: `erc-focus-grid`
- **Domain**: `erc.domain.com`
- **Environment Variables** (copy from `.env.erc`):
  ```
  DATABASE_URL=postgresql://neondb_owner:npg_mfqu8lM7oDzj@ep-polished-dew-adh5wbkv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
  CLIENT_ID=360e6a09-c7e2-447e-8dbc-cebae72f1ff2
  CLIENT_NAME=ERC
  APP_MODE=client
  PRIMARY_COLOR=#059669
  BASE_DOMAIN=erc.domain.com
  ```

### 3. Admin Dashboard
- **Site Name**: `focus-grid-admin`
- **Domain**: `admin.focusgrid.com`
- **Environment Variables** (copy from `.env.admin`):
  ```
  DATABASE_URL=postgresql://neondb_owner:npg_mfqu8lM7oDzj@ep-polished-dew-adh5wbkv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
  CLIENT_ID=8323e82d-075a-496d-8861-a86d862a67bc
  CLIENT_NAME=Focus Grid Admin
  APP_MODE=admin
  PRIMARY_COLOR=#DC2626
  SHOW_FEATURE_ADMIN=true
  ```

## Deployment Steps

### For Each Site:

1. **Create New Site in Netlify**
   - Go to Netlify dashboard
   - Click "Add new site" → "Import an existing project"
   - Connect to your GitHub repository
   - Choose the same branch (main) for all sites

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist/spa`
   - Functions directory: `netlify/functions`

3. **Set Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add all variables from the respective `.env.*` file above
   - Make sure `DATABASE_URL` is identical for all sites (same database)
   - Each site has a unique `CLIENT_ID`

4. **Configure Custom Domain**
   - Go to Site Settings → Domain management
   - Add custom domain
   - Set up DNS records as instructed by Netlify

## Expected Results

### Blue Label Packaging Site (`bluelabelpackaging.domain.com`):
- Blue branding
- Shows: Goals & Progress, Long-Term Goals, Action Plan, Agenda
- **Hidden**: Blockers & Issues (disabled for this client)

### ERC Site (`erc.domain.com`):
- Green branding  
- Shows: Goals & Progress, Action Plan, Blockers & Issues, Agenda
- **Hidden**: Long-Term Goals (disabled for this client)

### Admin Site (`admin.focusgrid.com`):
- Red branding
- Shows: All modules + Feature Admin panel
- Can manage all clients

## Testing

After deployment, verify:
1. Each site loads with correct branding
2. Correct modules are visible/hidden per client
3. Feature Admin works on admin site
4. Database changes affect all sites appropriately

## Managing Clients

- **Add new client**: Create in database + new Netlify site
- **Change features**: Update via admin site or database
- **Update branding**: Change environment variables and redeploy
