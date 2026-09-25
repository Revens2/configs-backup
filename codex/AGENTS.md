# Codex global instructions

* Keep the working tree safe and preserve unrelated changes.
* Never commit credentials, tokens, private keys, `.env` files, auth databases, transcripts, or runtime state.
* Use documented SSH aliases and NetBird for infrastructure; never guess hosts or credentials.
* Use plans and durable progress only for genuinely multi-step or long-running work.
* Verify changes with the narrowest relevant tests, typechecks, builds, or safe service checks.
* Do not push, deploy, merge, or communicate externally without explicit user scope.
* Delegate only when it provides meaningful parallelism, isolates large/noisy context, or offloads bounded repetitive work. Do not delegate trivial work already localized in the current context.
* Keep tool and subagent output concise: return conclusions, relevant paths/lines, verification status, and blockers instead of raw dumps.
* When shell work requires RTK conventions, read `C:\Users\Juliann\.codex\RTK.md` before proceeding.
