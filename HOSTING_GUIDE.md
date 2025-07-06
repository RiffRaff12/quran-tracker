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