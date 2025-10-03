# Deployment Guide for Classics Retold PWA

This guide covers deploying your PWA to various hosting platforms.

## Pre-Deployment Checklist

- [ ] All books have proper content (original and modern text)
- [ ] Book covers are in place (preferably JPG/PNG, not SVG for production)
- [ ] PWA icons are generated (PNG format recommended)
- [ ] App has been tested locally with `npm run build && npm run preview`
- [ ] Service worker caching works (test offline mode)
- [ ] App installs correctly on mobile devices

## Cloudflare Pages (Recommended)

### Why Cloudflare Pages?
- ✅ Unlimited bandwidth (free tier)
- ✅ Global CDN with excellent performance
- ✅ Automatic HTTPS
- ✅ Great PWA support
- ✅ Free custom domains
- ✅ Automatic deployments from Git

### Setup Steps

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/retold-classics.git
   git push -u origin main
   ```

2. **Create Cloudflare Pages Project**
   - Go to https://dash.cloudflare.com/
   - Click "Workers & Pages"
   - Click "Create application" → "Pages" → "Connect to Git"
   - Select your repository

3. **Configure Build Settings**
   - Framework preset: None (or Vite)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (leave default)
   - Environment variables: None needed

4. **Deploy**
   - Click "Save and Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at `your-project.pages.dev`

5. **Custom Domain (Optional)**
   - Go to Custom domains in your project
   - Click "Set up a custom domain"
   - Follow DNS configuration instructions

### Automatic Deployments

Every push to `main` branch will trigger a new deployment automatically.
Pull requests will create preview deployments.

## Vercel

### Setup Steps

1. **Install Vercel CLI (optional)**
   ```bash
   npm install -g vercel
   ```

2. **Deploy via CLI**
   ```bash
   vercel
   # Follow prompts
   ```

   Or use the Vercel dashboard:
   - Go to https://vercel.com/
   - Click "Add New" → "Project"
   - Import your Git repository
   - Configure:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Click "Deploy"

3. **Custom Domain**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

## Netlify

### Setup Steps

1. **Deploy via Drag & Drop (Quick Test)**
   - Build locally: `npm run build`
   - Go to https://app.netlify.com/drop
   - Drag the `dist` folder to the browser

2. **Deploy via Git (Production)**
   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Connect to your Git provider
   - Configure:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

3. **Configure `netlify.toml` (Optional)**
   ```toml
   ```toml
   name = "classics-retold"
   compatibility_date = "2025-01-01"   [[headers]]
     for = "/sw.js"
     [headers.values]
       Cache-Control = "no-cache"

   [[headers]]
     for = "/manifest.webmanifest"
     [headers.values]
       Content-Type = "application/manifest+json"
   ```

## GitHub Pages

### Setup Steps

1. **Update `vite.config.js`**
   ```javascript
   export default defineConfig({
     base: '/retold-classics/', // Your repo name
     // ... rest of config
   })
   ```

2. **Install gh-pages**
   ```bash
   npm install -D gh-pages
   ```

3. **Add deploy script to `package.json`**
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

5. **Configure GitHub Pages**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` → `/ (root)`
   - Save

Your app will be live at: `https://yourusername.github.io/retold-classics/`

## Railway

1. **Create `railway.toml`**
   ```toml
   [build]
   builder = "NIXPACKS"

   [deploy]
   startCommand = "npm run preview"
   ```

2. **Deploy**
   - Go to https://railway.app/
   - Click "Start a New Project"
   - Deploy from GitHub repo
   - Add environment variable: `PORT=3000`

## Testing After Deployment

### PWA Installation Test

1. **Chrome (Desktop)**
   - Visit your deployed URL
   - Look for install icon in address bar
   - Click to install
   - Verify app opens in standalone window

2. **iOS Safari**
   - Visit your deployed URL
   - Tap Share button
   - Tap "Add to Home Screen"
   - Verify icon appears on home screen
   - Open app and verify standalone mode

3. **Android Chrome**
   - Visit your deployed URL
   - Tap menu (three dots)
   - Tap "Add to Home screen"
   - Or look for automatic install prompt

### Offline Test

1. Open app in browser
2. Navigate to a book and read a chapter
3. Open DevTools → Network tab
4. Select "Offline" mode
5. Refresh the page
6. Verify app still works
7. Try navigating between chapters
8. Verify reading progress is saved

### Performance Test

1. Open app in Incognito/Private mode
2. Open DevTools → Lighthouse
3. Run audit for:
   - Performance
   - Accessibility
   - Best Practices
   - SEO
   - PWA
4. Aim for 90+ scores in all categories

## Environment Variables

This app doesn't require any environment variables for basic deployment.

If you add features that need API keys:

**Cloudflare Pages:**
- Settings → Environment variables → Add variable

**Vercel:**
- Project Settings → Environment Variables → Add

**Netlify:**
- Site settings → Environment variables → Add variable

## Custom Domain Setup

### DNS Configuration

For most providers, you'll need to add:

**Option 1: CNAME (Subdomain)**
```
Type: CNAME
Name: app (or www)
Value: your-project.pages.dev
```

**Option 2: A Record (Root Domain)**
```
Type: A
Name: @
Value: [IP provided by hosting provider]
```

### SSL/HTTPS

All recommended hosting providers provide automatic HTTPS:
- Cloudflare: Automatic
- Vercel: Automatic
- Netlify: Automatic
- GitHub Pages: Automatic

## Monitoring & Analytics

### Cloudflare Web Analytics (Free)

1. Go to Cloudflare dashboard → Web Analytics
2. Add your site
3. Copy the beacon script
4. Add to `index.html` before `</body>`:
   ```html
   <script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
           data-cf-beacon='{"token": "your-token"}'></script>
   ```

### Google Analytics

1. Get tracking ID from Google Analytics
2. Add to `index.html`:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'GA_MEASUREMENT_ID');
   </script>
   ```

## Troubleshooting

### Service Worker Not Updating

**Problem:** Users see old content after deployment

**Solution:**
1. Increment version in `package.json`
2. Clear hosting provider's cache
3. Users should hard refresh (Ctrl+Shift+R)

### Icons Not Showing

**Problem:** PWA icons don't appear

**Solution:**
1. Verify icons are PNG format (not SVG)
2. Check paths in `vite.config.js` manifest
3. Verify icons are in `dist/icons/` after build
4. Check browser console for 404 errors

### App Not Installing

**Problem:** Install prompt doesn't appear

**Solution:**
1. Verify HTTPS is enabled
2. Check manifest.json is valid
3. Verify service worker is registered
4. Check Chrome DevTools → Application → Manifest
5. Ensure all required icons are present

### Books Not Loading

**Problem:** Books show loading spinner forever

**Solution:**
1. Verify JSON files are in `dist/data/books/`
2. Check browser console for errors
3. Verify JSON is valid
4. Check file paths in `books.js`

## Performance Optimization

### Image Optimization

Convert book covers to WebP:
```bash
# Using ImageMagick
convert frankenstein.jpg -quality 85 frankenstein.webp
```

Update `books.js`:
```javascript
coverImage: '/images/covers/frankenstein.webp'
```

### Code Splitting

Vite automatically code-splits. To optimize further:

1. Lazy load books:
```javascript
const bookContent = await import(`/data/books/${bookId}.json`);
```

2. Compress JSON:
```bash
# Minify JSON files
npm install -g json-minify
json-minify book.json > book.min.json
```

### CDN Configuration

For Cloudflare Pages:
- Static assets are automatically cached globally
- Service worker provides additional caching layer
- No additional configuration needed

## Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: classics-retold
          directory: dist
```

## Backup & Rollback

### Cloudflare Pages

- All deployments are saved
- Click "View build" to see history
- Click "Rollback" next to any previous deployment

### Vercel

- Go to Deployments tab
- Click three dots next to any deployment
- Click "Promote to Production"

### Netlify

- Go to Deploys tab
- Click "Publish deploy" next to any previous deployment

## Support & Maintenance

### Regular Updates

1. Update dependencies monthly:
   ```bash
   npm update
   npm audit fix
   ```

2. Test after updates:
   ```bash
   npm run build
   npm run preview
   ```

3. Monitor browser compatibility

### Adding New Books

After adding a book:
1. Commit changes
2. Push to GitHub
3. Automatic deployment will trigger
4. Verify new book appears in production

---

## Quick Reference

| Platform | Build Command | Output Dir | Deploy Time |
|----------|--------------|------------|-------------|
| Cloudflare | `npm run build` | `dist` | 2-3 min |
| Vercel | `npm run build` | `dist` | 1-2 min |
| Netlify | `npm run build` | `dist` | 2-3 min |
| GitHub Pages | `npm run build` | `dist` | 3-5 min |

**Recommended:** Cloudflare Pages for unlimited bandwidth and best performance.

---

Need help? Check the main README.md or open an issue on GitHub.
