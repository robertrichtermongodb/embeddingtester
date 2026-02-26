# Feature: Remove Model Selection from Provider Configuration

**ID:** 12  
**Added:** 2026-02-26  
**Status:** Complete

---

## Description

Removes the model dropdown from the sidebar provider configuration panel, consolidating model selection into the query panel's quick-switch control. The sidebar now focuses exclusively on credentials and provider switching, reducing UI redundancy and clarifying the separation between authentication setup and query configuration.

## User-Facing Behavior

- The sidebar no longer shows a model `<select>` for Voyage or Bedrock.
- The multimodal indicator badge ("Multimodal (text + image)" / "Text only") is removed from the sidebar since it was model-dependent.
- Model selection is now exclusively controlled via the QueryPanel dropdown, which already supports per-model and "All Models" selection.
- Provider toggle buttons remain in the sidebar and continue to sync with the QueryPanel provider buttons.
- Saved credential payloads are unaffected — the `model` field remains in `VoyageConfig` and `BedrockConfig` types for API call purposes.

## Implementation

### Frontend

| File | Role |
|------|------|
| `frontend/src/components/ProviderConfig.tsx` | Removed model `<select>` for both Voyage (was lines 117–135) and Bedrock (was lines 227–245). Removed multimodal indicator badge. Removed imports of `VOYAGE_MODELS`, `BEDROCK_MODELS`, `isMultimodalModel` and the unused `selectCls` variable. |

### What Was Not Changed

| File | Reason |
|------|--------|
| `frontend/src/types.ts` | `model` field in `VoyageConfig`/`BedrockConfig` is still used by the query flow and backend API. `VOYAGE_MODELS`, `BEDROCK_MODELS`, `isMultimodalModel` are still used by `QueryPanel` and `App`. |
| `frontend/src/App.tsx` | `currentModel`, `handleModelChange`, `makeConfigForModel` remain — they serve the QueryPanel model selector. |
| `frontend/src/components/QueryPanel.tsx` | Unchanged — already had full model selection capability (Feature 09). |
| `backend/src/index.ts` | Unchanged — backend reads `config.model` from the request payload regardless of where the frontend set it. |

### Data Flow (after change)

```
App (config state) → ProviderConfig (credentials + provider toggle only)
                   → QueryPanel (provider toggle + model select + query input)
                   → callEmbed → Backend → Provider API
```

## Dependencies

- Depends on: Feature 01 (provider config structure), Feature 09 (quick model switch in QueryPanel)
- Consumed by: None
- Updates: Feature 01 description — sidebar no longer includes model selection or multimodal badge

## Notes

- The sidebar now has a cleaner single responsibility: credential management. Model selection is a query-time concern, better co-located with the search input.
- The provider toggle buttons remain in both the sidebar and QueryPanel. This is intentional — the sidebar toggle determines which credential form is shown, while the QueryPanel toggle selects the active provider for the next query. Both update the same `config.provider` state.
