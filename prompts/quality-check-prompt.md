# Code Quality Check Prompt

Use this prompt with an AI coding assistant (e.g. Cursor Agent) to rerun the quality assessment and compare against the last report.

---

## Prompt

```
Run a systematic code and architecture quality review of this project. Follow these exact steps:

### Step 1: Gather Metrics

Scan all source files in frontend/src/ and backend/src/ (exclude node_modules). Collect:

1. **File inventory**: List every .ts/.tsx file with its line count. Compute totals by frontend/backend.
2. **Coupling**:
   - For each source file, list its project-internal imports (efferent coupling, Ce).
   - For each source file, count how many other files import it (afferent coupling, Ca).
   - Compute instability: I = Ce / (Ca + Ce) for each file.
   - Check for circular dependencies.
3. **Cohesion**:
   - For each module/class, assess single-responsibility (GOOD / OK / NEEDS WORK).
   - For classes with state, count how many methods share that state (LCOM indicator).
4. **Modularity**:
   - Count props for each React component.
   - Identify the top 5 longest functions by line count.
   - Count branching statements (if/else/switch/catch + ternaries) per file as a cyclomatic complexity proxy.
5. **Architecture**:
   - Assess layer separation (types → utils → components → app; interfaces → services → routes).
   - Check extensibility (how easy to add a new provider, model, content type).
   - Identify any implicit contracts (untyped API boundaries, etc).
6. **Issues**:
   - Scan for: dead code, unsafe casts, missing error handling, security concerns, unvalidated inputs, potential race conditions, accessibility gaps.
   - Classify each as HIGH / MEDIUM / LOW severity.

### Step 2: Score

Rate each dimension on a 1-10 scale with a one-sentence rationale:
- Coupling
- Cohesion
- Modularity
- Error Handling
- Security
- Type Safety
- Maintainability
- Overall (weighted average)

### Step 3: Compare

Read the most recent report in `logs/codequalityreview/` (the file with the latest date in its name). Compare:

1. **Metric deltas**: For each measurable metric (LOC, file count, coupling scores, longest functions, complexity indicators, prop counts), show the change (↑/↓/=).
2. **Score deltas**: For each quality dimension, show previous → current and the delta.
3. **Issues resolved**: Which issues from the previous report's "Remaining" list are now fixed?
4. **New issues**: Any new issues introduced since the last report?
5. **Regressions**: Did any metric or score get worse? Flag these explicitly.

### Step 4: Write Report

Write the new report to `logs/codequalityreview/YYYY-MM-DD_HHmm_quality-report.md` using today's date and current time (24h format). Use the same structure as the previous report so reports are directly comparable. At the end, add a "## Comparison with Previous Report" section containing the deltas from Step 3.

### Output Format

The report must include these sections in order:
1. Project Overview (file counts, LOC table)
2. Coupling Metrics (Ca, Ce, Instability, circular dep check)
3. Cohesion Metrics (SRP assessment, LCOM indicators)
4. Modularity Metrics (props sizes, longest functions, complexity indicators)
5. Architecture Assessment (layer diagram, extensibility)
6. Issue Summary (resolved + remaining)
7. Quality Scores (dimension scores table)
8. Comparison with Previous Report (deltas)
```

---

## Notes

- Reports are named `YYYY-MM-DD_HHmm_quality-report.md` for chronological ordering (multiple reports per day are preserved).
- The comparison section makes it easy to track quality trends over time.
- If this is the first run (no previous report exists), skip the comparison section.
- The prompt is designed to be copy-pasted directly into a Cursor Agent chat.
