# Feature: Encrypted Credential Persistence

**ID:** 02  
**Added:** 2026-02-26 (initial release)  
**Status:** Complete

---

## Description

Persists provider credentials to disk using AES-256-GCM encryption with PBKDF2 key derivation. A randomly generated master key is stored in a local file with restricted permissions. The user explicitly triggers saving via a button in the sidebar.

## User-Facing Behavior

- "Save credentials to disk" button at the bottom of the sidebar.
- Status feedback: Saving... → Saved (encrypted) → resets to idle after 2s.
- On app load, saved config is automatically loaded and merged with defaults.
- Encryption details shown: "AES-256-GCM encrypted, stored locally".

## Implementation

### Backend

| File | Role |
|------|------|
| `backend/src/services/SecureConfigStore.ts` | Core encryption service — initialize, encrypt, decrypt, save, load, delete |
| `backend/src/index.ts` | REST routes: `GET /api/config`, `POST /api/config`, `DELETE /api/config` |

### Frontend

| File | Role |
|------|------|
| `frontend/src/App.tsx` | `loadSavedConfig()` on mount, `persistConfig()` via save button, `handleSaveConfig` with status |
| `frontend/src/components/ProviderConfig.tsx` | Save button UI with status indicator |

### Encryption Details

| Parameter | Value |
|-----------|-------|
| Algorithm | AES-256-GCM |
| Key derivation | PBKDF2-HMAC-SHA256, 100,000 iterations |
| Salt | 32 bytes, random per encryption |
| IV | 16 bytes, random per encryption |
| Auth tag | 16 bytes |
| Master key | 32 bytes, random, stored in `config/master.key` (mode 0o600) |
| Encrypted file | `config/credentials.enc` (mode 0o600) |

### Wire Format

Encrypted file stores: `base64(salt ‖ iv ‖ authTag ‖ ciphertext)`

### API Routes

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/api/config` | Returns `{ saved: boolean, config: object }` |
| POST | `/api/config` | Deep-merges with existing config, encrypts, saves |
| DELETE | `/api/config` | Removes `credentials.enc` |

### Security Measures

- Prototype pollution guard in `deepMerge` (skips `__proto__`, `constructor`, `prototype`).
- All file I/O is async (`fs/promises`) to avoid blocking the event loop.
- `.gitignore` excludes `master.key` and `credentials.enc`.
- Corrupt config warning logged; silently falls back to empty object on merge.

## Dependencies

- Depends on: Feature 01 (Provider Configuration) for the `ProviderSettings` shape.
