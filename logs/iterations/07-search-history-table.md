# Feature: Search History Table & Embedding Downloads

**ID:** 07  
**Added:** 2026-02-26 (initial release)  
**Status:** Complete

---

## Description

A persistent history table that accumulates all search runs in memory. Each run shows the query, model, token usage, per-item similarity scores, and download buttons for both query and document embeddings. The table enables comparison across different queries, models, and configurations.

## User-Facing Behavior

- Appears below the query input once the first search completes.
- Header: "Results (N runs)" + "Clear history" button.
- Columns: Time | Query | Model | Tokens | Item | Similarity | Embeddings.
- Runs are grouped visually: run-level info (time, query, model, tokens) shown only on the first row; heavier border between runs.
- Newest runs at the top (reversed display order).
- Model badges: blue for Voyage, orange for Bedrock.
- Similarity score bar: green (≥80%), yellow (≥60%), orange (≥40%), red (<40%).
- Download buttons: "↓ Q" (query embedding) on the first row, "↓ D" (document embedding) on every row.
- "Clear history" removes all runs from memory.

## Implementation

### Frontend

| File | Role |
|------|------|
| `frontend/src/components/QueryPanel.tsx` | History table rendering, download buttons, ScoreBar component |
| `frontend/src/types.ts` | `SearchRun`, `QueryResult` types |
| `frontend/src/utils/format.ts` | `formatTime()`, `downloadJson()` |
| `frontend/src/App.tsx` | `searchHistory` state (array of `SearchRun`), `setSearchHistory` |

### Key Types

```typescript
interface SearchRun {
  id: string;
  timestamp: string;
  query: string;
  model: string;
  queryEmbedding: number[];
  tokensUsed: number | null;
  results: QueryResult[];
}

interface QueryResult {
  itemId: string;
  label: string;
  similarity: number;
  text: string;
  hasImage: boolean;
  embedding: number[];
}
```

### Download Format

JSON files with structure:
```json
{ "type": "query|document", "query|label": "...", "model": "...", "dimensions": 1024, "embedding": [...] }
```

Filename pattern: `query_<model>_embedding.json` or `<label>_<model>_embedding.json`.

`downloadJson()` creates a Blob URL, triggers a click on a temporary `<a>` element, and revokes the URL after 100ms.

### State Design

- `searchHistory: SearchRun[]` is append-only during normal usage.
- Each search appends one `SearchRun` (single model) or multiple (all-models mode).
- Full embeddings stored in memory for download capability.
- "Clear history" resets to empty array.

## Dependencies

- Depends on: Feature 05 (produces SearchRun data), Feature 06 (multiple runs per search).
