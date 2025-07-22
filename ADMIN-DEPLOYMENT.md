# Admin Console Deployment Guide

## Step 1: Build and Deploy Admin App

### Local Testing First:

```bash
cd admin-app
npm install
npm run dev
# Test at http://localhost:5174
```

### Deploy to Netlify:

```bash
cd admin-app
npm run build
# This creates admin-dist/ folder
```

## Step 2: Create New Netlify Site

1. **In Netlify Dashboard:**
   - Click "Add new site" → "Deploy manually"
   - Drag and drop the `admin-dist` folder
   - OR connect to Git and set:
     - Build command: `cd admin-app && npm run build`
     - Publish directory: `admin-app/admin-dist`

## Step 3: Configure Custom Domain

1. **In Netlify Site Settings:**
   - Go to Domain management → Custom domains
   - Click "Add custom domain"
   - Enter: `admin.swellfocusgrid.com`
   - Netlify will provide DNS instructions

## Step 4: DNS Configuration

Add these DNS records to your domain provider:

```
Type: CNAME
Name: admin
Value: [your-netlify-site-name].netlify.app
```

## Step 5: Environment Variables

In Netlify site settings → Environment variables, add:

```
DATABASE_URL=your_neon_database_url
NEXT_PUBLIC_CLIENT_NAME=Admin
NODE_ENV=production
```

## Step 6: SSL Certificate

Netlify automatically provisions SSL certificates for custom domains.
Wait 5-10 minutes after DNS setup for certificate activation.

## Step 7: Test Deployment

1. Visit `https://admin.swellfocusgrid.com`
2. Verify all admin functions work
3. Test database connectivity
4. Confirm feature management works

## Troubleshooting

### If admin subdomain doesn't work:

- Check DNS propagation (can take up to 24 hours)
- Verify CNAME record is correct
- Check Netlify domain settings

### If API calls fail:

- Ensure environment variables are set
- Check CORS settings for admin subdomain
- Verify database URL is accessible

### If components don't load:

- Check build logs in Netlify
- Verify all dependencies are installed
- Check for TypeScript errors
