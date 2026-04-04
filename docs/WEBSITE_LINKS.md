# 🌐 WEBSITE LINKS - CUSTOMER vs OWNER

## ⚠️ DEPLOYMENT REQUIRED

The website files are ready but NOT YET DEPLOYED. Run the deployment command to get your actual links.

---

## 🚀 DEPLOY NOW

```bash
# Option 1: Using npm
npm run deploy

# Option 2: Using script
chmod +x deploy-vercel.sh
./deploy-vercel.sh

# Option 3: Direct Vercel CLI
vercel --prod
```

---

## 🌐 CUSTOMER LINK (After Deployment)

**Main Website URL:**
```
https://[your-project-name].vercel.app/
```

**Or your custom domain:**
```
https://nolimitsbeyondlimitations.com
```

### Customer Pages (Public Access):
| Page | URL | Access |
|------|-----|--------|
| Homepage | `/` or `/index.html` | ✅ Everyone |
| Shop | `/shop.html` | ✅ Everyone |
| Product Design | `/design.html` | ✅ Everyone |
| Story/Remembrance | `/story-remembrance.html` | ✅ Everyone |
| Brothers Memorial | `/remembrance.html` | ✅ Everyone |
| About | `/about.html` | ✅ Everyone |
| Checkout Success | `/success.html` | ✅ Customers |
| Checkout Cancel | `/cancel.html` | ✅ Everyone |

---

## 🔐 OWNER LINKS (Private - YOU ONLY)

**Your Private Workshop:**
```
https://[your-project-name].vercel.app/private.html
```

**Admin Dashboard:**
```
https://[your-project-name].vercel.app/admin.html
```

**Order Management:**
```
https://[your-project-name].vercel.app/orders.html
```

**Music Studio:**
```
https://[your-project-name].vercel.app/album.html
```

---

## 🔑 HOW TO ACCESS OWNER PAGES

### Step 1: Visit Any Private Page
Go to: `https://[your-site].vercel.app/private.html`

### Step 2: Authenticate (Choose Method)

**Option A - Biometric (Fastest):**
- Use FaceID (iPhone/iPad)
- Use Touch ID (iPhone/Mac)
- Use Fingerprint (Android)
- Use Windows Hello (Windows)

**Option B - Password:**
- Username: `admin`
- Password: (set in environment variables)

### Step 3: Full Access Granted
Once authenticated, you can:
- Access ALL private pages
- Use owner-only voice commands
- View complete dashboard
- Control everything

---

## 📋 EXAMPLE AFTER DEPLOYMENT

### If your project name is "nlbl-shop":

**Customer Link:**
```
https://nlbl-shop.vercel.app/
```

**Owner Links:**
```
https://nlbl-shop.vercel.app/private.html
https://nlbl-shop.vercel.app/admin.html
https://nlbl-shop.vercel.app/orders.html
https://nlbl-shop.vercel.app/album.html
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

After deploying, you MUST:

1. **Configure Stripe Webhook:**
   - URL: `https://[your-site].vercel.app/api/stripe-webhook`
   - Events: `checkout.session.completed`

2. **Configure Printful Webhook:**
   - URL: `https://[your-site].vercel.app/api/printful-webhook`
   - Events: Order created, updated

3. **Test Customer Experience:**
   - Open incognito window
   - Browse products
   - Try voice commands (Ctrl+Shift+V)
   - Try AR preview (on mobile)

4. **Test Owner Access:**
   - Visit `/private.html`
   - Register biometric
   - Access all dashboards
   - Verify full control

5. **Delete Netlify:**
   - Delete all Netlify sites
   - Cancel Netlify account

---

## 🚨 SECURITY NOTE

**Customers who try to access owner links:**
- Will be redirected to login page
- Cannot bypass authentication
- Cannot see your private workshop
- Cannot access admin data

**Your biometric login is tied to YOUR device only.**
Customers cannot replicate it.

---

## 📞 NEXT STEP

**RUN THE DEPLOYMENT COMMAND NOW:**

```bash
vercel --prod
```

Then replace `[your-project-name]` in the URLs above with your actual Vercel project name.

---

*Ready to deploy the most revolutionary website in existence?*
