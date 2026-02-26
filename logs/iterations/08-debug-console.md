# Feature: Debug Console

**ID:** 08  
**Added:** 2026-02-26 (initial release)  
**Status:** Complete

---

## Description

A terminal-styled debug panel fixed to the bottom of the screen that logs every API request to the embedding providers. Shows request metadata, timing, response details, and errors. Collapsible to minimize screen usage.

## User-Facing Behavior

- Fixed to the bottom of the viewport, spanning full screen width (across sidebar and main area).
- Starts collapsed (36px title bar only). Click to expand (260px).
- Title bar: traffic light dots, "Debug Console" label, request count, "Clear" button.
- Each entry shows: timestamp, provider (color-coded), input type, model, content stats, latency, dimensions/error, token count.
- Error entries have red background tint and display the error message.
- Endpoint URL shown in small gray text below each entry.
- Auto-scrolls to bottom when new entries arrive (while expanded).
- Smooth CSS transition on collapse/expand.

## Implementation

### Frontend

| File | Role |
|------|------|
| `frontend/src/components/DebugConsole.tsx` | `DebugConsole` (panel + collapse) and `EntryRow` (individual log entry) |
| `frontend/src/types.ts` | `DebugLogEntry` type |
| `frontend/src/utils/format.ts` | `formatTime()` |
| `frontend/src/App.tsx` | `debugLog` state, `addDebugEntry` callback, layout placement outside `<main>` |

### Key Type

```typescript
interface DebugLogEntry {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  endpoint: string;
  inputType: string;
  contentSummary: { textLength: number; hasImage: boolean; imageSizeKb: number; };
  latencyMs: number;
  dimensions: number | null;
  tokensUsed: number | null;
  status: 'ok' | 'error';
  error?: string;
}
```

### Debug Data Flow

```
callEmbed() → backend POST /api/embed → response includes `debug` object
           → onDebug callback adds id via crypto.randomUUID()
           → addDebugEntry() appends to debugLog state
           → DebugConsole re-renders with new entry
```

The backend attaches `debug` metadata to both success and error responses, including timing measured via `performance.now()`.

### Layout

- Rendered outside `<main>` at the root level of `App.tsx`.
- Uses `position: fixed; bottom: 0; left: 0; right: 0; z-index: 50`.
- A matching-height spacer div in normal flow prevents page content from hiding behind the panel.
- "Clear" button uses `stopPropagation` to avoid toggling collapse.

## Dependencies

- Depends on: Feature 05 (embedding API calls produce debug entries).
