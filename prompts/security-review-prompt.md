# Security Review Prompt

Use this prompt with an AI coding assistant (e.g. Cursor Agent) to audit the project for credential leaks, secret exposure, and security misconfigurations.

---

## Prompt

```
Run a comprehensive security review of this project focused on credentials, secrets, and sensitive data exposure. Follow these exact steps:

### Step 1: Credential & Secret Scan

Scan all files in frontend/src/, backend/src/, backend/config/, and the project root (exclude node_modules, .git, package-lock.json). For each file, check for:

1. **Hardcoded secrets**: API keys, tokens, passwords, connection strings, private keys, or any string that resembles a credential (long hex/base64 strings, AWS key patterns like AKIA*, bearer tokens, etc.).
2. **Placeholder leakage**: Verify that placeholder text (e.g. "AKIA...", "pa-...") does not contain actual key fragments or partial secrets.
3. **Environment variable misuse**: Check that secrets referenced via process.env are never assigned default fallback values that contain real credentials.
4. **Embedded certificates or keys**: Look for PEM blocks, SSH keys, or JWK material inlined in source files.
5. **Logging of secrets**: Check that API keys, tokens, or credentials are never logged to console, written to log files, or included in error messages sent to the client.

### Step 2: Git & Version Control Audit

1. **Gitignore coverage**: Verify that .gitignore (root and any subdirectory-level) excludes:
   - All credential files (master.key, credentials.enc, *.pem, *.key)
   - Environment files (.env, .env.local, .env.production, etc.)
   - node_modules/
   - Log directories
   - OS artifacts (.DS_Store, Thumbs.db)
2. **Git history check**: Run `git log --all --diff-filter=A -- '*.key' '*.pem' '*.env' '*credentials*' '*secret*'` to verify no credential files were ever committed and later removed.
3. **Tracked file check**: Run `git ls-files` and verify no credential files appear in the tracked file list.

### Step 3: Configuration Security

1. **Encryption at rest**: Verify that stored credentials (credentials.enc) use authenticated encryption (AES-256-GCM or equivalent) and that the master key is stored separately with restricted file permissions.
2. **File permissions**: Check that master.key and credentials.enc have restrictive permissions (600 or 400, not world-readable).
3. **Key derivation**: Assess whether the master key is raw or derived via a proper KDF (PBKDF2, scrypt, Argon2).
4. **Transport security**: Check that credentials sent between frontend and backend are transmitted only over localhost or encrypted channels, and never included in URL query parameters.

### Step 4: Runtime Security

1. **Input validation**: Verify that API keys and credentials received from the frontend are validated before use (format checks, length, expected patterns).
2. **Error exposure**: Ensure error responses do not leak internal paths, stack traces, or credential fragments.
3. **CORS configuration**: Check that CORS is appropriately restrictive (not wildcard * in production).
4. **Dependency audit**: Run `npm audit` in both frontend/ and backend/ and report any HIGH or CRITICAL vulnerabilities.

### Step 5: Score & Report

Rate each dimension on a 1-10 scale with a one-sentence rationale:
- Secret Management
- Gitignore & VCS Hygiene
- Encryption & Key Management
- Transport Security
- Input Validation & Error Handling
- Dependency Security
- Overall Security Posture

### Step 6: Compare with Previous Report

Read the most recent report in `logs/securityreview/` (the file with the latest date in its name). Compare:
1. **Issues resolved** since last report
2. **New issues** introduced
3. **Score deltas** for each dimension
4. **Regressions** — flag any dimension that got worse

### Step 7: Write Report

Write the report to `logs/securityreview/YYYY-MM-DD_HHmm_security-report.md` using today's date and current time (24h format). Use the same structure as any previous report for comparability. Include a "## Comparison with Previous Report" section if a prior report exists.

### Output Format

The report must include these sections in order:
1. Credential & Secret Scan Results (per-file findings or clean confirmation)
2. Git & Version Control Audit
3. Configuration Security Assessment
4. Runtime Security Assessment
5. Dependency Audit Summary
6. Issue Summary (severity: CRITICAL / HIGH / MEDIUM / LOW)
7. Security Scores (dimension scores table)
8. Comparison with Previous Report (if applicable)
```

---

## Notes

- Reports are named `YYYY-MM-DD_HHmm_security-report.md` for chronological ordering.
- Run this review before every release and after adding new provider integrations or credential handling code.
- If this is the first run (no previous report exists), skip the comparison section.
- The prompt is designed to be copy-pasted directly into a Cursor Agent chat.
