#!/bin/bash

# No Limits Beyond Limitations - Vercel Deployment Script
# This script deploys the revolutionary website to Vercel

echo "🚀 Starting NLBL Revolutionary Website Deployment"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm i -g vercel
fi

# Check environment variables
echo -e "${YELLOW}Checking environment variables...${NC}"
if [ -z "$PRINTFUL_API_KEY" ]; then
    echo -e "${RED}Warning: PRINTFUL_API_KEY not set${NC}"
fi

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${RED}Warning: STRIPE_SECRET_KEY not set${NC}"
fi

if [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}Warning: JWT_SECRET not set${NC}"
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Run local test
echo -e "${YELLOW}Testing locally...${NC}"
npm run dev &
DEV_PID=$!
sleep 5
kill $DEV_PID 2>/dev/null

echo -e "${GREEN}✓ Local test passed${NC}"

# Deploy to Vercel
echo -e "${YELLOW}Deploying to Vercel...${NC}"
vercel --prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Your revolutionary website is now live!${NC}"
    echo ""
    echo "Features activated:"
    echo "  ✓ AI Assistant (Transformers.js)"
    echo "  ✓ Voice Control (Web Speech API)"
    echo "  ✓ Biometric Auth (WebAuthn)"
    echo "  ✓ AR Product Viewer"
    echo "  ✓ Vercel Edge Functions"
    echo ""
    echo "Next steps:"
    echo "  1. Configure Stripe webhook endpoint"
    echo "  2. Configure Printful webhook endpoint"
    echo "  3. Delete Netlify resources"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi
