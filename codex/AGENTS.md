# Codex global instructions

These instructions are the Codex adaptation of the shared agent configuration. The canonical
working rules are kept in the repository root `AGENTS.md`; this copy is archived here so the
Codex-specific source is available with the backup.

- Keep the working tree safe and preserve unrelated changes.
- Never commit credentials, tokens, private keys, `.env` files, auth databases, transcripts, or runtime state.
- Use documented SSH aliases and NetBird for infrastructure; do not guess hosts or credentials.
- Use plans and durable progress for multi-step work.
- Verify changes with relevant tests, typechecks, builds, or safe service checks.
- Do not push, deploy, merge, or communicate externally without explicit user scope.
