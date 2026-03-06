# Deployment Guide

This document provides detailed instructions for deploying GraphViz to various platforms.

## Prerequisites

- Node.js 16.x or higher
- npm or yarn
- Project has been built successfully (`npm run build`)

## Deployment Checklist

- [x] Code passes linting (`npm run lint`)
- [x] Build completes successfully (`npm run build`)
- [x] All algorithms tested and working
- [x] Modern UI responsive and optimized
- [x] Environment variables configured (if needed)

## Build Output

The production-ready files are in the `dist/` directory:
- `dist/index.html` - Main entry point
- `dist/assets/` - Bundled CSS and JavaScript
- Total size: ~218 KB (uncompressed), ~68 KB (gzipped)

## Platform-Specific Guides

### 1. **Vercel (Recommended)**

**Advantages:** Zero-config, automatic SPA routing, serverless functions

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Configuration:** Already provided in `vercel.json`

**Steps:**
1. Link GitHub account to Vercel
2. Import this repository
3. Vercel auto-detects Vite and deploys
4. Get a free `.vercel.app` domain

### 2. **Netlify**

**Advantages:** Easy deployment, continuous builds, preview deploys

```bash
# Using Netlify CLI
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

**Or drag-and-drop:**
1. Build project: `npm run build`
2. Visit netlify.com and drag `dist/` folder
3. Get instant deployment

**Configuration:** Already provided in `netlify.toml`

### 3. **GitHub Pages**

```bash
# Update vite.config.js with base path if needed:
export default defineConfig({
  base: '/graph-viz/',  // if deploying to github.com/username/graph-viz
  plugins: [react()],
})

npm run build
```

Then push to GitHub and enable Pages in repository settings.

### 4. **AWS S3 + CloudFront**

```bash
# Build
npm run build

# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name/
```

Configure CloudFront distribution for the S3 bucket.

### 5. **Azure Static Web Apps**

1. Build locally: `npm run build`
2. Create Azure account and Static Web Apps resource
3. Connect GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Output location: `dist`
5. Deploy automatically on push

### 6. **Google Firebase Hosting**

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting

# Deploy
firebase deploy
```

### 7. **DigitalOcean App Platform**

1. Push code to GitHub
2. Connect GitHub to DigitalOcean
3. Create new App
4. Select Vite/React configuration
5. Deploy automatically

### 8. **Self-Hosted (Traditional Server)**

```bash
# Build
npm run build

# SCP to server
scp -r dist/* user@your-server:/var/www/graph-viz/

# Configure web server (Nginx example)
server {
    listen 80;
    server_name graph-viz.example.com;
    root /var/www/graph-viz;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**For Apache:**
```
<Directory /var/www/graph-viz>
  <IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
  </IfModule>
</Directory>
```

## Environment Configuration

No environment variables are currently required. The application is fully client-side.

If you need to add API endpoints in the future:
1. Create `.env` file with variables
2. Reference as `import.meta.env.VITE_*`
3. Build will include defined environment variables

## Performance Optimization

The build is already optimized:
- ✅ Tree-shaken unused code
- ✅ Code-split for better caching
- ✅ Gzip compression (~68 KB)
- ✅ CSS variables for efficient theming
- ✅ Minimal dependencies

## Security

- ✅ No external API calls (fully client-side)
- ✅ No sensitive data storage
- ✅ No user tracking
- ✅ CORS not required

## Monitoring & Logging

For self-hosted deployments, enable:
- Web server access logs
- Error tracking (optional: Sentry)
- uptime monitoring (optional: UptimeRobot)

## Rollback Plan

If issues arise after deployment:

```bash
# Vercel
vercel --prod rollback

# Netlify
netlify deploy --prod --dir=dist (from previous commit)

# Self-hosted
# Keep distN-1 backup and switch symlink
```

## CI/CD Pipeline

GitHub Actions workflow is configured in `.github/workflows/build.yml`:
- Runs on every push to main/master
- Tests with Node 18 and 20
- Builds successfully
- Runs linter checks
- Uploads artifacts

To enable automatic deployments:
1. Connect Vercel/Netlify to GitHub
2. They'll auto-deploy on push
3. Preview deploys on PR

## Support & Troubleshooting

**Issue:** Build artifacts not loading
- Solution: Check that `dist/index.html` is served as fallback for all routes

**Issue:** Styles not applying
- Solution: Ensure CSS files are in `dist/assets/`

**Issue:** Old version still showing
- Solution: Clear browser cache (Ctrl+Shift+Delete) or hard refresh (Ctrl+F5)

## Next Steps

1. Choose your deployment platform
2. Follow platform-specific guide above
3. Verify deployment works
4. Configure custom domain (optional)
5. Set up monitoring (recommended)

---

**Status:** ✅ Ready for Production Deployment
