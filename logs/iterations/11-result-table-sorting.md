# Feature: Result Table Sorting

**ID:** 11  
**Added:** 2026-02-26  
**Status:** Complete

---

## Description

Adds interactive column sorting to the search results table. Users can click any column header (except Embeddings) to sort the table by that column, with a visual indicator showing the active sort column and direction. This makes it easier to compare results across runs and find specific entries in larger result sets.

## User-Facing Behavior

- Clicking a column header sorts the table by that column. A triangle indicator (▲/▼) appears next to the active column.
- Clicking the same column header again toggles between ascending and descending order.
- Clicking a different column switches to that column with its natural default direction:
  - **Time**: descending (newest first — matches the pre-sort default)
  - **Query**: ascending (A–Z)
  - **Model**: ascending (A–Z)
  - **Tokens**: descending (highest first)
  - **Item**: ascending (A–Z)
  - **Similarity**: descending (highest first)
- Run-level columns (Time, Query, Model, Tokens) reorder the search runs themselves.
- Result-level columns (Item, Similarity) reorder the results within each run, preserving run grouping.
- The Embeddings column is not sortable (it contains action buttons).
- The default sort on page load is Time descending, matching the previous behavior exactly.
- Sort state resets on page reload (ephemeral UI state, not persisted).
- Empty state and single-run tables work correctly — sorting a single run is a no-op for run-level columns.
- Active sort header is highlighted in indigo to distinguish it from inactive headers.

## Implementation

### Frontend

| File | Role |
|------|------|
| `frontend/src/types.ts` | Defines `SortColumn`, `SortDirection`, `SortConfig` types and `DEFAULT_SORT_DIRECTION` constant |
| `frontend/src/utils/sorting.ts` | Pure functions for sorting logic: `applySortConfig`, `toggleSortColumn` |
| `frontend/src/components/QueryPanel.tsx` | Adds `SortableHeader` and `SortIndicator` sub-components, sort state, and wires sorted data into rendering |

### Backend

No backend changes required.

### Key Types

```typescript
type SortColumn = 'time' | 'query' | 'model' | 'tokens' | 'item' | 'similarity';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  column: SortColumn;
  direction: SortDirection;
}

const DEFAULT_SORT_DIRECTION: Record<SortColumn, SortDirection>;
```

### Data Flow

```
User clicks column header
  → SortableHeader.onClick
  → handleSort(column)
  → toggleSortColumn(prevConfig, column, defaults) → new SortConfig
  → setSortConfig(newConfig)
  → applySortConfig(history, sortConfig) → sortedHistory
  → table renders sortedHistory instead of raw reversed history
```

### Error Handling

- No error states introduced. Sorting is a pure, synchronous transformation on in-memory data.
- Null-safe comparison: `null` token counts sort to the end regardless of direction.
- String comparisons are case-insensitive (lowercased before comparison).

## Dependencies

- Depends on: Feature 05 (Embedding & Search — provides `SearchRun[]` and the result table), Feature 07 (Search History Table — establishes the table structure)
- Consumed by: None currently

## Notes

- **Sort state is ephemeral**: Deliberately not persisted to `localStorage` because sort preference is a transient UI concern, not application data. If users frequently want a specific sort, this could be reconsidered.
- **Two-tier sorting model**: The grouped table structure (runs → results) required a design decision: run-level columns sort runs, result-level columns sort within runs. This preserves the visual grouping where run metadata (time, query, model, tokens) appears only on the first row.
- **No multi-column sort**: Kept simple with single-column sorting. Multi-column sorting would add complexity without clear user demand for this tool's scale.
- **Pure sorting utility**: `applySortConfig` and `toggleSortColumn` are pure functions with no side effects, making them easy to test and reason about independently of React.
