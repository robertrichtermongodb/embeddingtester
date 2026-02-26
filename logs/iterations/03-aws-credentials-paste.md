# Feature: AWS Credentials Paste Panel

**ID:** 03  
**Added:** 2026-02-26 (initial release)  
**Status:** Complete

---

## Description

A collapsible panel inside the Bedrock configuration that allows pasting an AWS credentials profile string (from `~/.aws/credentials` or AWS SSO portal "Copy credentials"). The panel parses the text and auto-fills the credential fields.

## User-Facing Behavior

- Expandable "Paste credentials profile" panel with orange accent (Bedrock color).
- Textarea accepts multi-line credential blocks.
- "Apply" button parses and fills matching fields (Access Key ID, Secret Access Key, Session Token, Region).
- Success message lists which fields were applied; error message if nothing was found.
- "Cancel" clears the textarea and collapses the panel.

## Implementation

### Frontend

| File | Role |
|------|------|
| `frontend/src/components/ProviderConfig.tsx` | `CredentialsPastePanel` component + `parseAwsCredentials()` parser |

### Parser Logic (`parseAwsCredentials`)

- Splits input by newlines.
- Skips empty lines, `[profile]` headers, and `#` comments.
- Splits each line on `=`, normalizes key to lowercase.
- Maps: `aws_access_key_id` → `accessKeyId`, `aws_secret_access_key` → `secretAccessKey`, `aws_session_token` → `sessionToken`, `region` → `region`.

### Accepted Formats

```ini
[my-profile]
aws_access_key_id=ASIA...
aws_secret_access_key=...
aws_session_token=...
region=us-east-1
```

Also handles `export AWS_ACCESS_KEY_ID=...` style from SSO portal (the `=` split still works on the value portion).

## Dependencies

- Depends on: Feature 01 (Bedrock config fields to fill).
