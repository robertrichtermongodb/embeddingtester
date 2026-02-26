# Embedding Tester

A lightweight single-page application for ad-hoc testing of different embedding model configurations. Upload images, define text, generate embeddings, and query against them — all in one screen.

## Quick Start

```bash
# Terminal 1 — Backend
cd backend && npm install && npm run dev

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Supported Providers & Models

### Voyage AI (Cloud)
| Model | Type |
|-------|------|
| voyage-multimodal-3 | Multimodal (text + image) |
| voyage-multimodal-3.5 | Multimodal (text + image) |
| voyage-3 | Text |
| voyage-3-lite | Text |
| voyage-code-3 | Code |

### AWS Bedrock (Cloud)
| Model | Type |
|-------|------|
| amazon.titan-embed-image-v1 | Multimodal (text + image) |
| amazon.titan-embed-text-v2:0 | Text |
| amazon.titan-embed-text-v1 | Text |
| cohere.embed-english-v3 | Text |
| cohere.embed-multilingual-v3 | Text |

## Development Workflow

This project uses a set of standard prompts (in `prompts/`) to maintain consistency and quality across all changes. When developing features, follow this workflow:

1. **Implement** the feature following the guidelines in the [Quality Standards](prompts/quality-standards.md) — including the security standards defined there.
2. **Log** the completed feature using the [Feature Log Prompt](prompts/feature-log-prompt.md) to keep an accurate iteration history.
3. **Verify** the final implementation by running a full review with the [Quality Check Prompt](prompts/quality-check-prompt.md).
4. **Audit** security-sensitive changes (new providers, credential handling, API changes) with the [Security Review Prompt](prompts/security-review-prompt.md).

> **Example instruction for an AI coding assistant:**
>
> *Implement [feature description] following the quality standards in `prompts/quality-standards.md`. Once complete, log the feature per `prompts/feature-log-prompt.md` and run a quality check using `prompts/quality-check-prompt.md`.*

## Architecture

- **Frontend**: React 19 + Vite + Tailwind CSS 4
- **Backend**: Express 5 + TypeScript (proxy for embedding API calls)
- Embeddings are stored in-browser memory
- Cosine similarity computed client-side
- No database, no persistence — purely ad-hoc
