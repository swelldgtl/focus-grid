# Admin Console - Separate Netlify Project

This admin console is designed to be deployed as a separate Netlify project for the `admin.swellfocusgrid.com` subdomain.

## Quick Setup Guide

### 1. Create New Netlify Site

1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Select this repository

### 2. Configure Build Settings

- **Base directory**: `admin-app`
- **Build command**: `npm run build`
- **Publish directory**: `admin-app/dist`

### 3. Environment Variables

```
VITE_API_URL=https://swellfocusgrid.netlify.app/.netlify/functions
NODE_VERSION=18
```

### 4. Custom Domain

1. In Netlify site settings → Domain management → Custom domains
2. Add custom domain: `admin.swellfocusgrid.com`
3. Configure DNS as instructed by Netlify

## Benefits of Separate Deployment

- ✅ Independent deployment pipeline
- ✅ Separate build processes
- ✅ Clean domain separation
- ✅ Better security isolation
- ✅ Independent scaling

## Development

```bash
cd admin-app
npm install
npm run dev
```

## Deployment

Once configured, pushes to your main branch will automatically trigger admin console deployments at:

- Netlify URL: `https://your-admin-site.netlify.app`
- Custom domain: `https://admin.swellfocusgrid.com`

This is much cleaner than subdomain routing on a single site!
