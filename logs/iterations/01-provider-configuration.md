# Feature: Provider Configuration

**ID:** 01  
**Added:** 2026-02-26 (initial release)  
**Status:** Complete

---

## Description

Allows users to configure embedding provider credentials via a sidebar panel. Supports two providers: Voyage AI (API key auth) and AWS Bedrock (IAM credentials). The sidebar persists across all views. Model selection was moved to the QueryPanel in Feature 12.

## User-Facing Behavior

- Toggle between Voyage AI and Bedrock with provider buttons (blue/orange color coding).
- Voyage: API key field (masked).
- Bedrock: Region, Access Key ID, Secret Access Key, Session Token fields.
- Model selection is handled exclusively by the QueryPanel (see Feature 09, Feature 12).

## Implementation

### Frontend

| File | Role |
|------|------|
| `frontend/src/components/ProviderConfig.tsx` | Sidebar component with provider toggle, credential forms, model selects |
| `frontend/src/types.ts` | `Provider`, `VoyageConfig`, `BedrockConfig`, `ProviderSettings` types; `VOYAGE_MODELS`, `BEDROCK_MODELS` arrays; `isMultimodalModel()` |
| `frontend/src/App.tsx` | Holds `config` state (`ProviderSettings`), passes to `ProviderConfig` via props |

### Data Flow

```
App (config state) → ProviderConfig (onChange callback) → App (setConfig)
                    ↘ QueryPanel (provider/model props for quick-switch)
```

### Key Types

```typescript
type Provider = 'voyage' | 'bedrock';
interface VoyageConfig { apiKey: string; model: string; }
interface BedrockConfig { region: string; accessKeyId: string; secretAccessKey: string; sessionToken: string; model: string; }
interface ProviderSettings { provider: Provider; voyage: VoyageConfig; bedrock: BedrockConfig; }
```

### Model Registry

Models are defined as static arrays in `types.ts` with `{ id, label, multimodal }` shape. Each provider has its own array. The `isMultimodalModel()` function resolves multimodal capability by provider + model ID.

## Dependencies

- None (leaf feature — other features depend on this)
- Updated by: Feature 12 (removed model selection and multimodal badge from sidebar)

## Notes

- Config types are duplicated between frontend (`types.ts`) and backend (`VoyageConfig`/`BedrockConfig` in service files). A shared types package would eliminate this.
- The sidebar is a fixed 320px width and does not collapse on mobile.
