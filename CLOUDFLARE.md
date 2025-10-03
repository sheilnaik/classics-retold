# Cloudflare Pages Configuration

## Deployment Settings

When deploying to Cloudflare Pages:

**Build Settings:**
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Node version: 18

**Environment Variables:**
None required for basic deployment

## Custom Domain

After deployment, you can add a custom domain:

1. Go to your Cloudflare Pages project
2. Click "Custom domains"
3. Add your domain
4. Update DNS records as instructed

## Automatic Deployments

Cloudflare Pages will automatically deploy:
- Production: on push to `main` branch
- Preview: on pull requests

## Cache Configuration

The service worker handles caching. No additional Cloudflare configuration needed.

## Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Deploy a React App](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-application/)
