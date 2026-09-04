# Architecture Reference: Hermes Capture & API Reverse-Engineering

## Architectural Overview

This system ports and standardizes the reverse-engineering and network observation subsystem of **NousResearch Hermes-Agent** into a modular architecture:

```
┌────────────────────────────────────────────────────────┐
│                   User / Agent UI Action               │
└───────────────────────────┬────────────────────────────┘
                            │ (DevTools / CDP / HAR)
                            ▼
┌────────────────────────────────────────────────────────┐
│         CDPSupervisor & Injected Sniffer JS            │
│  - Monkey-patches window.fetch & XMLHttpRequest        │
│  - Synthetic Dialog Bridge (hermes-dialog-bridge)      │
│  - Thread-Safe Ring Buffer (max 1000 items)            │
└───────────────────────────┬────────────────────────────┘
                            │ (Clean & Redacted Streams)
                            ▼
┌────────────────────────────────────────────────────────┐
│          SecurityGuard & Multi-Pattern Redactor        │
│  - SSRF Guard (blocks AWS/GCP metadata & private IPs)  │
│  - Strips JWTs, Bearer tokens, Cookies, API Keys       │
└───────────────────────────┬────────────────────────────┘
                            │ (HAR 1.2 Data)
                            ▼
┌────────────────────────────────────────────────────────┐
│              HARParser & EndpointClusterer             │
│  - Generalizes dynamic path segments (IDs, UUIDs)      │
│  - Infers parameter types (path, query, header)        │
│  - Deduces JSON schemas for request/response payloads  │
│  - Detects GraphQL queries and mutations               │
└───────────────────────────┬────────────────────────────┘
                            │ (Endpoint Definitions)
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│        APIGenerator       │ │       SkillBuilder       │
│ - Async httpx client      │ │ - agentskills.io SKILL.md│
│ - OpenAPI 3.1.0 JSON/YAML │ │ - references/ & scripts/ │
└───────────────────────────┘ └──────────────────────────┘
```

## Key Invariants
1. **SSRF Guard**: Strict prohibition of link-local (169.254.0.0/16) and cloud metadata hostnames (`metadata.google.internal`).
2. **Redaction First**: All intercepted URLs, headers, bodies, and responses pass through `Redactor` before entering the ring buffer or HAR output.
3. **Deterministic Clustering**: Endpoints are grouped by `(method, base_url, path_pattern)` to eliminate duplicate route signatures.
4. **AgentSkills.io Standards**: Generated `SKILL.md` strictly adheres to character limits and mandatory Markdown sections.
