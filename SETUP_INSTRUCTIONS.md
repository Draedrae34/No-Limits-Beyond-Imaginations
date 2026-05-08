## Neon Database Setup

Run this SQL in your Neon Console (SQL Editor):

```sql
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  paypal_order_id TEXT UNIQUE NOT NULL,
  product_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL,
  payer_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Also ensure these tables exist (for the adaptive engine):
CREATE TABLE IF NOT EXISTS adaptive_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  config JSONB,
  cache_mode_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS adaptive_schedule (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  schedule JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cached_catalog (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  catalog JSONB,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS optimization_logs (
  id SERIAL PRIMARY KEY,
  decision_type TEXT,
  reason TEXT,
  action TEXT,
  severity TEXT DEFAULT 'auto',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routine_logs (
  id SERIAL PRIMARY KEY,
  routine_type TEXT,
  report TEXT,
  duration_ms INT,
  auto_fixes INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → **Settings** → **Environment Variables**
2. Add these variables (set for **Production**, **Preview**, and **Development**):

| Name | Value | Notes |
|------|-------|-------|
| `DATABASE_URL` | `postgres://user:pass@ep-xxx.us-east-1.postgres.vercel-storage.com/db` | Your Neon connection string |
| `PAYPAL_CLIENT_ID` | `A_your_sandbox_client_id` | PayPal Sandbox Client ID |
| `PAYPAL_CLIENT_SECRET` | `E_your_sandbox_secret` | PayPal Sandbox Secret |
| `PRINTIFY_SHOP_ID` | `12345678` | Your Printify Shop ID |
| `PRINTIFY_API_KEY` | `shpat_your_api_key` | Your Printify API Key |
| `DISCORD_WEBHOOK_URL` | `https://discord.com/api/webhooks/...` | Your Discord Webhook URL |

3. **Important**: After adding env vars, **redeploy** your project (Vercel → Deployments → Latest → Redeploy)

## PayPal Sandbox Setup

1. Go to [PayPal Developer](https://developer.paypal.com/dashboard/)
2. Create a **Sandbox App**
3. Copy the **Client ID** and **Secret**
4. Create a **Sandbox Buyer Account** (for testing)

## Printify Setup

1. Go to [Printify](https://printify.com/) → Stores
2. Copy your **Shop ID** (from the URL or settings)
3. Generate an **API Token** in Settings → API
