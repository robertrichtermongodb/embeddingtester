# Code & Architecture Quality Report

**Project:** Embedding Tester  
**Date:** 2026-02-26T22:00:00Z  
**Scope:** Full codebase (frontend + backend)  
**Trigger:** Scheduled quality review (post session-persistence iteration)

---

## 1. Project Overview

| Metric | Value |
|--------|-------|
| Source files | 17 (11 frontend, 6 backend) |
| Total lines of code | 2,031 |
| Frontend LOC | 1,410 |
| Backend LOC | 621 |
| React components | 10 (5 exported, 5 internal) |
| Backend services | 4 |
| Custom hooks | 1 |
| Utility modules | 3 |
| Interfaces/types | 14 |

### Lines of Code by File

| File | LOC |
|------|-----|
| frontend/src/App.tsx | 351 |
| frontend/src/main.tsx | 10 |
| frontend/src/types.ts | 90 |
| frontend/src/hooks/usePersistedState.ts | 20 |
| frontend/src/utils/storage.ts | 22 |
| frontend/src/utils/format.ts | 17 |
| frontend/src/utils/cosine.ts | 13 |
| frontend/src/components/DebugConsole.tsx | 123 |
| frontend/src/components/QueryPanel.tsx | 268 |
| frontend/src/components/ContentPanel.tsx | 150 |
| frontend/src/components/ProviderConfig.tsx | 346 |
| backend/src/index.ts | 196 |
| backend/src/interfaces/EmbeddingProvider.ts | 21 |
| backend/src/services/ProviderFactory.ts | 43 |
| backend/src/services/SecureConfigStore.ts | 136 |
| backend/src/services/bedrock.ts | 125 |
| backend/src/services/voyage.ts | 100 |

---

## 2. Coupling Metrics

### 2.1 Afferent Coupling (Ca) — Who depends on this module?

| Module | Dependents | Ca |
|--------|-----------|-----|
| frontend/src/types.ts | App, QueryPanel, ContentPanel, ProviderConfig, DebugConsole | 5 |
| frontend/src/utils/format.ts | QueryPanel, DebugConsole | 2 |
| frontend/src/utils/cosine.ts | App | 1 |
| frontend/src/utils/storage.ts | usePersistedState | 1 |
| frontend/src/hooks/usePersistedState.ts | App | 1 |
| frontend/src/App.tsx | main | 1 |
| frontend/src/components/* (each) | App | 1 |
| backend/interfaces/EmbeddingProvider.ts | ProviderFactory, voyage, bedrock | 3 |
| backend/services/ProviderFactory.ts | index | 1 |
| backend/services/SecureConfigStore.ts | index | 1 |
| backend/services/voyage.ts | ProviderFactory | 1 |
| backend/services/bedrock.ts | ProviderFactory | 1 |

### 2.2 Efferent Coupling (Ce) — How many modules does this depend on?

| Module | Internal Deps | Ce |
|--------|--------------|-----|
| frontend/src/App.tsx | types, usePersistedState, cosine, 4 components | 7 |
| frontend/src/components/QueryPanel.tsx | types, format | 2 |
| frontend/src/components/DebugConsole.tsx | types, format | 2 |
| frontend/src/components/ContentPanel.tsx | types | 1 |
| frontend/src/components/ProviderConfig.tsx | types | 1 |
| frontend/src/hooks/usePersistedState.ts | storage | 1 |
| frontend/src/main.tsx | App | 1 |
| frontend/src/types.ts | (none) | 0 |
| frontend/src/utils/format.ts | (none) | 0 |
| frontend/src/utils/cosine.ts | (none) | 0 |
| frontend/src/utils/storage.ts | (none) | 0 |
| backend/src/index.ts | ProviderFactory, SecureConfigStore | 2 |
| backend/src/services/ProviderFactory.ts | EmbeddingProvider, voyage, bedrock | 3 |
| backend/src/services/voyage.ts | EmbeddingProvider | 1 |
| backend/src/services/bedrock.ts | EmbeddingProvider | 1 |
| backend/src/services/SecureConfigStore.ts | (none) | 0 |
| backend/src/interfaces/EmbeddingProvider.ts | (none) | 0 |

### 2.3 Instability (I = Ce / (Ca + Ce))

| Module | Ca | Ce | I | Interpretation |
|--------|----|----|---|----------------|
| types.ts | 5 | 0 | 0.00 | Maximally stable (pure types) |
| EmbeddingProvider.ts | 3 | 0 | 0.00 | Maximally stable (interface) |
| cosine.ts | 1 | 0 | 0.00 | Stable utility |
| format.ts | 2 | 0 | 0.00 | Stable utility |
| storage.ts | 1 | 0 | 0.00 | Stable utility |
| SecureConfigStore.ts | 1 | 0 | 0.00 | Stable service |
| usePersistedState.ts | 1 | 1 | 0.50 | Balanced (hook layer) |
| voyage.ts | 1 | 1 | 0.50 | Balanced |
| bedrock.ts | 1 | 1 | 0.50 | Balanced |
| ProviderFactory.ts | 1 | 3 | 0.75 | Mostly unstable (expected: orchestrator) |
| App.tsx | 1 | 7 | 0.88 | Highly unstable (expected: composition root) |
| index.ts (backend) | 0 | 2 | 1.00 | Maximally unstable (entry point) |

**Assessment: GOOD** — The Stable Dependencies Principle is respected. The new `usePersistedState` hook sits at I=0.50, correctly positioned between the stable storage utility and the unstable App composition root. No violations. Dependency graph is a clean DAG.

### 2.4 Circular Dependencies

**None detected.** The dependency graph is a clean DAG in both frontend and backend.

---

## 3. Cohesion Metrics

### 3.1 Single Responsibility Assessment

| Module | Responsibility | Rating | Notes |
|--------|---------------|--------|-------|
| types.ts | Type definitions + model metadata | GOOD | Pure types and constants |
| cosine.ts | Math utility | GOOD | Single pure function |
| format.ts | Formatting + download helpers | GOOD | Two related utilities |
| storage.ts | LocalStorage abstraction | GOOD | Clean CRUD boundary |
| usePersistedState.ts | State persistence hook | GOOD | Single concern, composes storage cleanly |
| ContentPanel.tsx | Content item management UI | GOOD | Clean delegation to ItemCard |
| DebugConsole.tsx | Debug log display | GOOD | Focused component |
| ProviderConfig.tsx | Provider credential forms | OK | Includes CredentialsPastePanel (related but large) |
| QueryPanel.tsx | Query input + results table | OK | Two concerns; results table could be extracted |
| App.tsx | Composition root + API + orchestration | NEEDS WORK | API calls, search logic, and state all in one; usePersistedState reduces boilerplate but core issue remains |
| EmbeddingProvider.ts | Provider interface | GOOD | Pure interface |
| voyage.ts | Voyage embedding service | GOOD | Single provider |
| bedrock.ts | Bedrock embedding service | GOOD | Single provider |
| ProviderFactory.ts | Provider construction + validation | GOOD | Factory with validation |
| SecureConfigStore.ts | Encrypted config persistence | GOOD | Clear boundary |
| index.ts (backend) | HTTP routing + error handling | OK | Could extract route handlers |

### 3.2 LCOM-like Indicator (methods sharing state)

| Class/Module | Fields | Methods Using Shared State | Rating |
|-------------|--------|---------------------------|--------|
| VoyageEmbeddings | 3 (apiKey, model, baseUrl) | 7/7 all use model/apiKey | HIGH cohesion |
| BedrockEmbeddings | 2 (client, model) | 5/5 all use client/model | HIGH cohesion |
| SecureConfigStore | 4 (configDir, masterKeyPath, credentialsPath, masterKey) | 7/7 all use paths/masterKey | HIGH cohesion |
| App (component) | 10 state vars + 2 refs | handleQuery uses 5, others use 1-3 | MEDIUM cohesion |

---

## 4. Modularity Metrics

### 4.1 Component Props Interface Size

| Component | Props | Rating |
|-----------|-------|--------|
| DebugConsole | 2 | GOOD |
| ScoreBar | 1 | GOOD |
| EntryRow | 1 | GOOD |
| Spinner | 0 | GOOD |
| CredentialsPastePanel | 1 | GOOD |
| ContentPanel | 4 | GOOD |
| ItemCard | 3 | GOOD |
| ProviderConfig | 5 | OK |
| QueryPanel | 11 | NEEDS WORK (high prop surface) |

**Guideline:** Components with >7 props should be examined for possible decomposition or context usage.

### 4.2 Longest Functions

| Rank | File | Function | Lines | Rating |
|------|------|----------|-------|--------|
| 1 | App.tsx | App (component body) | ~245 | NEEDS WORK |
| 2 | ProviderConfig.tsx | ProviderConfig | ~229 | OK (mostly JSX forms) |
| 3 | QueryPanel.tsx | QueryPanel | ~223 | OK (mostly JSX table) |
| 4 | App.tsx | handleQuery | ~91 | NEEDS WORK |
| 5 | ContentPanel.tsx | ItemCard | ~98 | OK (mostly JSX) |

**Guideline:** Functions over 50 lines of logic (excluding JSX markup) should be considered for extraction.

### 4.3 Cyclomatic Complexity Indicators

| File | Branches + Ternaries | Rating |
|------|-----------------------|--------|
| App.tsx | 33 | HIGH — main complexity hotspot |
| backend/index.ts | 22 | MEDIUM-HIGH — error extraction logic |
| backend/bedrock.ts | 16 | MEDIUM — model-specific branching (inherent) |
| ProviderConfig.tsx | 15 | MEDIUM — form conditionals |
| SecureConfigStore.ts | 13 | MEDIUM — crypto path handling |
| QueryPanel.tsx | 10 | LOW-MEDIUM |
| voyage.ts | 9 | LOW |
| All others | ≤5 | LOW |

---

## 5. Architecture Assessment

### 5.1 Layer Separation

```
Frontend                          Backend
┌─────────────┐                  ┌──────────────┐
│  main.tsx   │                  │   index.ts   │  ← HTTP layer
├─────────────┤                  ├──────────────┤
│   App.tsx   │  ── /api/* ──►   │ ProviderFact.│  ← Orchestration
├─────────────┤                  ├──────────────┤
│ Components  │                  │  Services    │  ← Business logic
│  QueryPanel │                  │  voyage.ts   │
│  Content..  │                  │  bedrock.ts  │
│  Provider.. │                  │  SecureCfg.. │
│  DebugCons. │                  ├──────────────┤
├─────────────┤                  │  Interfaces  │  ← Contracts
│   Hooks     │  ← NEW LAYER     │  EmbedProv.  │
│ usePersist. │                  └──────────────┘
├─────────────┤
│ Utils/Types │
│  format.ts  │
│  cosine.ts  │
│  storage.ts │  ← NEW
└─────────────┘
```

| Layer boundary | Status |
|---------------|--------|
| Frontend components → types/utils | Clean |
| Frontend hooks → utils (storage) | Clean (new) |
| Frontend App → hooks | Clean (new) |
| Backend services → interfaces | Clean |
| Backend index → services (via factory) | Clean |
| Frontend → Backend (HTTP) | Implicit contract (no shared types) |
| API calls in App.tsx (not a service layer) | Mixed concern |

### 5.2 Extensibility

| Concern | Rating | Notes |
|---------|--------|-------|
| Adding a new embedding provider | GOOD | Implement EmbeddingProvider, add to ProviderFactory |
| Adding a new model to existing provider | GOOD | Add to model list in types.ts |
| Adding new content types | OK | Would require interface changes |
| Changing persistence backend | GOOD | SecureConfigStore is isolated |
| Changing frontend persistence strategy | GOOD (improved) | storage.ts abstraction makes it a single-file change |

---

## 6. Issue Summary

### Resolved Since Previous Report

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| — | (No new issues were resolved; all 15 items from the cleanup batch remain resolved) | — | — |

### Remaining (Known)

| # | Issue | Severity | Notes |
|---|-------|----------|-------|
| R1 | App.tsx has too many responsibilities | LOW | Partially improved (usePersistedState extraction), but API calls + handleQuery + state still co-located |
| R2 | QueryPanel has 11 props | LOW | Improved from 12→11; still above 7-prop guideline |
| R3 | Config types duplicated FE/BE | LOW | Shared types package for larger projects |
| R4 | Model metadata split FE/BE | LOW | Centralize model lists |
| R5 | No loading state while config loads | LOW | Add skeleton/spinner |
| R6 | Fixed sidebar doesn't collapse on mobile | LOW | Add responsive layout |
| R7 | No auth on API endpoints | LOW | Acceptable for local dev tool |
| R8 | Debug console header lacks keyboard accessibility | LOW | Div with onClick has no role="button" or onKeyDown handler |
| R9 | localStorage data not shape-validated | LOW | usePersistedState trusts JSON.parse output; sanitize callback partially mitigates |
| R10 | Config loaded from server cast without validation | MEDIUM | loadSavedConfig casts res.json() to ProviderSettings without shape checking |

---

## 7. Quality Scores

| Dimension | Score (1-10) | Rationale |
|-----------|-------------|-----------|
| **Coupling** | 8 | Clean DAG, stable dependencies principle respected, no circular deps. New hook layer correctly positioned at I=0.50. One point lost for implicit FE/BE API contract. |
| **Cohesion** | 7 | Backend services highly cohesive. usePersistedState is a clean single-concern hook. App.tsx still mixes API, orchestration, and state. |
| **Modularity** | 7.5 | New hooks layer and storage utility improve decomposition. QueryPanel props reduced 12→11. Clean provider abstraction. Points lost for large App.tsx and handleQuery. |
| **Error Handling** | 8 | Validated inputs at boundaries, safe response parsing, provider-specific error extraction, graceful all-models degradation. |
| **Security** | 8 | AES-256-GCM encryption, prototype pollution guard, no credential leaking, reduced body limits. Credentials not stored in localStorage. Point lost for no auth (acceptable for local tool). |
| **Type Safety** | 7 | Full TypeScript, provider config validated at factory. Points lost for untyped FE/BE API contract, `as ProviderSettings` cast in loadSavedConfig, and `as T` in storage utility. |
| **Maintainability** | 7.5 | usePersistedState eliminates boilerplate across 5 state declarations. Storage abstraction makes persistence strategy swappable. Points lost for App.tsx size and handleQuery complexity. |
| **Overall** | **7.6** | Incremental improvement through hooks/storage extraction. No regressions. Main improvement area remains decomposing App.tsx. |

---

## 8. Comparison with Previous Report

**Previous report:** 2026-02-26T18:00:00Z (post-cleanup review)

### Metric Deltas

| Metric | Previous | Current | Delta |
|--------|----------|---------|-------|
| Source files | 15 | 17 | ↑ +2 |
| Total LOC | 1,995 | 2,031 | ↑ +36 |
| Frontend LOC | 1,375 | 1,410 | ↑ +35 |
| Backend LOC | 620 | 621 | ↑ +1 |
| React components | 10 | 10 | = |
| Backend services | 4 | 4 | = |
| Utility modules | 2 | 3 | ↑ +1 |
| Custom hooks | 0 | 1 | ↑ +1 |
| Interfaces/types | 12 | 14 | ↑ +2 |

### Per-File LOC Deltas

| File | Previous | Current | Delta |
|------|----------|---------|-------|
| App.tsx | 348 | 351 | ↑ +3 |
| types.ts | 92 | 90 | ↓ -2 |
| format.ts | 18 | 17 | ↓ -1 |
| cosine.ts | 14 | 13 | ↓ -1 |
| DebugConsole.tsx | 125 | 123 | ↓ -2 |
| QueryPanel.tsx | 274 | 268 | ↓ -6 |
| ContentPanel.tsx | 155 | 150 | ↓ -5 |
| ProviderConfig.tsx | 339 | 346 | ↑ +7 |
| voyage.ts | 99 | 100 | ↑ +1 |
| hooks/usePersistedState.ts | — | 20 | NEW |
| utils/storage.ts | — | 22 | NEW |
| All other backend files | — | — | = |

### Coupling Deltas

| Metric | Previous | Current | Delta |
|--------|----------|---------|-------|
| App.tsx Ce | 6 | 7 | ↑ +1 (added usePersistedState dep) |
| App.tsx I | 0.86 | 0.88 | ↑ (more unstable, expected for composition root) |
| Max Ce (any file) | 6 | 7 | ↑ +1 |
| Circular deps | 0 | 0 | = |

### Props & Function Deltas

| Metric | Previous | Current | Delta |
|--------|----------|---------|-------|
| QueryPanel props | 12 | 11 | ↓ -1 (improved) |
| App component body (lines) | ~244 | ~245 | = |
| handleQuery (lines) | ~92 | ~91 | = |
| App.tsx complexity (branches) | 33 | 33 | = |

### Score Deltas

| Dimension | Previous | Current | Delta |
|-----------|----------|---------|-------|
| Coupling | 8 | 8 | = |
| Cohesion | 7 | 7 | = |
| Modularity | 7 | 7.5 | ↑ +0.5 |
| Error Handling | 8 | 8 | = |
| Security | 8 | 8 | = |
| Type Safety | 7 | 7 | = |
| Maintainability | 7 | 7.5 | ↑ +0.5 |
| **Overall** | **7.4** | **7.6** | **↑ +0.2** |

### Issues Resolved

- No previously-remaining issues fully resolved. **R1** (App.tsx responsibilities) partially improved through usePersistedState extraction. **R2** (QueryPanel props) improved from 12→11.

### New Issues

| # | Issue | Severity |
|---|-------|----------|
| R8 | Debug console header lacks keyboard accessibility | LOW |
| R9 | localStorage data not shape-validated | LOW |
| R10 | Config loaded from server cast without validation | MEDIUM |

### Regressions

- **App.tsx Ce increased 6→7:** This is a structural trade-off, not a regression. The added dependency on `usePersistedState` replaces inline persistence logic, improving maintainability despite the higher coupling number.
- **ProviderConfig.tsx LOC increased 339→346:** Minor growth; no architectural concern.
- **No score regressions.** All dimensions held steady or improved.

---

*Report generated: 2026-02-26*  
*Tooling: Automated review via quality-check-prompt.md*  
*Previous report: 2026-02-26T18:00:00Z (post-cleanup)*
