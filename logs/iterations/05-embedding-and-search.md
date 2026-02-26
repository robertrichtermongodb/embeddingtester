# Feature: Embedding & Similarity Search

**ID:** 05  
**Added:** 2026-02-26 (initial release)  
**Status:** Complete

---

## Description

Core feature: embeds all content items and a query text using the selected provider/model, then ranks items by cosine similarity. Embeddings are generated fresh on each search (no caching on items). Results are stored as `SearchRun` entries in a history table.

## User-Facing Behavior

- Text input for query + "Search" button (also Enter key).
- Button disabled when query is empty, no content items exist, or a search is running.
- While running: button shows "Running...", item cards show spinner badges.
- On completion: a new row group appears in the history table (see Feature 07).
- Errors show in a dismissible red banner with `role="alert"`.

## Implementation

### Frontend

| File | Role |
|------|------|
| `frontend/src/App.tsx` | `handleQuery` orchestrator, `callEmbed` API function, `buildEmbedContent` helper |
| `frontend/src/components/QueryPanel.tsx` | Query input, search button, provider/model quick-switch |
| `frontend/src/utils/cosine.ts` | `cosineSimilarity(a, b)` — dot product / (norm_a * norm_b) |

### Backend

| File | Role |
|------|------|
| `backend/src/index.ts` | `POST /api/embed` route — validates, creates provider, calls embed, returns result + debug |
| `backend/src/services/ProviderFactory.ts` | `createProvider()` — validates config, instantiates correct service |
| `backend/src/interfaces/EmbeddingProvider.ts` | `EmbeddingProvider` interface: `embedQuery`, `embedDocument`, `supportsMultimodal`, `getDimension` |
| `backend/src/services/voyage.ts` | `VoyageEmbeddings` — text and multimodal endpoints via Axios |
| `backend/src/services/bedrock.ts` | `BedrockEmbeddings` — Titan (text/image) and Cohere via AWS SDK `InvokeModelCommand` |

### Search Flow

```
1. User clicks Search
2. handleQuery() reads current items via itemsRef
3. For each item: callEmbed(config, content, 'document') → backend
4. callEmbed(config, queryText, 'query') → backend
5. cosineSimilarity() computed client-side for each (query, item) pair
6. Results sorted by similarity, wrapped in SearchRun, appended to history
```

### API Contract (`POST /api/embed`)

**Request:**
```json
{ "provider": "voyage", "config": { "apiKey": "...", "model": "..." }, "content": { "text": "...", "imageBase64": "data:..." }, "inputType": "document" }
```

**Response (success):**
```json
{ "embedding": [...], "dimensions": 1024, "tokensUsed": 42, "debug": { ... } }
```

### Provider Abstraction

```typescript
interface EmbeddingProvider {
  embedQuery(text: string): Promise<EmbedResult>;
  embedDocument(text: string, imageDataUrl?: string): Promise<EmbedResult>;
  supportsMultimodal(): boolean;
  getDimension(): number;
}
```

Both `VoyageEmbeddings` and `BedrockEmbeddings` implement this interface. `ProviderFactory.createProvider()` validates the config and returns the correct instance.

### Error Handling

- `extractProviderError()` handles both Axios errors (Voyage) and AWS SDK errors (Bedrock).
- Provider-specific error messages extracted from response bodies.
- Per-item failures in all-models mode are caught silently (visible in debug console).

### Multimodal Handling

- Voyage multimodal: sends `{ inputs: [{ content: [{type:'text',...}, {type:'image_base64',...}] }] }` to `/multimodalembeddings`.
- Bedrock Titan Image: sends `{ inputText, inputImage }` (raw base64, data URI prefix stripped).
- Text-only items on multimodal models: handled correctly (only text content piece sent).
- Image-only items on text models: rejected by provider with descriptive error.

## Dependencies

- Depends on: Feature 01 (config), Feature 04 (content items).
- Consumed by: Feature 06 (all-models), Feature 07 (history table), Feature 08 (debug console).
