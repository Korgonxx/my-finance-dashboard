# Deployment Guide for Vercel

## Quick Deploy

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
cd finance-dashboard
vercel
```

4. Follow the prompts and your app will be deployed!

### Option 2: Deploy via Vercel Dashboard

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)

3. Click "Add New Project"

4. Import your GitHub repository

5. Vercel will auto-detect Next.js and configure everything

6. Click "Deploy"

## Environment Variables (Optional)

If you want to use Google Sheets API:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add these variables:
   - `NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY`
   - `NEXT_PUBLIC_GOOGLE_SHEETS_ID`

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Build Settings

The project uses these default settings:
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

## Performance Optimizations

The app is already optimized for Vercel with:
- ✅ Static page generation
- ✅ Image optimization
- ✅ Automatic code splitting
- ✅ Edge caching
- ✅ Gzip compression

## Post-Deployment

After deployment, your app will be available at:
- `https://your-project-name.vercel.app`

You can also:
- Set up automatic deployments from GitHub
- Configure preview deployments for pull requests
- Monitor analytics and performance

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure Node version is compatible (18.x or higher)
- Review build logs in Vercel dashboard

### Images Not Loading
- Make sure images are in the `public` folder
- Check image paths are correct
- Verify image formats are supported

### Dark Mode Not Working
- Clear browser cache
- Check localStorage is enabled
- Verify JavaScript is enabled

## Support

For issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Review [Next.js Documentation](https://nextjs.org/docs)
- Open an issue on GitHub

---

Happy Deploying! 🚀
