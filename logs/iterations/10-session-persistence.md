# Feature: Session State Persistence

**ID:** 10  
**Added:** 2026-02-26  
**Status:** Complete

---

## Description

Persists content items, search history, query text, and debug log to `localStorage` so that the application state survives a browser reload. Implemented as a reusable hook backed by a dedicated storage utility, keeping changes to existing code minimal (one file modified).

## User-Facing Behavior

- After a browser reload, all previously added content items (text, images) are restored.
- The query input retains its last value.
- The search history table retains all past runs (including embeddings for download).
- The debug console retains all logged entries.
- If `localStorage` quota is exceeded (e.g. many large images), the app continues working normally — persistence silently degrades for the affected key.
- The existing "Clear" button in the history table and debug console also clears the corresponding storage.
- Transient UI flags (`isEmbedding`, loading spinners, errors) are never persisted. Items restored from storage always have `isEmbedding: false`.

## Implementation

### Frontend

| File | Role |
|------|------|
| `frontend/src/utils/storage.ts` | Pure utility: `loadFromStorage`, `saveToStorage`, `clearStorage` with `et:` key prefix and `QuotaExceededError` handling |
| `frontend/src/hooks/usePersistedState.ts` | Drop-in `useState` replacement that loads initial value from storage and writes back on change via `useEffect` |
| `frontend/src/App.tsx` | Swaps 5 `useState` calls for `usePersistedState` with appropriate keys and a sanitize callback for items |

### Backend

No backend changes required — this feature is entirely client-side.

### Key Types

```typescript
// No new types introduced. The hook uses a generic signature:
function usePersistedState<T>(
  key: string,
  defaultValue: T,
  sanitize?: (loaded: T) => T,
): [T, React.Dispatch<React.SetStateAction<T>>]
```

### Data Flow

```
Page load → usePersistedState lazy initializer → loadFromStorage(key) → localStorage.getItem
  → JSON.parse → sanitize (if provided) → initial state

State change → useEffect fires → saveToStorage(key, state) → localStorage.setItem
```

### Error Handling

- Corrupt or unparseable JSON in `localStorage` returns `null` from `loadFromStorage`, falling through to the default value.
- `QuotaExceededError` on write is caught in `saveToStorage` and logged via `console.warn`. The app continues without persistence for that key.
- The `sanitize` callback on `items` resets the transient `isEmbedding` flag to `false`, preventing stuck loading indicators after reload.

## Dependencies

- Depends on: Feature 03 (Content Items), Feature 05 (Search History), Feature 04 (Debug Console)
- Consumed by: None (leaf feature)

## Notes

- **Storage keys** are prefixed with `et:` to avoid collisions with other apps on the same origin.
- **Size considerations**: Base64 image data and embedding arrays in search history are the largest consumers. `localStorage` is typically limited to 5-10 MB per origin. The existing "Clear history" button is the primary mitigation when quota is reached.
- **No debounce**: Write-back happens on every state change. This is acceptable because state changes are user-driven or per-search-run, not high-frequency.
- **Coupling**: Two new leaf modules (`storage.ts` Ce=0, `usePersistedState.ts` Ce=1). `App.tsx` coupling is unchanged — only the hook source is swapped.
- **Cohesion**: `storage.ts` handles only key-value JSON persistence. `usePersistedState.ts` handles only state-plus-sync. Each has a single responsibility.
