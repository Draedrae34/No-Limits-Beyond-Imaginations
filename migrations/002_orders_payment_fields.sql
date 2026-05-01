-- migrations/002_orders_payment_fields.sql
-- Add payment tracking fields to orders table for Stripe integration
-- Run this migration once before deploying payment flow

ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(payment_intent_id);
