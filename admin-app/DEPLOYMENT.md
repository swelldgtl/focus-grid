# Admin Console Deployment Guide

## Setting up a new Netlify project for the Admin Console

### Step 1: Create a new Netlify site
1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Choose the repository containing your Focus Grid project

### Step 2: Configure build settings
- **Base directory**: `admin-app`
- **Build command**: `npm run build`
- **Publish directory**: `admin-app/dist`

### Step 3: Set up environment variables
Add these environment variables in Netlify:
```
VITE_API_URL=https://your-main-api-url.netlify.app/.netlify/functions
NODE_VERSION=18
```

### Step 4: Add custom domain
1. Go to your new site's settings
2. Navigate to "Domain management" → "Custom domains"
3. Click "Add custom domain"
4. Enter: `admin.swellfocusgrid.com`
5. Follow the DNS configuration instructions

### Step 5: Deploy
Once configured, Netlify will automatically deploy your admin console. It will be available at:
- Netlify URL: `https://your-site-name.netlify.app`
- Custom domain: `https://admin.swellfocusgrid.com` (once DNS is configured)

## Benefits of separate deployment:
- Independent deployment pipeline
- Separate build processes
- Cleaner domain management
- Better separation of concerns
- Independent scaling and monitoring

## Development
To run the admin app locally:
```bash
cd admin-app
npm install
npm run dev
```

The admin console will be available at http://localhost:5173
