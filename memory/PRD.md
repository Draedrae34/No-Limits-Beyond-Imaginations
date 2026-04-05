# 🌌 COSMOS DESIGN STUDIO - Complete App Blueprint

## 📋 Project Overview

**App Name:** Cosmos Design Studio
**Theme:** Galaxy/Jarvis-inspired with holographic UI, dark space backgrounds, and glowing accents
**Purpose:** AI-powered fashion design platform with e-commerce capabilities

---

## 🎯 Core Features

### 1. Image-to-Design Generation
- Upload any image as inspiration
- Select number of designs: 1, 5, 10, 15, or 20
- Choose gender: Male, Female, Unisex
- Select style: Streetwear, Elegant, Bohemian, Casual, Formal, Sporty, Vintage, Minimalist
- AI generates unique clothing designs using OpenAI GPT Image

### 2. Voice-to-Design Generation
- Speak your design idea
- Voice transcription to text prompt
- Same style/gender selection options
- Hands-free design creation

### 3. Web Trend Scanner
- Search social platforms and web for latest trends
- Filter by category (streetwear, formal, etc.)
- Generate top 10 trending product visuals
- AI summarizes what's hot and what's not

### 4. 3D Product Editor
- Interactive 3D product viewer
- Spin/rotate product 360°
- Drag and position print on product
- Scale and adjust print size
- Preview on different product types (t-shirt, hoodie, etc.)

### 5. AI Design Assistant (Voice)
- Text-to-speech responses (device native - offline)
- Brainstorm design ideas
- Get style recommendations
- Conversational interface

### 6. Catalog System
- Publish finalized designs to personal catalog
- Set prices and descriptions
- Shareable catalog link
- Product variants (sizes, colors)

### 7. E-Commerce Integration
- Stripe payment processing
- Webhook storage and management
- Customer checkout flow

### 8. Printful Fulfillment
- Automatic order creation on Printful
- Print-on-demand fulfillment
- Real-time order tracking
- Shipment status updates

---

## 🗂️ Complete Folder Structure
```
/app
├── backend/
│   ├── .env                    # API keys (Stripe, Printful, etc.)
│   ├── server.py               # Main FastAPI application
│   ├── requirements.txt        # Python dependencies
│   ├── models/
│   │   ├── __init__.py
│   │   ├── design.py           # Design model
│   │   ├── catalog.py          # Catalog item model
│   │   ├── order.py            # Order model
│   │   └── webhook.py          # Webhook storage model
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── designs.py          # Design generation endpoints
│   │   ├── catalog.py          # Catalog management
│   │   ├── orders.py           # Order management
│   │   ├── trends.py           # Trend scanning
│   │   ├── stripe_webhooks.py  # Stripe webhook handler
│   │   └── printful_webhooks.py # Printful webhook handler
│   └── services/
│       ├── __init__.py
│       ├── ai_service.py       # OpenAI integration
│       ├── stripe_service.py   # Stripe integration
│       ├── printful_service.py # Printful integration
│       └── web_search.py       # Trend searching
│
├── frontend/
│   ├── app/
│   │   ├── index.tsx           # Home/Dashboard (Jarvis Interface)
│   │   ├── _layout.tsx         # Root layout with navigation
│   │   ├── design-studio.tsx   # Design generation screen
│   │   ├── trend-scanner.tsx   # Web trend scanner
│   │   ├── product-editor.tsx  # 3D product editor
│   │   ├── catalog.tsx         # Published catalog
│   │   ├── orders.tsx          # Order tracking
│   │   └── settings.tsx        # App settings
│   ├── components/
│   │   ├── ui/
│   │   │   ├── GalaxyBackground.tsx   # Animated space background
│   │   │   ├── HolographicCard.tsx    # Glowing card component
│   │   │   ├── NeonButton.tsx         # Glowing button
│   │   │   ├── VoiceOrb.tsx           # Jarvis-like voice orb
│   │   │   └── ParticleEffect.tsx     # Floating particles
│   │   ├── design/
│   │   │   ├── ImageUploader.tsx      # Image upload component
│   │   │   ├── StyleSelector.tsx      # Style picker
│   │   │   ├── DesignGrid.tsx         # Generated designs grid
│   │   │   └── VoiceInput.tsx         # Voice recording
│   │   ├── product/
│   │   │   ├── ProductViewer3D.tsx    # 3D product spinner
│   │   │   ├── PrintPlacer.tsx        # Drag print on product
│   │   │   └── ProductTypeSelector.tsx # Product type picker
│   │   └── common/
│   │       ├── LoadingOrb.tsx         # Loading animation
│   │       └── AIAssistant.tsx        # Voice assistant UI
│   ├── hooks/
│   │   ├── useVoice.ts         # Voice recording/playback
│   │   └── useDesigns.ts       # Design state management
│   ├── services/
│   │   ├── api.ts              # API client
│   │   └── speech.ts           # Text-to-speech service
│   └── stores/
│       └── designStore.ts      # Zustand state store
│
└── memory/
   └── PRD.md                  # This blueprint
```

---

## 🔌 API Endpoints

### Design Generation
```
POST /api/designs/generate
Body: {
  "source_image": "base64_string" | null,
  "voice_prompt": "string" | null,
  "style": "streetwear" | "elegant" | "bohemian" | "casual" | "formal" | "sporty" | "vintage" | "minimalist",
  "gender": "male" | "female" | "unisex",
  "count": 1 | 5 | 10 | 15 | 20
}
Response: { "designs": [{ "id", "image_base64", "prompt_used" }] }
```

### Trend Scanner
```
POST /api/trends/scan
Body: {
  "category": "string",
  "query": "string" (optional)
}
Response: { 
  "trends": [{ "title", "description", "source" }],
  "generated_products": [{ "image_base64", "trend_name" }]
}
```

### Catalog Management
```
GET /api/catalog                    # List all catalog items
POST /api/catalog                   # Add design to catalog
PUT /api/catalog/{id}               # Update catalog item
DELETE /api/catalog/{id}            # Remove from catalog

Body for POST/PUT: {
  "design_id": "string",
  "title": "string",
  "description": "string",
  "price": number,
  "product_type": "t-shirt" | "hoodie" | "tank" | "sweatshirt",
  "print_position": { "x": number, "y": number, "scale": number },
  "variants": [{ "size", "color" }]
}
```

### Orders
```
GET /api/orders                     # List all orders
GET /api/orders/{id}                # Get order details with tracking
POST /api/orders/create             # Create order (internal, from webhook)
```

### Webhooks
```
POST /api/webhooks/stripe           # Stripe webhook receiver
POST /api/webhooks/printful         # Printful webhook receiver
GET /api/webhooks                   # View stored webhooks (admin)
```

---

## 💾 Database Models (MongoDB)

### Design
```javascript
{
  _id: ObjectId,
  source_image: String (base64),    // Original inspiration image
  prompt: String,                   // Generated/voice prompt
  style: String,
  gender: String,
  generated_images: [{
    image_base64: String,
    prompt_used: String
  }],
  created_at: Date
}
```

### CatalogItem
```javascript
{
  _id: ObjectId,
  design_id: ObjectId,
  title: String,
  description: String,
  price: Number,
  product_type: String,
  print_image: String (base64),
  print_position: { x: Number, y: Number, scale: Number },
  variants: [{ size: String, color: String }],
  printful_product_id: String,
  is_published: Boolean,
  created_at: Date,
  updated_at: Date
}
```

### Order
```javascript
{
  _id: ObjectId,
  catalog_item_id: ObjectId,
  stripe_payment_id: String,
  printful_order_id: String,
  customer: {
    email: String,
    name: String,
    address: Object
  },
  status: String,
  tracking: {
    carrier: String,
    tracking_number: String,
    tracking_url: String,
    estimated_delivery: Date
  },
  amount: Number,
  created_at: Date,
  updated_at: Date
}
```

## This file mirrors the blueprint in memory and ensures the workshop can open it.
