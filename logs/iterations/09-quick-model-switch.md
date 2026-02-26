# Feature: Quick Model Switch

**ID:** 09  
**Added:** 2026-02-26 (initial release)  
**Status:** Complete

---

## Description

Provider toggle buttons and a model dropdown placed directly above the query input, enabling rapid switching between embedding configurations without navigating to the sidebar. Changes here sync bidirectionally with the sidebar configuration.

## User-Facing Behavior

- Two provider buttons (Voyage AI / Bedrock) with active-state color coding.
- Model dropdown with all models for the active provider + "All Models" option at top.
- Switching provider auto-selects the first model for that provider.
- Changes are reflected immediately in the sidebar's model/provider state and vice versa.

## Implementation

### Frontend

| File | Role |
|------|------|
| `frontend/src/components/QueryPanel.tsx` | Provider buttons, model `<select>`, `handleProviderSwitch` |
| `frontend/src/App.tsx` | `handleProviderChange`, `handleModelChange` callbacks that update `config` state |

### Sync Mechanism

- `QueryPanel` receives `provider` and `model` as props from `App.tsx`.
- `onProviderChange` and `onModelChange` callbacks update the corresponding field inside `config.voyage` or `config.bedrock`.
- Since `ProviderConfig` (sidebar) also reads/writes the same `config` state, changes propagate automatically.

### Provider Switch Logic

```typescript
const handleProviderSwitch = (p: Provider) => {
  onProviderChange(p);
  const defaultModel = p === 'voyage' ? VOYAGE_MODELS[0].id : BEDROCK_MODELS[0].id;
  onModelChange(defaultModel);
};
```

## Dependencies

- Depends on: Feature 01 (config state + model lists), Feature 06 (all-models option).
