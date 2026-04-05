# Google Analytics Setup - Your Project Details

**Project Number:** 858344010852
**Project ID:** refined-outlet-439411-c8

---

## Step 1: Enable Analytics API (DO THIS FIRST!)

1. Go to: https://console.cloud.google.com/apis/enable?project=refined-outlet-439411-c8
2. Click **"Enable APIs and Services"**
3. Search for: **"Google Analytics Data API"**
4. Click on it and click **Enable**

---

## Step 2: Create Service Account & Get JSON Key

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=refined-outlet-439411-c8
2. Click **"Create Service Account"**
3. Fill in:
   - Name: `nlbl-analytics`
   - Description: `Analytics for NLBL Website`
4. Click **Done**
5. Click on the new service account (you'll see an email like `nlbl-analytics@refined-outlet-439411-c8.iam.gserviceaccount.com`)
6. Go to **Keys** tab
7. Click **"Add Key"** > **"Create new key"**
8. Select **JSON** format
9. Click **Create** - it downloads a file

---

## Step 3: Get Your GA Property ID

1. Go to: https://analytics.google.com/
2. Click **Admin** (gear icon bottom left)
3. Make sure "No Limits Beyond Limitations" property is selected
4. Under "Property" column, click **Property Settings**
5. Copy the **Property ID** (a number like `123456789`)

---

## Step 4: Add Service Account to GA

1. In Google Analytics Admin (still in analytics.google.com)
2. Click **"Property Access Management"** (under User Management)
3. Click **+** button
4. Add this email:
   ```
   nlbl-analytics@refined-outlet-439411-c8.iam.gserviceaccount.com
   ```
5. Select role: **Viewer**
6. Click **Save**

---

## Step 5: Add to Vercel

Once you have the JSON file from Step 2, add these env vars to Vercel:

```
GA_PROPERTY_ID=YOUR_PROPERTY_ID_HERE
```

For `GOOGLE_APPLICATION_CREDENTIALS`, copy the entire JSON content from your downloaded file and paste it as the value.

---

## Need Help?

The JSON file contains your private key - share the **Project ID** and **Service Account Email** with me, and I can help format it for Vercel. Just make sure not to share the actual private key in chat!
