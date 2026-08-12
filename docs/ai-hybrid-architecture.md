# Lil Mystic Hybrid AI Architecture

This document captures the hybrid architecture design for Lil Mystic: a production-grade AI assistant that combines cloud LLMs (for creative, high-quality outputs) with local/private models (for low-latency, private, deterministic tasks). It also defines the server-side router, memory, tool layer, streaming interface, security, and deployment considerations.

## Goals
- Provider-agnostic server router that centralizes AI access and keys
- Persistent searchable memory (RAG) backed by Postgres + pgvector (or optional vector DB)
- Tooling layer for safe, auditable function calls (play audio, run routines, query DB)
- Streaming interface for low-latency token playback and event emission
- Hybrid routing: cloud for creativity, local for latency/privacy

## High-level components

- AI Proxy Router (src/ai/proxy.js)
  - Routes requests to selected provider adapter (OpenAI by default) or to a local inference adapter
  - Enforces per-user policy (quota, cost threshold, latency preference)
  - Provides server-side authentication and key management

- Memory / Embeddings (src/ai/memory.js)
  - Embeds messages and stores vectors in Postgres (pgvector) or vector DB
  - Provides top-k retrieval for RAG
  - Pruning and retention policies

- Tool Layer (src/ai/tools.js)
  - Registry of allowed server-side tools (getProducts, runRoutine, playAudio, controlGesture)
  - Tools are executed server-side with ACLs, input validation, and logged outputs

- Streaming Interface (api/ai/stream.js + src/ai/streaming.js)
  - SSE (Server-Sent Events) or WebSocket based streaming of tokens
  - Interleaves 'token' events with 'tool' events so client can react in real time

- Client Library (public/js/lil-mystic-client.js)
  - Connects to streaming endpoint, renders tokens incrementally
  - Listens for tool events and triggers local UI/gesture actions

## Minimal API contracts

- POST /api/ai/chat
  - Body: { messages: [{role, content}], userId?, stream: false, tools?: [] }
  - Response: { id, output: { text, toolCalls: [...] }, usage: {...} }

- GET /api/ai/stream (SSE) or WS /api/ai/ws
  - Query or initial message includes conversation id, and optional routing hint (cloud/local)
  - SSE frame types:
	- event: token { token: "...", partial: true }
	- event: tool { name: "playAudio", payload: {...} }
	- event: done { id, summary }

- POST /api/ai/tools/:toolName
  - Server-side tool invocation API (used by the proxy when model requests trigger tools)

## DB schema (embeddings) — scripts/setup-pgvector.sql

CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS ai_embeddings (
  id SERIAL PRIMARY KEY,
  namespace TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_embeddings_vector_idx ON ai_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 2048);

Notes: adjust vector dimension and index type to chosen embedding model/provider.

## Provider adapters

- OpenAI adapter: chat completions + embeddings (configurable model names and params)
- Local adapter stub: connects to a local inference endpoint (containerized LLM) and provides same interface

Adapter interface example (pseudo):

async function sendChat({ messages, stream, tools, modelHint }) => { stream ? streamTokens(response) : return response }

## Tool execution model

- Tools are registered on the server with:
  - name, input schema, permission roles
  - executor function that receives validated input and returns structured output
- When a model suggests a tool call (function-calling), proxy will:
  1. validate the proposed call against registered tools
  2. run the tool executor with server privileges
  3. attach tool output into the conversation and continue the generation (tool result in RAG)

## Security & Operations

- Env variables: OPENAI_API_KEY, AI_DEFAULT_MODEL, FALLBACK_LOCAL_URL, RATE_LIMITS, DATABASE_URL
- Rate limiting: per-user and global quotas; reject or queue heavy generation
- Auditing: store tool invocation logs and conversation metadata
- Monitoring: expose metrics (requests, tokens, costs, errors) and integrate with existing monitoring

## Cost & routing policy (example)

- If estimated tokens > threshold or user has "premium" flag, route to high-quality model (gpt-4 family)
- For short/interactive UI gestures and deterministic responses, prefer local adapter
- Cache repeated prompts (fingerprint input) for quick responses

## Acceptance criteria

- Server endpoints are provider-agnostic and configurable via env vars
- Streaming endpoint returns partial tokens and tool events
- Memory module returns relevant context items (k configurable) to prepend to prompts
- Tools subsystem can safely run at least: getProducts, runRoutine, playAudio

## Next immediate step (implementation plan)
- Create docs/ai-hybrid-architecture.md (this file)
- Add scripts/setup-pgvector.sql
- Implement src/ai/memory.js and src/ai/providers/openai-adapter.js

---
Contact: follow-up questions should clarify provider selection, intended model names, and whether you will host a local model or we should provide containerized instructions.
