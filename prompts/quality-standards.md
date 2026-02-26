# Quality Standards

These standards apply to all code written in this project. Follow them when implementing new features, refactoring, or reviewing code.

---

## 1. Coupling & Cohesion

**Goal:** Modules should be loosely coupled and highly cohesive.

- **High cohesion**: Every module, class, or component should have a single clear responsibility. If you struggle to describe what it does in one sentence without "and", it likely needs splitting.
- **Low coupling**: Modules should depend on abstractions (interfaces, types), not on concrete implementations. Changes to one module should not ripple through unrelated modules.
- **Stable Dependencies Principle**: Depend in the direction of stability. Volatile modules (UI, orchestration) may depend on stable modules (types, interfaces, utils) — never the reverse.
- **Measure**: Keep efferent coupling (Ce) per module ≤ 5. If a component takes more than 7 props, consider extracting a context, hook, or sub-component.

## 2. Connascence

**Goal:** Minimize the strength and scope of connascence between modules.

- **Prefer weak forms**: Name-based connascence (sharing a type name or function signature) is acceptable. Avoid stronger forms — especially connascence of timing, position, or algorithm.
- **Localize strong connascence**: When two pieces of code must change together (e.g. matching request/response shapes), co-locate them or share a single type definition.
- **Eliminate implicit contracts**: If a frontend function builds a request body and a backend function parses it, both should reference a shared type or at minimum a documented interface — never rely on convention alone.
- **Reduce connascence of meaning**: Don't use magic strings or sentinel values without a named constant (e.g. `ALL_MODELS_ID` instead of `'__all__'`).

## 3. Code Smells

**Goal:** Write code that communicates intent clearly and resists decay.

Avoid these smells actively:

| Smell | Guideline |
|-------|-----------|
| **Long function** | Functions should do one thing. Target ≤ 30 lines of logic (JSX markup doesn't count). Extract helpers aggressively. |
| **Long parameter list** | More than 4 parameters → use an options object or decompose the call site. |
| **Duplicate code** | If the same pattern appears twice, extract it. Three times is too late. |
| **Feature envy** | A function that accesses another module's data more than its own belongs in that other module. |
| **Primitive obsession** | Use domain types (`Provider`, `ContentItem`) instead of raw strings and objects. |
| **Dead code** | Remove unused imports, variables, functions, and types immediately. Don't comment out code. |
| **Deep nesting** | More than 3 levels of nesting → extract an early return, helper function, or guard clause. |
| **Shotgun surgery** | If adding a feature requires touching many unrelated files, the abstraction boundaries are wrong. |

## 4. Functions & Abstraction

**Goal:** Small functions at the right level of abstraction.

- **Single level of abstraction**: A function should operate at one level. Don't mix high-level orchestration (what to do) with low-level mechanics (how to do it) in the same function body.
- **Descriptive names over comments**: A well-named `buildEmbedContent(item)` needs no comment explaining what it does. If you need a comment, the name is wrong.
- **Extract, don't inline**: When a block of code inside a function has a purpose you can name, extract it as a named function — even if it's only called once. This creates a table of contents for the reader.
- **Pure where possible**: Prefer pure functions (same inputs → same outputs, no side effects). Isolate side effects (API calls, state mutations) to the edges.
- **Limit function length**: Target ≤ 30 lines of logic. Components with JSX may be longer, but the logic portion before the `return` should be short.

## 5. Error Handling

- Validate inputs at system boundaries (API endpoints, user input). Don't let bad data propagate deep before failing.
- Use descriptive error messages that help the developer fix the problem ("Voyage API key is required" not "invalid config").
- Catch errors at the level that can handle them. Don't catch-and-ignore unless explicitly intended (and add a comment if so).
- Always surface errors to the user in some form (error banner, debug console, toast).

## 6. Type Safety

- Use TypeScript's type system to prevent bugs at compile time. Avoid `any`, `as unknown as`, and type assertions unless truly necessary.
- Validate external data (API responses, user input, file reads) before casting to typed shapes.
- Prefer union types and discriminated unions over boolean flags for mutually exclusive states.

## 7. File & Module Organization

- **One concept per file**: A service file exports one class. A utility file exports related pure functions. A component file exports one primary component (internal sub-components are fine).
- **Flat over nested**: Prefer `components/QueryPanel.tsx` over `components/query/panel/QueryPanel.tsx`. Only introduce nesting when a directory has 10+ files.
- **Index files are optional**: Only add `index.ts` barrels when re-exporting would genuinely simplify imports. Don't create barrel files for 2-3 modules.

---

## Applying These Standards

When writing or reviewing code, ask yourself:

1. Can I describe this module's purpose in one sentence?
2. If I change this, how many other files need to change?
3. Would a new team member understand this function without reading the rest of the file?
4. Is this function doing one thing, or two things sequenced together?
5. Am I depending on a concrete implementation where an abstraction would do?

When in doubt, prefer simplicity over cleverness, explicitness over magic, and smaller modules over larger ones.

## 8. Security

**Goal:** No credentials, secrets, or sensitive data in source code or version control.

- Never hardcode API keys, tokens, passwords, or connection strings. Use encrypted configuration (`backend/config/credentials.enc`) or environment variables.
- Ensure `.gitignore` covers all credential files (`*.key`, `*.pem`, `*.enc`, `.env*`) and verify nothing sensitive is tracked.
- Never log credentials to console or include them in error messages sent to clients.
- Validate credential format and presence at system boundaries before use.
- Review file permissions on key material — restrict to owner-only access (600/400).

For a full security audit, run the **[Security Review Prompt](security-review-prompt.md)**.
