# Deploy Admin Console as Separate Netlify Site

## ✅ Ready to Deploy!

Your admin console is now configured as a standalone application that can be deployed as a separate Netlify project for `admin.swellfocusgrid.com`.

## Step-by-Step Setup

### 1. Create New Netlify Site

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git repository (GitHub/GitLab/Bitbucket)
4. Select the repository containing your Focus Grid project

### 2. Configure Build Settings

When setting up the site, use these exact settings:

```
Base directory: admin-app
Build command: npm run build
Publish directory: admin-app/dist
Node version: 18
```

### 3. Environment Variables

Add these environment variables in Netlify site settings:

```bash
# Required
NODE_VERSION=18

# Optional (for API calls)
VITE_API_URL=https://swellfocusgrid.netlify.app/.netlify/functions
```

### 4. Add Custom Domain

1. Go to your new admin site's settings
2. Navigate to **"Domain management"** → **"Custom domains"**
3. Click **"Add custom domain"**
4. Enter: `admin.swellfocusgrid.com`
5. Follow Netlify's DNS configuration instructions

### 5. Deploy!

Once configured, Netlify will automatically deploy. Your admin console will be available at:

- **Temporary URL**: `https://your-admin-site-name.netlify.app`
- **Custom Domain**: `https://admin.swellfocusgrid.com` (once DNS propagates)

## ✨ Benefits

✅ **Clean Separation** - Admin and client apps are completely independent  
✅ **Independent Deployments** - Deploy admin changes without affecting main site  
✅ **Better Security** - Admin console is isolated from client-facing app  
✅ **Easier Management** - Clear separation of concerns  
✅ **No Complex Routing** - No subdomain routing needed

## 🔧 Development

To work on the admin console locally:

```bash
cd admin-app
npm install
npm run dev
```

The admin console will be available at `http://localhost:5173`

## 🚀 Future Updates

When you make changes to the admin console:

1. Commit and push changes to your repository
2. Netlify automatically detects changes in the `admin-app/` directory
3. Admin site rebuilds and deploys automatically
4. Main site is unaffected

This approach is much cleaner than subdomain routing on a single site!
