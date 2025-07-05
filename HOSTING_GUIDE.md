# Legal Documents Hosting Guide

## 🚀 Quick Solutions for Hosting Legal Documents

### Option 1: GitHub Pages (Recommended - Free)

**Step 1: Enable GitHub Pages**
1. Go to your GitHub repository
2. Click "Settings" → "Pages"
3. Under "Source", select "Deploy from a branch"
4. Choose "main" branch and "/docs" folder
5. Click "Save"

**Step 2: Your URLs will be:**
- Privacy Policy: `https://[your-username].github.io/[repo-name]/docs/privacy-policy.html`
- Terms of Service: `https://[your-username].github.io/[repo-name]/docs/terms-of-service.html`
- Combined Page: `https://[your-username].github.io/[repo-name]/docs/`

**Step 3: Update Google Play Console**
- Privacy Policy URL: `https://[your-username].github.io/[repo-name]/docs/privacy-policy.html`
- Terms of Service URL: `https://[your-username].github.io/[repo-name]/docs/terms-of-service.html`

### Option 2: Netlify (Free)

**Step 1: Deploy to Netlify**
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Select your repository
5. Set build command: `echo "No build required"`
6. Set publish directory: `docs`
7. Click "Deploy site"

**Step 2: Your URLs will be:**
- Privacy Policy: `https://[your-site-name].netlify.app/privacy-policy.html`
- Terms of Service: `https://[your-site-name].netlify.app/terms-of-service.html`

### Option 3: Vercel (Free)

**Step 1: Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your repository
5. Set root directory to `docs`
6. Click "Deploy"

**Step 2: Your URLs will be:**
- Privacy Policy: `https://[your-project-name].vercel.app/privacy-policy.html`
- Terms of Service: `https://[your-project-name].vercel.app/terms-of-service.html`

### Option 4: Firebase Hosting (Free)

**Step 1: Set up Firebase**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select your project and set public directory to 'docs'
firebase deploy
```

**Step 2: Your URLs will be:**
- Privacy Policy: `https://[your-project-id].web.app/privacy-policy.html`
- Terms of Service: `https://[your-project-id].web.app/terms-of-service.html`

## 📝 Custom Domain (Optional)

If you want a custom domain like `quranrevisiontracker.com`:

### Option 1: GitHub Pages with Custom Domain
1. Buy a domain (Namecheap, GoDaddy, etc.)
2. In GitHub Pages settings, add your custom domain
3. Update DNS records as instructed
4. Your URLs become:
   - `https://quranrevisiontracker.com/privacy-policy.html`
   - `https://quranrevisiontracker.com/terms-of-service.html`

### Option 2: Netlify with Custom Domain
1. In Netlify dashboard, go to "Domain settings"
2. Add custom domain
3. Update DNS records
4. Enable HTTPS automatically

## 🔧 Update Contact Information

Before deploying, update the contact information in the HTML files:

**In both `privacy-policy.html` and `terms-of-service.html`:**
```html
<li>Email: support@quranrevisiontracker.com</li>
<li>Website: https://quranrevisiontracker.com</li>
```

Replace with your actual contact information.

## ✅ Verification Checklist

After hosting, verify:

- [ ] Privacy Policy loads correctly
- [ ] Terms of Service loads correctly
- [ ] Pages are mobile-friendly
- [ ] HTTPS is enabled (required by Google Play)
- [ ] URLs are accessible without authentication
- [ ] Content is properly formatted

## 🎯 Google Play Console Setup

Once hosted, in Google Play Console:

1. **App Content** → **Privacy Policy**
   - Add your Privacy Policy URL

2. **App Content** → **Terms of Service**
   - Add your Terms of Service URL

3. **Data Safety** → **Data Collection**
   - Mark all data collection as "No"

## 🚨 Important Notes

- **HTTPS Required**: Google Play requires HTTPS URLs
- **Always Accessible**: URLs must work 24/7
- **No Login Required**: Pages must be publicly accessible
- **Mobile Friendly**: Pages should work on mobile devices
- **Professional Appearance**: Clean, readable formatting

## 📞 Support

If you need help with hosting:
- **GitHub Pages**: [GitHub Pages Documentation](https://pages.github.com/)
- **Netlify**: [Netlify Documentation](https://docs.netlify.com/)
- **Vercel**: [Vercel Documentation](https://vercel.com/docs)
- **Firebase**: [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)

---

**Recommended**: Start with GitHub Pages as it's the simplest and most reliable option for hosting legal documents. 