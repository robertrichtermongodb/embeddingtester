# Feature: Content Item Management

**ID:** 04  
**Added:** 2026-02-26 (initial release)  
**Status:** Complete

---

## Description

Allows users to create, edit, and remove content items that will be embedded and compared against queries. Each item has a label, optional text, and optional image. Items are displayed in a responsive grid.

## User-Facing Behavior

- "+ Add Item" button creates a new empty item with an auto-incrementing label.
- Each item card shows: editable label, image upload area (drag/click), text area.
- Images display a preview with hover actions: Replace, Remove.
- Spinner badge on items currently being embedded.
- Remove button (×) deletes the item.
- Grid layout: 1 column on mobile, 2 on medium, 3 on large screens.

## Implementation

### Frontend

| File | Role |
|------|------|
| `frontend/src/components/ContentPanel.tsx` | `ContentPanel` (grid + add button) and `ItemCard` (individual item) |
| `frontend/src/types.ts` | `ContentItem` type |
| `frontend/src/App.tsx` | `items` state, `addItem`, `removeItem`, `updateItem` callbacks |

### Key Type

```typescript
interface ContentItem {
  id: string;          // crypto.randomUUID()
  label: string;       // e.g. "Item 1"
  text: string;
  imageDataUrl: string | null;   // full data URI from FileReader
  imageName: string | null;
  isEmbedding: boolean;          // true while embedding in progress
}
```

### Image Handling

- File input with `accept="image/*"`, hidden behind styled buttons.
- `FileReader.readAsDataURL()` converts to base64 data URI stored in memory.
- Full data URI passed to backend; Voyage uses it directly, Bedrock strips the prefix.
- File input value cleared before opening picker to allow re-selecting the same file.

### State Management

- `items` array in `App.tsx` with functional `setItems` updaters.
- `itemsRef` (ref) tracks latest items for use inside async `handleQuery` callback.
- `nextIndex` counter for auto-labeling.

## Dependencies

- None (leaf feature — consumed by Feature 05).
