# Feature: All-Models Batch Comparison

**ID:** 06  
**Added:** 2026-02-26 (initial release)  
**Status:** Complete

---

## Description

An "All Models" option in the model dropdown that runs the query against every model for the selected provider sequentially. Each model produces its own `SearchRun` in the history table, enabling side-by-side comparison of similarity scores across models.

## User-Facing Behavior

- "All Models" appears as the first option in the model dropdown, separated by an `<optgroup>`.
- When selected, an amber warning banner explains the load/cost implications.
- On search: each model runs sequentially; results appear in the history table one run at a time.
- If a model fails (e.g. image-only item on a text model), it is skipped; the next model proceeds.
- If all models fail, an error message is shown.

## Implementation

### Frontend

| File | Role |
|------|------|
| `frontend/src/types.ts` | `ALL_MODELS_ID = '__all__'` sentinel constant |
| `frontend/src/App.tsx` | `handleQuery` — detects `ALL_MODELS_ID`, builds model list, loops with `makeConfigForModel()` |
| `frontend/src/components/QueryPanel.tsx` | Dropdown option, warning banner, `isAllModels` flag |

### Logic (in `handleQuery`)

```
if currentModel === ALL_MODELS_ID:
  modelsToRun = all models for current provider
else:
  modelsToRun = [currentModel]

for each modelId in modelsToRun:
  tempConfig = makeConfigForModel(config, modelId)
  embed all items (skip failures silently)
  embed query
  compute similarity
  append SearchRun to history
```

### Error Resilience

- Per-item `try/catch` inside the model loop: if an item fails, it is excluded from that run's results.
- Per-model `try/catch`: if the entire model fails (e.g. query embed fails), the loop continues.
- Only throws to the outer handler in single-model mode.
- If no model succeeds, shows "All models failed" error.

### Token Tracking

- Each `callEmbed` returns `tokensUsed?`. Accumulated per-run into `SearchRun.tokensUsed`.
- Displayed in the history table's Tokens column (or "—" if provider doesn't report tokens).

## Dependencies

- Depends on: Feature 01 (model lists), Feature 05 (embedding flow).
- Consumed by: Feature 07 (history table shows multiple runs).
