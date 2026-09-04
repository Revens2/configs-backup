---
name: api-reverse-engineer
description: Reverse-engineer APIs from network capture and generate skills.
---

# API Reverse-Engineering & Skill Synthesis

## When to Use
- When automating complex web applications or enterprise software lacking documented public APIs.
- When an agent or user performs interactions in a browser/UI and needs to convert observed network traffic into reproducible Python clients and structured skills.
- When ingesting HAR (HTTP Archive) files or live DevTools streams to extract OpenAPI 3.1 specifications.

## Prerequisites
- Python 3.10+ with `hermes-capture-mcp` installed.
- Access to browser DevTools / CDP session or exported `.har` recording.
- Target domain whitelisted if operating under strict SSRF policies.

## Available Tools & MCP Operations
1. `capture_start(session_id, allowed_domains)`: Initializes continuous recording and returns browser injection script.
2. `capture_record_request(session_id, method, url, headers, body, response_status, response_body)`: Ingests traffic pairs into the circular supervisor buffer.
3. `capture_stop(session_id)`: Finalizes session and clusters discovered endpoints.
4. `analyze_har(har_content_or_path, filter_static)`: Reverse-engineers routes, variable path parameters, and JSON schemas from HAR files.
5. `generate_api_wrapper(har_content_or_path, session_id, client_name, output_dir)`: Generates typed async `httpx` Python clients and OpenAPI 3.1 definitions.
6. `synthesize_skill(har_content_or_path, session_id, skill_name, description, output_dir)`: Generates complete `agentskills.io` packages (`SKILL.md`, `references/`, `scripts/`).

## Step-by-Step Workflow
1. **Initiate Capture**:
   Start a session with domain filtering to isolate application traffic:
   ```json
   {
     "session_id": "demo_session",
     "allowed_domains": ["api.target-app.com"]
   }
   ```
2. **Execute Demonstration / Ingest Traffic**:
   Perform manual or automated UI actions while recording XHR/Fetch traffic.
3. **Cluster Endpoints & Extract Schemas**:
   Stop capture or run `analyze_har` to compute generalized path templates (`/api/v1/projects/{project_id}`) and request/response JSON schemas.
4. **Generate Stubs & Skill Package**:
   Export the generated Python wrapper and standardized skill package:
   ```bash
   hermes-capture-mcp synthesize_skill --skill-name "target-app-automation" --output-dir "./skills"
   ```

## Pitfalls & Edge Cases
- **Dynamic Nonces & Timestamps**: Ensure query parameter nonces (`_t=1723...`) are identified as non-essential or parameterized.
- **SSRF & Metadata Protection**: Never allow capture targets on AWS/GCP metadata (`169.254.169.254`) or unintended internal subnets.
- **Credential Leakage**: Ensure the built-in `Redactor` strips Bearer tokens, cookies, and passwords before persisting logs.

## Verification & Sanity Check
Test the generated client using the standalone test runner:
```bash
python scripts/api_client.py
```
