# Feature Log Prompt

Use this prompt after implementing a new feature to create its iteration log.

---

## Prompt

```
After completing the feature, create a feature iteration log:

1. Read the template at `logs/iterations/TEMPLATE-new-feature.md`.
2. Read the existing feature logs in `logs/iterations/` to determine the next sequential ID number
   and to understand the dependency graph (which features this new one depends on or is consumed by).
3. Create a new file at `logs/iterations/NN-feature-name.md` where NN is the next number and
   feature-name is a short kebab-case name.
4. Fill in every section of the template:
   - **Description**: What the feature does and why, in 2-3 sentences.
   - **User-Facing Behavior**: Every observable interaction, including edge cases.
   - **Implementation**: List every source file touched/created, organized by frontend/backend.
     Include the file's specific role for this feature. Add key types, data flow diagram,
     and error handling details.
   - **Dependencies**: Which existing features (by ID) this depends on, and which depend on it.
   - **Notes**: Design decisions, trade-offs, limitations, ideas for improvement.
5. Be precise: reference actual file paths, type names, function names, and API endpoints.
   Don't describe what "could" be — describe what IS implemented.
6. Set Status to "Complete" if the feature is fully working, or "In Progress" if not.
```

---

## When to Use

Create a feature log for each of these:

- **New user-facing capability** (e.g. new UI panel, new action, new data export)
- **New integration** (e.g. new embedding provider, new storage backend)
- **Significant architectural change** (e.g. new abstraction layer, changed data flow)

Do NOT create a feature log for:

- Bug fixes (unless they fundamentally change behavior)
- Code cleanup / refactoring (covered by quality reports)
- Dependency updates

## File Naming

`NN-short-kebab-name.md` — examples:
- `10-openai-provider.md`
- `11-batch-import.md`
- `12-embedding-visualization.md`
